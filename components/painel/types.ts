import type { Prisma } from "@/app/generated/prisma/client";

export type PainelView = "dash" | "perfil" | "livros" | "pedidos" | "eventos" | "galeria" | "mensagens" | "avaliacoes" | "vendas";

export type AuthorWithRelations = Prisma.AuthorGetPayload<{
  include: {
    books: true;
    eventos: true;
    fotos: true;
    orders: true;
    conversas: { include: { mensagens: true } };
    avaliacoes: true;
  };
}>;
