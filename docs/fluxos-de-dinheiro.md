# Fluxos de dinheiro

Todo pagamento passa pela **Asaas**. O sistema nunca guarda dados de cartão. Valores em **centavos inteiros**.
Este é o documento mais importante para quem mexe em preço, comissão ou repasse: erros aqui são financeiros.

## Conceitos que explicam quase tudo

- **Confirmado x disponível.** A Asaas manda dois eventos por pagamento: `PAYMENT_CONFIRMED` (o pagamento foi aprovado)
  e `PAYMENT_RECEIVED` (o saldo ficou **disponível** para movimentar). No **Pix** os dois chegam quase juntos. No
  **cartão**, o `RECEIVED` só chega cerca de **32 dias depois (D+32)**. O sistema marca `disponivelEm` só no `RECEIVED`.
- **Nenhum repasse sai antes de `disponivelEm`** (`lib/repasse.ts` consulta a Asaas e exige status `RECEIVED`).
  Se ainda não puder, não é erro: o cron tenta de novo no dia seguinte.
- **Valor líquido.** Depois da confirmação, o sistema guarda `valorLiquidoCentavos` (valor menos a tarifa da Asaas).
  A comissão do plano e o repasse usam o líquido real, não o bruto.
- **Webhook.** Quase tudo que muda de estado depois do pagamento vem de `/api/webhooks/asaas`. O webhook é
  **idempotente**: eventos repetidos não duplicam pedido, acesso nem repasse.
- **Estado do repasse** (`repasseStatus`): `pendente` → `transferido`, ou `erro` (com a mensagem em `repasseErro`).

## 1. Compra de livro físico

```
Carrinho (1 autor por vez) ─► checkout (criarPedido) ─► cobrança na Asaas (o comprador escolhe Pix ou cartão
na página da fatura) ─► pedido "Aguardando pagamento"
        │
        ▼ webhook PAYMENT_CONFIRMED/RECEIVED
   pedido "Pago" · e-mail ao comprador e ao autor (com endereço) · dinheiro fica na conta da Asaas
        │
        ▼ autor marca "Enviado" (painel)
   e-mail ao comprador com link "recebi meu livro"
        │
        ├─ comprador confirma ──► pedido "Entregue" ──► REPASSE ao autor
        └─ ninguém confirma em 7 dias ──► o cron libera o repasse sozinho ──► "Entregue"
```

- **Frete**: R$ 12,00 pelo 1º livro de cada autor + R$ 6,00 por livro adicional do mesmo autor (Correios, Registro
  Módico). Calculado no servidor (`calcularFreteCarrinho`). O comprador paga o frete junto; o frete é repassado ao autor.
- **Quem pode vender**: só autores com plano Essencial, Premium ou Premium+ e conta `ativo` (`podeVenderLivros`).
- **Repasse ao autor** = `venda líquida × (1 − comissão)` + `frete líquido`.
  Comissão da plataforma: **Essencial 25%**, **Premium e Premium+ 10%**. O frete não paga comissão.
  A tarifa da Asaas é dividida proporcionalmente entre o livro e o frete (`valorRepasseCentavosLiquido`).
- **Requisitos para repassar**: o autor ter **chave Pix** cadastrada e a cobrança estar `RECEIVED`. Sem chave, o pedido
  fica com `repasseStatus = erro` ("Autor sem chave Pix cadastrada") até o autor cadastrar; o cron tenta de novo.
- **Lembrete**: se o autor não marcar "Enviado", o comprador recebe, em até 3 dias da compra, um pedido de confirmação.
- **Pedido abandonado**: "Aguardando pagamento" há mais de 3 dias → o cron cancela a cobrança na Asaas e marca "Cancelado"
  (só se a Asaas confirmar que ainda não foi paga; se já foi, não mexe).

## 2. Compra de e-book

Igual ao físico, com estas diferenças (detalhes em [ebooks.md](ebooks.md)):

- **Sem frete e sem endereço.** Um carrinho pode misturar e-book e livro físico do mesmo autor.
- **Acesso imediato.** Quando o pagamento confirma, o pedido vira "Entregue", o **acesso é liberado** e o leitor recebe
  **um e-mail** com os títulos (e o link para criar a senha, no primeiro acesso).
- **Repasse sem esperar entrega**: sai quando a Asaas libera o saldo. Pix: na hora. Cartão: D+32 (o cron repete
  diariamente `repassarEbooksDisponiveis`). A comissão é a mesma do físico.
- **O autor não pode mudar o status** de pedido de e-book (é automático).

## 3. Estorno e chargeback

Eventos `PAYMENT_REFUNDED` e `PAYMENT_CHARGEBACK_REQUESTED` (precisam estar **marcados no webhook da Asaas**):

- os pedidos da cobrança viram **"Cancelado"**;
- o **acesso aos e-books é revogado** (motivo gravado em `AcessoEbook`);
- se o repasse ao autor **já tinha saído**, o pedido recebe um aviso em `repasseErro` e uma linha de erro no log
  (`console.error`). O sistema **não** desconta nada sozinho: a devolução do valor é **solicitada ao autor**
  (decisão de negócio). Quem opera deve conferir a Receita e falar com o autor.

## 4. Assinaturas de plano (autores)

| Plano | Mensal | Semestral | Anual |
|---|---|---|---|
| Essencial | R$ 29,90 | R$ 161,46 (6 meses com 10% de desconto) | R$ 19,90/mês = R$ 238,80 |
| Premium | R$ 49,90 | R$ 269,46 (6 meses com 10% de desconto) | R$ 39,90/mês = R$ 478,80 |
| Premium+ | só anual | — | **R$ 900,00** |

Formas de pagar (`lib/assinatura.ts`, `app/assinatura/actions.ts`, `app/cadastro/actions.ts`):

| Forma | Como funciona | Renova sozinha? |
|---|---|---|
| **Pix** | **Pix Automático**: o autor autoriza uma vez no app do banco e a Asaas debita a cada ciclo | sim |
| **Cartão à vista** | assinatura recorrente da Asaas (checkout hospedado) | sim |
| **Parcelado no cartão** | cobrança parcelada única (até 6 parcelas no semestral, até 12 no anual; não existe no mensal) | **não**: o plano vale até `planoParceladoAte`; lembrete 15 dias antes; vencido volta ao Iniciante |

- **Cadastro novo pago**: os dados ficam em `PendingSignup` e a conta **só é criada quando o webhook confirmar o pagamento**.
  Se a pessoa desistir, nada fica pendurado (o cron apaga em 3 dias e cancela a autorização na Asaas).
- **Upgrade de quem já tem conta**: `planoPendente` guarda o plano novo até o pagamento confirmar.
- **Atraso** (`PAYMENT_OVERDUE`) de assinatura recorrente: o plano cai para **Iniciante** (o plano antigo fica em
  `planoPendente` para voltar se pagar). Parcela atrasada de compra **parcelada** não derruba o plano.
- **Autorização do Pix Automático encerrada** (expirada, recusada, cancelada): plano volta ao Iniciante.
- **Concessão manual pelo admin**: plano com prazo (semestral ou anual) e sem cobrança; o cron o devolve ao Iniciante no vencimento.
- Cada pagamento recebido vira uma linha em `SubscriptionPayment` (base da tela de Receita do admin).

### Oferta Black Friday (Premium+)

`PREMIUM_PLUS_DESCONTO_PERCENTUAL` (hoje **10**) dá desconto no Premium+ pago por **Pix** ou **cartão à vista**:
**R$ 810,00** em vez de R$ 900,00. O **parcelado não tem desconto**. O desconto vale enquanto a assinatura recorrente
estiver ativa (a renovação continua em R$ 810,00 para quem contratou com a oferta).

- O preço é calculado **no servidor**, por forma de pagamento: `valorPlanoPorMetodoCentavos`.
- **Para encerrar a oferta**: `PREMIUM_PLUS_DESCONTO_PERCENTUAL = 0` em `lib/plans.ts` e deploy. Selos, preço riscado e
  banner somem juntos. Quem já assinou com desconto não é alterado.

## 5. Premium+ e o parceiro

De cada pagamento do Premium+, **46,8% vão para o parceiro** por Pix e o restante fica com a plataforma
(`lib/repasseParceiro.ts`, cron diário):

| Pagamento | Parceiro | Plataforma (antes da tarifa) |
|---|---|---|
| R$ 900,00 (anual, sem desconto) | R$ 421,20 | R$ 478,80 |
| R$ 810,00 (oferta, Pix ou cartão à vista) | R$ 379,08 | R$ 430,92 |
| parcela de R$ 75,00 (12x de R$ 900) | R$ 35,10 | R$ 39,90 |

- A fatia é **proporcional ao valor pago** (`valorParceiroPremiumPlusCentavos`), vale **para cada parcela** e para
  cada renovação. Soma das 12 parcelas de R$ 75,00 = R$ 421,20.
- **Teto de segurança**: o repasse nunca passa de 46,8% do que foi pago naquele pagamento, mesmo que o valor gravado
  seja maior. (Pagamentos antigos do parcelado foram gravados com R$ 421,20 **por parcela**; o teto impede o excesso e
  os registros foram corrigidos em 27/10/2026.)
- **Chave Pix do parceiro**: cadastrada pelo admin em **Admin → Configurações**. Sem ela, nenhum repasse sai: o
  pagamento fica `erro` ("Chave Pix do parceiro não configurada") e é retentado depois que a chave for salva.
- **Quando sai**: só depois que `disponivelEm` estiver preenchido (as parcelas do cartão liberam mais ou menos a cada 30 dias).
- A janela **Admin → Receita → "Parceiro do Premium+"** mostra o que já foi repassado, o que está liberado a repassar e o que
  aguarda a Asaas.

> **Limitação conhecida**: o card "Assinaturas líquidas" da Receita soma o Premium+ **inteiro** como receita da plataforma,
> inclusive a parte do parceiro. Para o resultado real da plataforma, use a janela do parceiro.

## 6. Contrato da Bienal

O contrato online (`/contrato-bienal`, `lib/contrato/`) gera uma cobrança na Asaas (`criarCobrancaContrato`). No
pagamento, `marcarContratoPago` marca o contrato como pago. É um fluxo separado: **atraso nesse pagamento não afeta o plano do autor**.

## 7. Eventos da Asaas que o sistema trata

Todos precisam estar **marcados no webhook** (Asaas → Integrações → Webhooks):

| Evento | Efeito |
|---|---|
| `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED` | ativa pedido/plano/acesso, registra pagamento, marca disponibilidade, dispara repasses |
| `PAYMENT_REFUNDED`, `PAYMENT_CHARGEBACK_REQUESTED` | cancela pedido e revoga e-book (ver seção 3) |
| `PAYMENT_OVERDUE` | atraso de assinatura recorrente → plano Iniciante |
| `PAYMENT_CREATED` | avisa o autor por e-mail de nova cobrança da assinatura |
| `SUBSCRIPTION_CREATED` | vincula a assinatura ao autor ou cadastro pendente |
| `PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED` | ativa o plano de quem autorizou o Pix Automático |
| `PIX_AUTOMATIC_RECURRING_AUTHORIZATION_EXPIRED / REFUSED / CANCELLED` | plano volta ao Iniciante |

O webhook responde 200 para eventos que não conhece, para a Asaas não ficar reenviando.

## Se algo no dinheiro parecer errado

1. Não altere o banco no impulso. Primeiro **entenda**: veja o pedido ou pagamento (`Order`, `SubscriptionPayment`) e o
   evento correspondente na Asaas.
2. Correção em produção exige **simulação antes** e autorização: ver [operacao.md](operacao.md#corrigindo-dados-em-produção).
