import type { Prisma } from "@/app/generated/prisma/client";

export type AdminView = "dash" | "agenda" | "galeria" | "autores" | "blog" | "avaliacoes" | "seguranca";

export type CollectiveEvent = Prisma.CollectiveEventGetPayload<Record<string, never>>;
export type CollectiveGalleryPhoto = Prisma.CollectiveGalleryPhotoGetPayload<Record<string, never>>;
export type AuthorWithCount = Prisma.AuthorGetPayload<{ include: { _count: { select: { books: true } } } }>;
export type Article = Prisma.ArticleGetPayload<Record<string, never>>;
export type ReviewWithAuthor = Prisma.ReviewGetPayload<{ include: { author: { select: { nome: true } } } }>;
