"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export async function sendVisitorMessage(authorId: string, formData: FormData) {
  const nome = ((formData.get("nome") as string) || "").trim();
  const texto = ((formData.get("texto") as string) || "").trim();

  if (!nome || !texto) {
    return { error: "Preencha seu nome e a mensagem." };
  }

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
