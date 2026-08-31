"use server";

import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { criarLinkRedefinicaoSenha } from "@/lib/passwordReset";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export type RequestResetState = { sent?: boolean; error?: string } | undefined;

export async function requestPasswordReset(
  _prev: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  if (!email) {
    return { error: "Digite um e-mail válido." };
  }

  const ip = await getClientIp();
  const permitido = await checkRateLimit(`recuperar-senha:${ip}`, 5, 60);
  if (!permitido) {
    return { error: "Muitas tentativas. Aguarde um pouco e tente novamente." };
  }

  const author = await prisma.author.findUnique({ where: { email } });

  // Sempre um sucesso genérico — não revela se o e-mail existe na base.
  if (author) {
    const resetUrl = await criarLinkRedefinicaoSenha(author.id);
    try {
      await sendPasswordResetEmail(author.email, resetUrl);
    } catch (err) {
      console.error("[recuperar-senha] Falha ao enviar e-mail de redefinição:", err);
    }
  }

  return { sent: true };
}
