"use server";

import { z } from "zod";
import { sendContactFormEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { emailSchema, nomeSchema, textoSchema, primeiroErroZod } from "@/lib/validation";

export type ContactFormState = { error?: string; success?: boolean } | undefined;

const contatoSchema = z.object({
  nome: nomeSchema,
  email: emailSchema,
  assunto: textoSchema(200, false),
  mensagem: textoSchema(5000),
});

export async function submitContactForm(_prev: ContactFormState, formData: FormData): Promise<ContactFormState> {
  // Campo honeypot: invisível para pessoas, mas bots costumam preencher todo input do formulário.
  if (((formData.get("website") as string) || "").trim()) {
    return { success: true };
  }

  const parsed = contatoSchema.safeParse({
    nome: (formData.get("nome") as string) || "",
    email: (formData.get("email") as string) || "",
    assunto: (formData.get("assunto") as string) || "",
    mensagem: (formData.get("mensagem") as string) || "",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }
  const { nome, email, assunto, mensagem } = parsed.data;

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
