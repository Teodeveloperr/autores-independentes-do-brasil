# Autores Independentes do Brasil — plataforma

Site e plataforma do coletivo **Autores Independentes do Brasil** (https://autoresdobrasil.com.br):
vitrine de autores e livros, venda de livros físicos e **e-books**, planos de assinatura para autores,
contrato online da Bienal do Livro, agenda, galeria, blog e chat da comunidade.

## O que a plataforma faz

| Área | Quem usa | O que tem |
|---|---|---|
| **Site público** | visitantes e leitores | home, autores, livros, perfil de autor, loja do autor, blog, agenda, galeria, oportunidades, talk show |
| **Compra** | leitores | carrinho e checkout (Pix ou cartão) de livro físico e/ou e-book, e-mail de confirmação |
| **Estante e leitura** | quem comprou e-book | conta de leitor (senha + link por e-mail), estante, leitor online com marca d'água |
| **Painel do autor** (`/painel`) | autores | perfil, livros (físicos e e-books), pedidos, vendas, eventos, galeria, planos, chave Pix |
| **Planos** (`/assinatura`) | autores | Iniciante (grátis), Essencial, Premium e Premium+ (anual) |
| **Contrato da Bienal** (`/contrato-bienal`) | autores | contrato eletrônico com assinatura, cobrança e agenda de horários no estande |
| **Administração** (`/admin`) | equipe | autores, pedidos, receita, e-books, contratos, conteúdo, segurança (2FA) |

## Stack

- **Next.js 16** (App Router, Server Actions, TypeScript) e **React 19**
- **Prisma 7** + **PostgreSQL** (Neon), via driver adapter `@prisma/adapter-pg`
- **Vercel** (hospedagem, cron, Blob público e Blob **privado** para e-books)
- **Asaas** — pagamentos (Pix, cartão, assinaturas, parcelado) e repasses por Pix
- **Resend** — e-mails transacionais · **Cloudflare Turnstile** — anti-robô nos cadastros
- **sharp** (imagens), **pdfjs-dist** (conversão do PDF do e-book no navegador), **zod** (validação),
  **jose** + cookies httpOnly (sessão), **bcryptjs** (senhas), **@react-pdf/renderer** (contrato em PDF)
- **Mercado Pago** — caminho legado (assinaturas antigas e vínculo de conta de autor); o fluxo atual
  de pagamentos é o da Asaas

## Rodando localmente

Pré-requisitos: Node 20+ e um Postgres acessível.

```bash
npm install                      # também roda "prisma generate"
cp .env.example .env.local       # preencha pelo menos DATABASE_URL e AUTH_SECRET
npx prisma migrate deploy        # aplica as migrações no banco
npx prisma db seed               # (só desenvolvimento) autores, livros e eventos de exemplo
npm run dev                      # http://localhost:3000
```

- **Cuidado com o banco:** nunca aponte o ambiente local para o banco de **produção** sem necessidade.
  Qualquer teste que grave dados deve usar registros de teste e apagá-los depois.
- O seed cria contas de exemplo com senha conhecida (ver `prisma/seed.ts`) e a conta de administrador
  com a senha de `ADMIN_SEED_PASSWORD`. **Não rode o seed em produção.**
- **Windows + drive exFAT:** o Next precisa criar *junction points*, que a exFAT não suporta. O script
  `dev` já usa `next dev --webpack`, mas `next build` local só funciona num drive **NTFS**. Isso não
  afeta o deploy (o build da Vercel roda em Linux).
- `npm run build` executa `prisma generate && prisma migrate deploy && next build`: **o build aplica as
  migrações pendentes no banco apontado por `DATABASE_URL`.**

## Variáveis de ambiente

Todas estão listadas, com a função de cada uma e o que acontece sem ela, em [`.env.example`](.env.example).
Onde obter cada chave e como trocá-la: [`docs/operacao.md`](docs/operacao.md).

## Estrutura do projeto

```
app/                  rotas (App Router); cada pasta é uma página ou grupo de páginas
  api/                rotas de API: webhooks (Asaas, Mercado Pago), cron, leitor, upload...
  painel/  admin/     áreas autenticadas; cada uma com seu actions.ts (Server Actions)
  checkout/ assinatura/ cadastro/ entrar/ estante/ ler/    fluxos de compra, planos e leitura
components/           interface (painel/, admin/, leitor/, halloween/ e componentes públicos)
lib/                  regras de negócio e integrações (ver tabela abaixo)
prisma/               schema.prisma, migrations/ (58) e seed.ts
public/               imagens estáticas (inclui halloween/ do tema sazonal)
middleware.ts         renova as sessões de autor e admin a cada requisição
vercel.json           agenda dos crons
docs/                 documentação (começar por docs/README.md)
```

Módulos principais de `lib/`:

| Módulo | Para que serve |
|---|---|
| `plans.ts` | planos, preços, comissões, oferta Black Friday, repasse proporcional ao parceiro |
| `asaas.ts` | cliente da API da Asaas (cobranças, assinaturas, Pix Automático, transferências) |
| `assinatura.ts` | criação de assinaturas de plano (Pix Automático, cartão recorrente, parcelado) |
| `repasse.ts` · `repasseParceiro.ts` · `pedidoEbook.ts` | repasses ao autor, ao parceiro do Premium+ e de e-books |
| `ebook*.ts` · `marcaDagua.tsx` · `leitor*.ts` | e-books: armazenamento privado, conversão, acesso e sessão do leitor |
| `auth.ts` · `session*.ts` · `totp.ts` · `webauthn.ts` | sessões de autor/admin, 2FA e passkeys |
| `email.ts` | todos os e-mails enviados pela plataforma |
| `authorDeletion.ts` | exclusão e encerramento de conta de autor |
| `halloween*.ts` | tema sazonal (liga e desliga por data) |

## Documentação

Comece por **[`docs/README.md`](docs/README.md)**:

- [`docs/arquitetura.md`](docs/arquitetura.md) — como as peças se encaixam, autenticação, armazenamento, crons
- [`docs/fluxos-de-dinheiro.md`](docs/fluxos-de-dinheiro.md) — compra, assinaturas, repasses, estornos, Premium+
- [`docs/ebooks.md`](docs/ebooks.md) — e-books do envio do PDF à leitura online
- [`docs/operacao.md`](docs/operacao.md) — guia de operação: deploy, migrações, chaves, ofertas, o que fazer quando algo dá erro

## Convenções

- Código e comentários em **português**; os comentários explicam o *porquê* das decisões.
- Valores em dinheiro são sempre **inteiros em centavos** (`...Centavos`).
- Regras de preço e repasse ficam em `lib/plans.ts`; o servidor sempre recalcula, nunca confia no que vem do navegador.
- Mudanças no banco só por **migração aditiva** (`prisma/migrations/`); aplicar em produção exige conferência.
