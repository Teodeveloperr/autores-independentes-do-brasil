import type { Prisma } from "@/app/generated/prisma/client";

export type PainelView = "dash" | "perfil" | "livros" | "pedidos" | "eventos" | "galeria" | "mensagens" | "avaliacoes" | "vendas" | "portfolio" | "configuracoes";

export type AuthorWithRelations = Prisma.AuthorGetPayload<{
  omit: { senhaHash: true };
  include: {
    books: true;
    eventos: true;
    fotos: true;
    orders: true;
    conversas: { include: { mensagens: true } };
    avaliacoes: true;
    passkeys: { omit: { publicKey: true } };
  };
}>;
