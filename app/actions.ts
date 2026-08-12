"use server";

import { sendContactFormEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export type ContactFormState = { error?: string; success?: boolean } | undefined;

export async function submitContactForm(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  // Campo honeypot: invisível para pessoas, mas bots costumam preencher todo input do formulário.
  if (((formData.get("website") as string) || "").trim()) {
    return { success: true };
  }

  const nome = ((formData.get("nome") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim();
  const assunto = ((formData.get("assunto") as string) || "").trim();
  const mensagem = ((formData.get("mensagem") as string) || "").trim();

  if (!nome || !email || !mensagem) {
    return { error: "Preencha nome, e-mail e mensagem." };
  }

  const ip = await getClientIp();
  const permitido = await checkRateLimit(`contato:${ip}`, 5, 60);
  if (!permitido) {
    return { error: "Muitas mensagens enviadas. Aguarde um pouco e tente novamente." };
  }

  try {
    await sendContactFormEmail({ nome, email, assunto, mensagem });
    return { success: true };
  } catch (err) {
    console.error("[email] Falha ao enviar mensagem de contato:", err);
    return { error: "Não foi possível enviar sua mensagem agora. Tente novamente em instantes." };
  }
}
