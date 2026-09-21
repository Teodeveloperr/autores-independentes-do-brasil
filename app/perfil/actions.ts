"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { nomeSchema, textoSchema, primeiroErroZod } from "@/lib/validation";

const mensagemVisitanteSchema = z.object({
  nome: nomeSchema,
  texto: textoSchema(2000),
});

export async function sendVisitorMessage(authorId: string, formData: FormData) {
  const parsed = mensagemVisitanteSchema.safeParse({
    nome: (formData.get("nome") as string) || "",
    texto: (formData.get("texto") as string) || "",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }
  const { nome, texto } = parsed.data;

  const ip = await getClientIp();
  const permitido = await checkRateLimit(`mensagem-visitante:${ip}`, 5, 60);
  if (!permitido) {
    return { error: "Muitas mensagens enviadas. Aguarde um pouco e tente novamente." };
  }

  const author = await prisma.author.findUnique({ where: { id: authorId } });
  if (!author) {
    return { error: "Autor não encontrado." };
  }

  await prisma.conversation.create({
    data: {
      authorId,
      nome,
      mensagens: { create: { de: nome, texto } },
    },
  });

  revalidatePath("/painel");
  return { ok: true as const };
}
