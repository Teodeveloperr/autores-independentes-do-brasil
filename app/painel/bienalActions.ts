"use server";

import { revalidatePath } from "next/cache";
import { requireAuthor } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rateLimit";
import { PLANO_PREMIUM_PLUS, premiumPlusPodeEscolher } from "@/lib/contrato/config";
import { removerHorarioPremiumPlus, reservarHorarioPremiumPlus, validarHorarioPremiumPlus } from "@/lib/contrato/agenda";

// Horário de balcão (2h) na Bienal Rio 2027 a que o plano Premium+ dá direito. O servidor confere
// plano, prazo, dia, hora e vaga: nada do que vem do navegador é confiado.

export async function escolherHorarioBienal(dia: string, horaInicio: number): Promise<{ error?: string }> {
  const author = await requireAuthor();
  if (author.plano !== PLANO_PREMIUM_PLUS) return { error: "Este benefício é exclusivo do plano Premium+." };
  if (!premiumPlusPodeEscolher()) return { error: "O prazo para escolher ou trocar o horário já passou. Fale com a administração." };

  const permitido = await checkRateLimit(`bienal-horario:${author.id}`, 30, 10);
  if (!permitido) return { error: "Muitas tentativas. Aguarde alguns minutos." };

  const erro = validarHorarioPremiumPlus(dia, horaInicio);
  if (erro) return { error: erro };

  const resultado = await reservarHorarioPremiumPlus(author.id, dia, horaInicio);
  if (!resultado.ok) return { error: resultado.erro };
  revalidatePath("/painel");
  return {};
}

export async function removerHorarioBienal(): Promise<{ error?: string }> {
  const author = await requireAuthor();
  if (!premiumPlusPodeEscolher()) return { error: "O prazo para trocar o horário já passou. Fale com a administração." };
  await removerHorarioPremiumPlus(author.id);
  revalidatePath("/painel");
  return {};
}
