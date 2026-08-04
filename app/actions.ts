"use server";

import { sendContactFormEmail } from "@/lib/email";

export type ContactFormState = { error?: string; success?: boolean } | undefined;

export async function submitContactForm(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  const nome = ((formData.get("nome") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim();
  const assunto = ((formData.get("assunto") as string) || "").trim();
  const mensagem = ((formData.get("mensagem") as string) || "").trim();

  if (!nome || !email || !mensagem) {
    return { error: "Preencha nome, e-mail e mensagem." };
  }

  try {
    await sendContactFormEmail({ nome, email, assunto, mensagem });
    return { success: true };
  } catch (err) {
    console.error("[email] Falha ao enviar mensagem de contato:", err);
    return { error: "Não foi possível enviar sua mensagem agora. Tente novamente em instantes." };
  }
}
