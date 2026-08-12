"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { recalcularAvaliacaoAutor } from "@/lib/reviews";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export type AvaliacaoState = { error?: string; success?: boolean } | undefined;

export async function criarAvaliacao(_prev: AvaliacaoState, formData: FormData): Promise<AvaliacaoState> {
  // Campo honeypot: invisível para pessoas, mas bots costumam preencher todo input do formulário.
  if (((formData.get("website") as string) || "").trim()) {
    return { success: true };
  }

  const authorId = (formData.get("authorId") as string) || "";
  const nome = ((formData.get("nome") as string) || "").trim();
  const texto = ((formData.get("texto") as string) || "").trim();
  const estrelas = parseInt((formData.get("estrelas") as string) || "0", 10);

  if (!authorId) {
    return { error: "Autor inválido." };
  }

  const ip = await getClientIp();
  const permitido = await checkRateLimit(`avaliacao:${ip}`, 5, 60);
  if (!permitido) {
    return { error: "Muitas avaliações enviadas. Aguarde um pouco e tente novamente." };
  }
  if (!nome || !texto) {
    return { error: "Preencha seu nome e o texto da avaliação." };
  }
  if (estrelas < 1 || estrelas > 5) {
    return { error: "Selecione de 1 a 5 estrelas." };
  }

  const author = await prisma.author.findUnique({ where: { id: authorId } });
  if (!author) {
    return { error: "Autor não encontrado." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.create({ data: { authorId, nome, texto, estrelas } });
    await recalcularAvaliacaoAutor(tx, authorId);
  });

  revalidatePath(`/perfil/${authorId}`);
  return { success: true };
}
