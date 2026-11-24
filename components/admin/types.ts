import type { Prisma } from "@/app/generated/prisma/client";

export type AdminView = "dash" | "agenda" | "oportunidades" | "galeria" | "autores" | "blog" | "talkshow" | "chat" | "avaliacoes" | "pedidos" | "receita" | "contratos" | "ebooks" | "impressao" | "premio" | "leads" | "seguranca" | "configuracoes";

export type CollectiveEvent = Prisma.CollectiveEventGetPayload<Record<string, never>>;
export type Opportunity = Prisma.OpportunityGetPayload<Record<string, never>>;
export type CollectiveGalleryPhoto = Prisma.CollectiveGalleryPhotoGetPayload<Record<string, never>>;
export type AuthorWithCount = Prisma.AuthorGetPayload<{ include: { _count: { select: { books: true } } } }>;
export type Article = Prisma.ArticleGetPayload<Record<string, never>>;
export type TalkShowVideo = Prisma.TalkShowVideoGetPayload<Record<string, never>>;
export type ReviewWithAuthor = Prisma.ReviewGetPayload<{ include: { author: { select: { nome: true } } } }>;
export type OrderWithAuthor = Prisma.OrderGetPayload<{ include: { author: { select: { nome: true } } } }>;
export type OrderComReceita = Prisma.OrderGetPayload<{ include: { author: { select: { plano: true } } } }>;
export type SubscriptionPaymentRow = Prisma.SubscriptionPaymentGetPayload<{ include: { author: { select: { nome: true } } } }>;
export type ContratoAdminRow = Prisma.ContratoBienalGetPayload<{
  omit: { pdf: true; assinaturaPng: true; codigoHash: true; assinaturaUserAgent: true };
  include: { reservas: true };
}>;
export type PremiumPlusBienalRow = Prisma.AuthorGetPayload<{ select: { id: true; nome: true; email: true; reservaBienal: true } }>;
export type AcessoEbookAdminRow = Prisma.AcessoEbookGetPayload<{
  include: {
    leitor: { select: { id: true; email: true; nome: true; ultimoAcessoEm: true; _count: { select: { sessoes: true } } } };
    book: { select: { titulo: true; author: { select: { nome: true } } } };
    order: { select: { id: true; status: true } };
  };
}>;
export type EbookAdminRow = Prisma.BookGetPayload<{
  select: { id: true; titulo: true; ebookStatus: true; ebookPaginas: true; ebookErro: true; ebookAtualizadoEm: true; author: { select: { nome: true } }; _count: { select: { acessosEbook: true } } };
}>;
// Pedido de impressão no admin: sem os caminhos dos PDFs nem o hash do token (os arquivos abrem pela rota do admin).
export type PedidoImpressaoAdminRow = Prisma.PedidoImpressaoGetPayload<{
  omit: { tokenHash: true; capaPath: true; mioloPath: true };
  include: { author: { select: { nome: true; email: true } }; pedidoKit: { select: { numero: true; kit: true } } };
}>;
// Kit da Bienal no admin: sem CPF nem o código do link de agradecimento.
export type PedidoKitAdminRow = Prisma.PedidoKitGetPayload<{
  omit: { cpf: true; token: true; asaasCustomerId: true };
  include: { pagamentos: true; impressao: { select: { numero: true; status: true } } };
}>;

export type LeadEbookRow = Prisma.LeadEbookGetPayload<object>;
export type InscricaoPremioRow = Prisma.InscricaoPremioGetPayload<{ omit: { pasta: true } }>;
