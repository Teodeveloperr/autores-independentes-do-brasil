import type { Prisma } from "@/app/generated/prisma/client";

export type AdminView = "dash" | "agenda" | "galeria" | "autores";

export type CollectiveEvent = Prisma.CollectiveEventGetPayload<Record<string, never>>;
export type CollectiveGalleryPhoto = Prisma.CollectiveGalleryPhotoGetPayload<Record<string, never>>;
export type AuthorWithCount = Prisma.AuthorGetPayload<{ include: { _count: { select: { books: true } } } }>;
