"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { recalcularAvaliacaoAutor } from "@/lib/reviews";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { nomeSchema, textoSchema, primeiroErroZod } from "@/lib/validation";

export type AvaliacaoState = { error?: string; success?: boolean } | undefined;

const avaliacaoSchema = z.object({
  authorId: z.string().min(1, "Autor inválido."),
  nome: nomeSchema,
  texto: textoSchema(2000),
  estrelas: z.coerce.number().int().min(1, "Selecione de 1 a 5 estrelas.").max(5, "Selecione de 1 a 5 estrelas."),
});

export async function criarAvaliacao(_prev: AvaliacaoState, formData: FormData): Promise<AvaliacaoState> {
  // Campo honeypot: invisível para pessoas, mas bots costumam preencher todo input do formulário.
  if (((formData.get("website") as string) || "").trim()) {
    return { success: true };
  }

  const ip = await getClientIp();
  const permitido = await checkRateLimit(`avaliacao:${ip}`, 5, 60);
  if (!permitido) {
    return { error: "Muitas avaliações enviadas. Aguarde um pouco e tente novamente." };
  }

  const parsed = avaliacaoSchema.safeParse({
    authorId: (formData.get("authorId") as string) || "",
    nome: (formData.get("nome") as string) || "",
    texto: (formData.get("texto") as string) || "",
    estrelas: (formData.get("estrelas") as string) || "0",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }
  const { authorId, nome, texto, estrelas } = parsed.data;

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
