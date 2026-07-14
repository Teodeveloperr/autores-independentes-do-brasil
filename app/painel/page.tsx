import type { Metadata } from "next";
import { requireAuthor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PainelApp from "@/components/painel/PainelApp";

export const metadata: Metadata = { title: "Meu Painel" };

export default async function PainelPage() {
  const authorSession = await requireAuthor();

  const author = await prisma.author.findUniqueOrThrow({
    where: { id: authorSession.id },
    include: {
      books: { orderBy: { createdAt: "desc" } },
      eventos: { orderBy: { createdAt: "desc" } },
      fotos: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
      conversas: {
        orderBy: { createdAt: "desc" },
        include: { mensagens: { orderBy: { createdAt: "asc" } } },
      },
    },
  });

  return <PainelApp author={author} />;
}
