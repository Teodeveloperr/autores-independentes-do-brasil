import type { Prisma } from "@/app/generated/prisma/client";

export type AdminView = "dash" | "agenda" | "oportunidades" | "galeria" | "autores" | "blog" | "avaliacoes" | "pedidos" | "receita" | "seguranca";

export type CollectiveEvent = Prisma.CollectiveEventGetPayload<Record<string, never>>;
export type Opportunity = Prisma.OpportunityGetPayload<Record<string, never>>;
export type CollectiveGalleryPhoto = Prisma.CollectiveGalleryPhotoGetPayload<Record<string, never>>;
export type AuthorWithCount = Prisma.AuthorGetPayload<{ include: { _count: { select: { books: true } } } }>;
export type Article = Prisma.ArticleGetPayload<Record<string, never>>;
export type ReviewWithAuthor = Prisma.ReviewGetPayload<{ include: { author: { select: { nome: true } } } }>;
export type OrderWithAuthor = Prisma.OrderGetPayload<{ include: { author: { select: { nome: true } } } }>;
export type OrderComReceita = Prisma.OrderGetPayload<{ include: { author: { select: { plano: true } } } }>;
export type SubscriptionPaymentRow = Prisma.SubscriptionPaymentGetPayload<Record<string, never>>;
