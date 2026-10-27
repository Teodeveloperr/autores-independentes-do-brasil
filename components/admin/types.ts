import type { Prisma } from "@/app/generated/prisma/client";

export type AdminView = "dash" | "agenda" | "oportunidades" | "galeria" | "autores" | "blog" | "talkshow" | "chat" | "avaliacoes" | "pedidos" | "receita" | "contratos" | "ebooks" | "seguranca" | "configuracoes";

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
