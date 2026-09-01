"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuthor } from "@/lib/auth";
import { cancelarAssinaturaMp } from "@/lib/mercadoPago";
import { cancelarAutorizacaoPixAutomatico, cancelarAssinaturaAsaas } from "@/lib/asaas";
import { criarAssinaturaAsaasParaAutor } from "@/lib/assinatura";
import { validarCpf } from "@/lib/cpf";
import { PLANOS_PAGOS, CICLO_MESES, valorCicloCentavos, descontoFidelidade, PLANO_RANK, type PlanoPagoSlug, type CicloAssinatura } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rateLimit";

export type AssinarState = { error?: string } | undefined;

export async function cancelarAssinaturaAtiva(author: {
  mpPreapprovalId: string | null;
  mpSubscriptionStatus: string | null;
  asaasPixAutoAuthorizationId: string | null;
  asaasPixAutoStatus: string | null;
  asaasSubscriptionId: string | null;
  asaasSubscriptionStatus: string | null;
}) {
  if (author.mpPreapprovalId && author.mpSubscriptionStatus === "authorized") {
    await cancelarAssinaturaMp(author.mpPreapprovalId);
  }
  if (author.asaasPixAutoAuthorizationId && author.asaasPixAutoStatus === "active") {
    await cancelarAutorizacaoPixAutomatico(author.asaasPixAutoAuthorizationId);
  }
  if (author.asaasSubscriptionId && author.asaasSubscriptionStatus === "active") {
    await cancelarAssinaturaAsaas(author.asaasSubscriptionId);
  }
}

export async function iniciarAssinatura(_prev: AssinarState, formData: FormData): Promise<AssinarState> {
  const author = await requireAuthor();

  const permitido = await checkRateLimit(`iniciar-assinatura:${author.id}`, 5, 15);
  if (!permitido) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }

  const planoSlug = formData.get("planoSlug") as PlanoPagoSlug;
  const ciclo = (formData.get("ciclo") as CicloAssinatura) || "mensal";

  const plano = PLANOS_PAGOS[planoSlug];
  if (!plano || !CICLO_MESES[ciclo]) {
    return { error: "Plano ou ciclo inválido." };
  }

  const ehUpgrade = author.plano !== "Iniciante" && (PLANO_RANK[plano.nome] ?? 0) > (PLANO_RANK[author.plano] ?? 0);
  const desconto = ehUpgrade ? descontoFidelidade(author.planoIniciadoEm) : 0;
  const valorCentavos = Math.round(valorCicloCentavos(plano, ciclo) * (1 - desconto / 100));

  const cpf = ((formData.get("cpf") as string) || "").trim();
  if (!validarCpf(cpf)) {
    return { error: "CPF inválido." };
  }

  await cancelarAssinaturaAtiva(author);

  let invoiceUrl: string;
  try {
    invoiceUrl = await criarAssinaturaAsaasParaAutor({
      authorId: author.id,
      authorEmail: author.email,
      authorNome: author.nome,
      cpf,
      planoNome: plano.nome,
      ciclo,
      valorCentavos,
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível iniciar a assinatura. Tente novamente em instantes." };
  }

  redirect(invoiceUrl);
}

export async function cancelarAssinatura() {
  const author = await requireAuthor();
  await cancelarAssinaturaAtiva(author);

  await prisma.author.update({
    where: { id: author.id },
    data: {
      plano: "Iniciante",
      mpSubscriptionStatus: author.mpPreapprovalId ? "cancelled" : author.mpSubscriptionStatus,
      asaasPixAutoStatus: author.asaasPixAutoAuthorizationId ? "cancelled" : author.asaasPixAutoStatus,
      asaasSubscriptionStatus: author.asaasSubscriptionId ? "cancelled" : author.asaasSubscriptionStatus,
    },
  });
}
