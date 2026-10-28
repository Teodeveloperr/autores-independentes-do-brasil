# Arquitetura

## Visão geral

```
Navegador ──► Vercel (Next.js 16, App Router)
                │   ├─ páginas e Server Actions ──► Postgres (Neon) via Prisma
                │   ├─ /api/webhooks/asaas ◄──────── Asaas (pagamentos, assinaturas, estornos)
                │   ├─ /api/cron/*  ◄─────────────── cron da Vercel (todo dia)
                │   └─ e-mails ───────────────────► Resend
                │
                ├─ upload de imagens ───────────────► Vercel Blob PÚBLICO  (capas, fotos, galeria)
                └─ páginas dos e-books (imagens) ───► Vercel Blob PRIVADO  (store "ebooks")
```

- A maior parte das páginas é **renderizada sob demanda** (dinâmica). Só `robots.txt`, `sitemap.xml` e o ícone são estáticos.
- Regras de negócio e integrações ficam em `lib/`. As telas (`components/`) e as rotas (`app/`) chamam `lib/`;
  nada de regra de dinheiro deve ficar dentro de componente.
- Mutações vêm de **Server Actions** (`app/**/actions.ts`, marcadas com `"use server"`). Rotas de API (`app/api/`)
  existem só para o que não cabe numa action: webhooks, cron, download binário, upload.

## Três tipos de conta, três sessões

| Conta | Cookie | Como entra | Duração |
|---|---|---|---|
| **Autor** | `aib_session` | e-mail e senha, login com Google ou passkey | 30 min de inatividade, renovada a cada requisição |
| **Administrador** | `aib_admin_session` | e-mail e senha + **código 2FA (TOTP)** quando ativado, com códigos de backup | 30 min de inatividade |
| **Leitor** (quem comprou e-book) | `aib_leitor` | e-mail e senha, ou link enviado por e-mail | 30 dias, no máximo 2 aparelhos |

- As sessões de autor e de administrador são JWT assinados com `AUTH_SECRET` (`lib/sessionCore.ts`), em cookie
  `httpOnly`. O `middleware.ts` renova a janela de inatividade a cada requisição.
- A sessão do leitor é diferente: o cookie guarda só um código aleatório e a sessão fica **no banco**
  (`LeitorSessao`, um registro por aparelho). Isso permite limitar aparelhos e derrubar sessões (`lib/leitorAuth.ts`).
- Conta de autor com status `suspenso` ou `encerrado` não entra e não aparece no site
  (`lib/auth.ts`; encerramento em [ebooks.md](ebooks.md#quando-o-autor-retira-o-e-book-ou-exclui-a-conta)).

## Proteções

- **Limite de tentativas** (`lib/rateLimit.ts`): conta tentativas por chave (IP, usuário) numa janela de tempo,
  guardadas na tabela `RateLimitAttempt`. Usado em login, cadastro, assinatura e leitura de páginas de e-book.
- **Anti-robô** (`lib/turnstile.ts`): Cloudflare Turnstile nos cadastros. Sem `TURNSTILE_SECRET_KEY` a verificação é **pulada**.
- **Webhook da Asaas**: o cabeçalho `asaas-access-token` é comparado, em tempo constante, com `ASAAS_WEBHOOK_TOKEN`;
  sem token configurado, todo webhook é recusado com 401.
- **Cron**: exige `Authorization: Bearer <CRON_SECRET>`.
- **Upload**: o navegador envia direto ao Blob (`app/api/upload`); o tipo REAL do arquivo é conferido pelos
  primeiros bytes (`lib/imagemTipo.ts`, `lib/uploadValidation.ts`), não pela extensão.
- **Senhas**: `bcryptjs` (`lib/password.ts`). Dados que chegam de fora são validados com `zod` (`lib/validation.ts`).

## Armazenamento de arquivos

| O quê | Onde | Acesso |
|---|---|---|
| capas, fotos de perfil, banner, galeria | Vercel Blob **público** (`BLOB_READ_WRITE_TOKEN`) | endereço público |
| páginas dos e-books | Vercel Blob **privado**, store `ebooks` (`EBOOKS_READ_WRITE_TOKEN`) | só pelo servidor, depois de conferir o acesso do leitor |
| contratos da Bienal (PDF) e assinaturas | no próprio banco | rota própria, só para o admin ou o contratante |

Os dois stores do Blob são **separados**: toda chamada ao store de e-books passa o token dele de forma explícita
(`lib/ebookStorage.ts`). Ver o aviso em [operacao.md](operacao.md#vercel-blob-dois-stores).

## Banco de dados

`prisma/schema.prisma` tem 31 modelos, comentados. Os grupos principais:

- **Autores**: `Author`, `AuthorEvent`, `AuthorPhoto`, `AuthorPasskey`, `PasswordResetToken`, `PortfolioEvento`, `Review`, `Conversation`/`Message`
- **Livros e pedidos**: `Book` (físico ou e-book), `Order` (uma linha por livro), `EbookPagina`
- **Leitores**: `Leitor`, `LeitorSessao`, `LeitorLink`, `AcessoEbook`
- **Assinaturas**: campos de plano e Asaas em `Author`, `SubscriptionPayment`, `PendingSignup` (cadastro que espera o pagamento)
- **Contrato da Bienal**: `ContratoBienal`, `ContratoReserva`, `ContratoConfig`
- **Institucional**: `CollectiveEvent`, `CollectiveGalleryPhoto`, `Article`, `Opportunity`, `TalkShowVideo`, `ChatMensagem`, `SiteVisit`
- **Administração**: `Admin`, `RateLimitAttempt`

**Migrações**: pasta `prisma/migrations/` (58). São **aditivas**. O `npm run build` roda `prisma migrate deploy`,
então **toda migração commitada é aplicada no banco no próximo deploy**. Procedimento seguro em [operacao.md](operacao.md#migrações-do-banco).

## Tarefas agendadas (`vercel.json`)

| Rota | Horário (UTC) | O que faz |
|---|---|---|
| `/api/cron/limpar-mensagens` | 03:00 (00:00 em Brasília) | apaga conversas do chat com mais de 7 dias |
| `/api/cron/processar-pedidos` | 04:00 (01:00 em Brasília) | ver abaixo |

`processar-pedidos` faz, nesta ordem:

1. gera o endereço amigável (`slug`) de autores que ainda não têm;
2. pedidos pagos há mais de **3 dias** sem confirmação de recebimento enviada: envia ao comprador o pedido de confirmação;
3. pedidos com confirmação enviada há mais de **7 dias**: **repassa ao autor** e marca "Entregue" (liberação automática);
4. repassa vendas de **e-book** cujo saldo já foi liberado pela Asaas;
5. repassa ao **parceiro** a fatia dos pagamentos **Premium+** já liberados;
6. cancela (na Asaas e no sistema) pedidos "Aguardando pagamento" há mais de **3 dias**;
7. apaga cadastros pendentes (`PendingSignup`) com mais de **3 dias**, cancelando a autorização na Asaas;
8. devolve ao plano Iniciante os planos concedidos pelo admin que venceram (sem mexer em quem tem assinatura paga de verdade);
9. apaga oportunidades (editais) 48 h depois do último dia de inscrição;
10. apaga rascunhos de **contrato da Bienal** nunca assinados, com mais de 48 h (guardam CPF e endereço sem necessidade);
11. avisa quem comprou plano **parcelado** que o acesso vence em breve (15 dias antes, uma única vez);
12. devolve ao plano Iniciante quem comprou **parcelado** e não renovou até o vencimento.

Cada repasse é tentado de novo na rodada seguinte se ainda não puder sair (saldo não liberado) ou se falhou.

## Tema sazonal

O tema de Halloween (`components/halloween/`, `lib/halloween*.ts`, `public/halloween/`) liga e desliga **no navegador**,
comparando a data do visitante com o período em `lib/halloween.ts`. Assim as páginas continuam em cache e não precisam
de deploy para "virar". Fica fora de `/painel`, `/admin`, `/checkout`, login e fluxos sensíveis. Para ver fora do período:
acrescente `?tema=halloween` ao endereço (vale só para a aba); `?tema=normal` desliga.
