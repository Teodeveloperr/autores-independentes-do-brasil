import type { Metadata } from "next";
import { requireAuthor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PainelApp from "@/components/painel/PainelApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Meu Painel" };

export default async function PainelPage() {
  const authorSession = await requireAuthor();

  const author = await prisma.author.findUniqueOrThrow({
    where: { id: authorSession.id },
    omit: { senhaHash: true },
    include: {
      books: { orderBy: { createdAt: "desc" } },
      eventos: { orderBy: { createdAt: "desc" } },
      fotos: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
      conversas: {
        orderBy: { createdAt: "desc" },
        include: { mensagens: { orderBy: { createdAt: "asc" } } },
      },
      avaliacoes: { orderBy: { createdAt: "desc" } },
    },
  });

  const temSenha = authorSession.senhaHash != null;

  return <PainelApp author={author} temSenha={temSenha} />;
}
