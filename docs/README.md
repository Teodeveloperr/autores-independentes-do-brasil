# Documentação da plataforma

Atualizada em 28/10/2026. Se o código divergir deste texto, **vale o código**: corrija o texto no mesmo commit.

## Por onde começar

| Quero... | Leia |
|---|---|
| entender como as peças se encaixam | [arquitetura.md](arquitetura.md) |
| entender para onde vai o dinheiro de cada venda e assinatura | [fluxos-de-dinheiro.md](fluxos-de-dinheiro.md) |
| entender os e-books, do PDF do autor à leitura online | [ebooks.md](ebooks.md) |
| operar o sistema: deploy, chaves, cron, ofertas, erros | [operacao.md](operacao.md) |
| rodar o projeto na minha máquina | [`../README.md`](../README.md) |
| saber o que cada variável de ambiente faz | [`../.env.example`](../.env.example) |

## Onde está cada regra de negócio

As decisões que mudam com mais frequência estão em **poucos lugares**. Mudar o valor lá basta; o resto do
sistema acompanha.

| Decisão | Valor hoje | Onde mudar |
|---|---|---|
| Preços dos planos (mensal, semestral, anual) | Essencial R$ 29,90 · Premium R$ 49,90 · Premium+ R$ 900/ano | `PLANOS_PAGOS` em `lib/plans.ts` |
| Comissão da plataforma sobre vendas de livro | Essencial 25% · Premium e Premium+ 10% | `COMISSAO_PERCENTUAL` em `lib/plans.ts` |
| Quais planos podem vender livros e e-books | Essencial, Premium e Premium+ | `PLANOS_COM_VENDA` em `lib/plans.ts` |
| Oferta de desconto no Premium+ (Pix / cartão à vista) | 10% (Black Friday) | `PREMIUM_PLUS_DESCONTO_PERCENTUAL` e `PREMIUM_PLUS_OFERTA_NOME` em `lib/plans.ts` (`0` encerra a oferta) |
| Parte do Premium+ que vai para o parceiro | 46,8% do valor pago (R$ 421,20 de R$ 900) | `PREMIUM_PLUS_VALOR_BASE_CENTAVOS` e `PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS` em `lib/plans.ts` |
| Frete dos livros físicos | R$ 12,00 o 1º livro + R$ 6,00 por livro adicional do mesmo autor | `app/checkout/actions.ts` |
| Prazos do cron (lembrete, liberação, abandono) | 3 dias · 7 dias · 3 dias | constantes no topo de `app/api/cron/processar-pedidos/route.ts` |
| Horário do cron | 04:00 UTC (01:00 em Brasília) | `vercel.json` |
| Limites do PDF do e-book | 200 MB, 600 páginas, 4 MB por página convertida | `lib/ebook.ts` |
| Aparelhos simultâneos e duração da sessão do leitor | 2 aparelhos · 30 dias | `MAX_APARELHOS` e `SESSAO_DIAS` em `lib/leitorAuth.ts` |
| Período do tema sazonal | 27/10 a 03/11/2026 | `lib/halloween.ts` |

## Glossário

- **Repasse**: transferência por Pix do dinheiro de uma venda para o autor (ou da fatia do parceiro).
- **Disponível (`disponivelEm`)**: a Asaas liberou o saldo para movimentação. No **Pix** é quase imediato; no
  **cartão** só cerca de 32 dias depois (**D+32**). Nenhum repasse sai antes disso.
- **Líquido**: valor depois da tarifa da Asaas. A comissão do plano incide sobre o líquido real.
- **Premium+**: plano anual; uma parte de cada pagamento vai ao **parceiro**, por Pix automático.
- **Leitor**: quem comprou um e-book. Tem conta própria, separada da de autor e da de administrador.
- **Pedido (`Order`)**: uma linha por livro comprado; compras com vários livros compartilham um `grupoPedidoId`
  e uma única cobrança na Asaas.
