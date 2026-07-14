# Autores Independentes do Brasil — plataforma

Implementação em produção (Next.js) da plataforma do coletivo Autores Independentes do
Brasil, a partir do handoff de design em `design_handoff_full_platform/` (14 telas em
`.dc.html` + `aib-data.js` como especificação de dados/comportamento).

## Stack

- **Next.js 16** (App Router, Server Actions, TypeScript)
- **Prisma 7** + **PostgreSQL** (pensado para Vercel Postgres/Neon; qualquer Postgres serve)
- **Vercel Blob** para upload de imagens (avatar, banner, capas de livro, galeria)
- **bcryptjs** para hash de senha, **jose** (JWT) + cookies httpOnly para sessão
- E-mail transacional e gateway de pagamento: **ainda não integrados** (ver "Próximos passos")

## Rodando localmente

```bash
npm install
npx prisma dev --detach     # sobe um Postgres local de desenvolvimento (sem Docker/conta)
# copie a URL impressa por "prisma dev ls" para DATABASE_URL no .env, ou use .env.example como base
npx prisma db push          # cria as tabelas a partir do schema
npx prisma db seed          # popula com autores/livros/eventos/galeria de exemplo (imagens reais)
npm run dev                 # inicia o Next.js em http://localhost:3000
```

> **Windows + drive exFAT**: o Turbopack e o Webpack do Next.js precisam criar
> symlinks/junctions em `node_modules`/`.next`, algo que o filesystem **exFAT não suporta**.
> Se o projeto estiver num drive exFAT, `next dev`/`next build` falham com erros de
> "junction point" ou "EISDIR". O script `dev` já usa `next dev --webpack` (mais tolerante),
> mas para rodar `next build` localmente é preciso que o projeto esteja num drive **NTFS**.
> Isso **não afeta o deploy na Vercel** (build roda em Linux).

Contas criadas pelo seed (senha de todos os autores de exemplo: `coletivo2026`):
`kelly.cortez@exemplo.com`, `denilson.vieira@exemplo.com`, `romulo.moraes@exemplo.com`,
`gerailson.oliveira@exemplo.com`, `arusha.oliveira@exemplo.com`. A senha do admin é
gerada aleatoriamente e impressa uma única vez no terminal ao rodar o seed.

## Deploy na Vercel

1. **Repositório**: `git init`, commit, crie um repositório no GitHub e dê `git push`.
   Depois, em vercel.com → **Add New → Project**, importe esse repositório
   (o Root Directory do projeto é `app-autores-independentes/`, caso o repo inclua a pasta
   `design_handoff_full_platform/` também).
2. **Banco de dados**: na aba **Storage** do projeto na Vercel, crie um **Postgres**
   (Vercel Postgres/Neon). Isso preenche `DATABASE_URL` automaticamente nas env vars do
   projeto.
3. **Storage de imagens**: na mesma aba **Storage**, crie um **Blob Store**. Isso preenche
   `BLOB_READ_WRITE_TOKEN` automaticamente.
4. **Variáveis de ambiente** (Project Settings → Environment Variables), para Production
   *e* Preview — ver `.env.example` para a lista completa:
   - `DATABASE_URL` (preenchida pela integração de Storage)
   - `BLOB_READ_WRITE_TOKEN` (preenchida pela integração de Storage)
   - `AUTH_SECRET` — gerar com `openssl rand -base64 32`
   - `NEXT_PUBLIC_SITE_URL` — a URL final do site (ex: `https://autoresindependentes.com.br`)
   - `ADMIN_SEED_EMAIL` / `ADMIN_SEED_PASSWORD` — só usadas pelo seed (passo 6)
   - `RESEND_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — deixar em branco por
     enquanto (e-mail e pagamento ainda não estão integrados, ver "Próximos passos")
5. **Migrations**: depois do primeiro deploy (ou localmente apontando `DATABASE_URL` para o
   banco de produção), rodar:
   ```bash
   npx prisma migrate deploy
   ```
6. **Seed inicial** (opcional, mas recomendado para não ir ao ar com o site vazio): rodar
   `npx prisma db seed` apontando para `DATABASE_URL` de produção. Isso cria a conta de
   admin (senha impressa no terminal — guarde) e os 5 autores/livros de exemplo com
   imagens reais.
7. **Domínio**: configurar em Project Settings → Domains.

Nenhum desses passos (criar conta na Vercel/GitHub, gerar tokens, configurar domínio) pode
ser feito por mim — são ações que só o dono da conta consegue autorizar.

## Estrutura

- `app/` — rotas (App Router). Cada página pública corresponde a um `.dc.html` do handoff.
- `app/painel/`, `app/admin/` — áreas autenticadas (autor e administrador), cada uma com seu
  `actions.ts` (Server Actions) e a UI principal em `components/painel/` / `components/admin/`.
- `lib/db.ts` — cliente Prisma (via driver adapter `@prisma/adapter-pg`, exigido pelo Prisma 7).
- `lib/session.ts`, `lib/auth.ts` — sessão (JWT em cookie httpOnly) e checagens de autenticação.
- `lib/email.ts` — stub de e-mail transacional (loga no console; trocar pela chamada real do
  Resend quando a chave estiver configurada).
- `app/api/upload/route.ts` + `lib/upload-client.ts` + `hooks/useImageUpload.ts` — upload
  direto do navegador para o Vercel Blob.
- `prisma/schema.prisma` — modelo de dados completo (authors, books, eventos, fotos, pedidos,
  conversas/mensagens, avaliações, agenda/galeria institucional, admin, tokens de redefinição
  de senha).
- `prisma/seed.ts` — popula o banco com autores/livros/eventos/galeria reais (imagens em
  `public/seed/`, copiadas da pasta original do usuário).

## Próximos passos (fora do escopo desta etapa, por pedido do usuário)

- **E-mail transacional**: integrar Resend em `lib/email.ts` (a assinatura da função já é a
  definitiva usada pelo fluxo de recuperação de senha).
- **Pagamentos**: nenhum gateway está integrado — os CTAs de plano em `/cadastro` (passo 3) e
  `/assinatura` não cobram nada de verdade. Definir com o usuário Stripe vs. Mercado Pago vs.
  Pagar.me antes de integrar.
