# Guia de operação

Para quem mantém o sistema no dia a dia: publicar, trocar chaves, encerrar ofertas, entender e resolver erros.

## Regras de ouro

1. **O banco local costuma ser o de produção.** Se o seu `.env.local` aponta para o banco de produção, tudo que você grava
   localmente é gravado em produção. Use só registros de teste (e-mails `@example.invalid`) e apague-os ao final.
2. **Nunca chame `/api/cron/*` ou o webhook da Asaas apontando para produção a partir da sua máquina.** O cron faz repasses
   (Pix) de verdade; o webhook ativa planos e libera e-books.
3. **Dinheiro: simular antes, aplicar depois** (ver [Corrigindo dados em produção](#corrigindo-dados-em-produção)).
4. **Nunca coloque chaves em arquivo versionado nem em mensagem.** `.env.example` só tem nomes.

## Publicar (deploy)

- O deploy é **automático**: um `git push` na branch `main` do repositório `Teodeveloperr/autores-independentes-do-brasil`
  dispara o build na Vercel (projeto `autores-independentes-do-brasil`).
- O build é `prisma generate && prisma migrate deploy && next build`. Se o build falhar, a Vercel **mantém a versão anterior no ar**.
- Antes de fazer push: `npx tsc --noEmit` deve passar. `next build` local só funciona em drive NTFS (ver `README.md`).
- Páginas dinâmicas: um deploy novo vale na hora, mas **o navegador de quem já está no site pode precisar de Ctrl+F5**.

## Migrações do banco

Cada pasta em `prisma/migrations/` é aplicada **uma vez**, na ordem, pelo `prisma migrate deploy` do build.

1. Faça a migração **aditiva** (nova coluna com valor padrão, nova tabela). Evite renomear/apagar o que o código antigo ainda usa:
   durante o deploy, o código antigo e o banco novo convivem por alguns instantes.
2. Escreva o SQL em `prisma/migrations/<número>_<nome>/migration.sql` e atualize `schema.prisma`.
3. **Aplicar em produção exige autorização explícita** de quem responde pelo sistema. Como o build aplica sozinho, uma
   migração commitada já é uma migração em produção.
4. Não há "desfazer" automático: reverter é uma nova migração.

## Variáveis de ambiente e chaves

Lista completa e função de cada uma: [`.env.example`](../.env.example). Configure em **Vercel → Project → Settings →
Environment Variables** (Production e Preview).

| Chave | Onde obter | Cuidado ao trocar |
|---|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32` | derruba **todas** as sessões abertas de autor e admin |
| `ASAAS_API_KEY` | Asaas → Integrações → API | trocar na Vercel e fazer redeploy |
| `ASAAS_WEBHOOK_TOKEN` | gerado por nós | o **mesmo valor** na Vercel e no webhook da Asaas, senão todo webhook é recusado (401) |
| `CRON_SECRET` | gerado por nós | a Vercel usa esta variável ao chamar os crons |
| `RESEND_API_KEY` | resend.com | o domínio de envio precisa estar verificado |
| `BLOB_READ_WRITE_TOKEN` e `EBOOKS_READ_WRITE_TOKEN` | Vercel → Storage | veja o aviso abaixo |

### Vercel Blob: dois stores

Há **dois stores** do Blob: o **público** (capas e fotos) e o **privado** `ebooks` (páginas dos e-books).

- O store privado é conectado ao projeto com o **prefixo `EBOOKS`** (`EBOOKS_READ_WRITE_TOKEN`, `EBOOKS_STORE_ID`...).
  **Não** reconecte o store privado com os nomes padrão (`BLOB_STORE_ID`, `BLOB_READ_WRITE_TOKEN`): o SDK passaria a usar o
  store privado em **todas** as chamadas e o envio de capas e fotos quebraria.
- No código dos e-books, **toda** chamada ao Blob passa `token: EBOOKS_READ_WRITE_TOKEN` explicitamente (`lib/ebookStorage.ts`).
- Trocar `BLOB_READ_WRITE_TOKEN` por engano derruba o upload de capas e fotos: faça com calma e teste o envio de uma imagem.

## Asaas: o webhook

Cadastre **um** webhook em Asaas → Integrações → Webhooks:

- **URL**: `https://autoresdobrasil.com.br/api/webhooks/asaas`
- **Token de autenticação**: o valor de `ASAAS_WEBHOOK_TOKEN`
- **Eventos**: marque **todos** os que estão na tabela de [fluxos-de-dinheiro.md](fluxos-de-dinheiro.md#7-eventos-da-asaas-que-o-sistema-trata).
  Sem `PAYMENT_REFUNDED` e `PAYMENT_CHARGEBACK_REQUESTED`, **estornos não revogam o e-book**.

## O que fazer quando...

| Situação | O que fazer |
|---|---|
| Repasse ao autor com erro "Autor sem chave Pix cadastrada" | peça ao autor para cadastrar a chave em **Painel → Configurações**; o cron tenta de novo sozinho |
| Repasse do parceiro com erro "Chave Pix do parceiro não configurada" | cadastre em **Admin → Configurações**; sai no próximo cron |
| Pagamento aparece na Asaas e não no sistema | **Admin → Receita → "Reconciliar com a Asaas"** lista o que falta; assinaturas faltantes podem ser registradas ali |
| Valor líquido faltando ou desatualizado | **Admin → Receita → "Atualizar valores líquidos e disponibilidade"** |
| Autor pagou e o plano não ativou | confira se os eventos do webhook estão marcados e se o webhook não está recusando (401); o Pix Automático se corrige no primeiro pagamento recebido |
| Todos os webhooks voltam 401 | `ASAAS_WEBHOOK_TOKEN` diferente entre a Vercel e a Asaas, ou ausente |
| E-book preso em "processando" | o autor fechou a página no meio do envio: ele deve **Enviar PDF** de novo (o sistema apaga os restos da tentativa) |
| Leitor diz que não recebeu o e-mail de acesso | **Admin → E-books → Reenviar e-mail de acesso** (gera link novo) |
| Suspeita de compartilhamento ou vazamento de e-book | **Admin → E-books**: revogar o acesso (a marca d'água identifica o exemplar) e/ou desconectar aparelhos |
| Estorno | o pedido vira "Cancelado" e o acesso é revogado sozinho; se o repasse já tinha saído, o pedido fica com aviso em `repasseErro` e a devolução é **pedida ao autor** |
| Cadastro "preso" em pagamento | a conta só existe depois do pagamento confirmado; cadastros pendentes são apagados em 3 dias |
| Cron não rodou | Vercel → projeto → **Cron Jobs**: veja o histórico e o erro (um `401` indica `CRON_SECRET` errado) |

## Ofertas e temas sazonais

**Encerrar a oferta do Premium+ (Black Friday)**: em `lib/plans.ts`, `PREMIUM_PLUS_DESCONTO_PERCENTUAL = 0` e deploy.
Selos, preço riscado e banner somem juntos; quem já assinou com desconto não muda.
**Nova oferta**: troque o percentual e o nome (`PREMIUM_PLUS_OFERTA_NOME`).

**Tema de Halloween**: período em `lib/halloween.ts` (`inicio`/`fim`, datas inclusive, comparadas com a data do navegador do
visitante); texto da barra em `components/halloween/BarraHalloween.tsx`. Passado o período, volta ao normal sozinho. Para uma
próxima data comemorativa, reaproveite a estrutura (`components/halloween/`, `lib/halloween*.ts`) trocando período, arte
(`public/…`) e textos; ou remova o tema por completo.

## Corrigindo dados em produção

Mexer em dados de produção é exceção. O procedimento usado até hoje (ex.: correção dos repasses do parceiro, 27/10/2026):

1. **Entenda a causa** lendo o código e os registros (somente leitura).
2. **Peça autorização explícita** de quem responde pelo sistema, dizendo exatamente o que vai mudar e quantos registros.
3. Crie uma rota **temporária**, fora do Git, com dois modos: **simular** (mostra quantos registros e de que valor para que valor,
   sem gravar) e **aplicar**. Altere **só** os campos necessários, só os registros-alvo, em **transação**.
4. **Confira a simulação**, aplique e **simule de novo**: o resultado esperado é "0 a alterar".
5. **Apague a rota temporária** e nunca a deixe em commit.

Detalhe técnico: transações interativas do Prisma têm **5 s** de limite por padrão; com muitos registros, agrupe em poucas
atualizações (`updateMany`) e passe um `timeout` maior. Uma transação que estoura o tempo é **desfeita por inteiro** (não grava nada).

## Testando com segurança

- **Dados de teste**: e-mails `@example.invalid`, nome reconhecível, e **apague tudo** depois (inclusive arquivos no Blob).
- **Asaas e Resend falsos**: aponte `ASAAS_BASE_URL` e `RESEND_BASE_URL` (esta é lida pelo próprio SDK do Resend) para um servidor local
  que imita as respostas. Assim dá para testar compra, webhook, repasse e e-mails **sem cobrar nem enviar nada de verdade**.
- **Pagamento real de teste**: use valor pequeno (Pix) e confira o repasse depois.
- **Turnstile local**: sem `TURNSTILE_SECRET_KEY` a verificação é pulada; ou use as chaves públicas de teste da Cloudflare.
- Antes de qualquer teste que grave dados, confirme **para qual banco** o `.env.local` aponta.

## Painel do administrador (`/admin`)

Visão geral · Agenda do Coletivo · Oportunidades · Galeria · Blog · Talk Show · Chat da Comunidade · **Autores** (criar, suspender,
trocar plano, excluir) · Avaliações · **Pedidos** (só leitura) · **Receita** (saldo da Asaas, receita por mês, reconciliação,
janela do parceiro Premium+) · **Contratos** (Bienal) · **E-books** (acessos e suporte) · **Segurança** (2FA) ·
**Configurações** (chave Pix do parceiro do Premium+).

## Mercado Pago (legado)

Há código de assinaturas antigas (`/api/webhooks/mercadopago`) e de vínculo de conta de autor (`/api/auth/mercadopago`). O fluxo
atual de livros e planos é o da Asaas. Mantenha as variáveis `MERCADOPAGO_*` enquanto houver assinaturas antigas ativas; antes de
remover o código, confirme que não resta nenhuma.
