import "server-only";
import type { Prisma } from "@/app/generated/prisma/client";

export async function recalcularAvaliacaoAutor(tx: Prisma.TransactionClient, authorId: string) {
  const agregados = await tx.review.aggregate({
    where: { authorId },
    _avg: { estrelas: true },
    _count: true,
  });

  await tx.author.update({
    where: { id: authorId },
    data: {
      avaliacaoMedia: agregados._avg.estrelas ?? null,
      avaliacoesQtd: agregados._count,
    },
  });
}
