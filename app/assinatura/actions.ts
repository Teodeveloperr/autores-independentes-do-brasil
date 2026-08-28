"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuthor } from "@/lib/auth";
import { cancelarAssinaturaMp } from "@/lib/mercadoPago";
import { criarAssinaturaMp } from "@/lib/assinatura";
import { PLANOS_PAGOS, CICLO_MESES, valorCicloCentavos, descontoFidelidade, PLANO_RANK, type PlanoPagoSlug, type CicloAssinatura } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rateLimit";

export type AssinarState = { error?: string } | undefined;

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

  if (author.mpPreapprovalId && author.mpSubscriptionStatus === "authorized") {
    await cancelarAssinaturaMp(author.mpPreapprovalId);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

  const ehUpgrade = author.plano !== "Iniciante" && (PLANO_RANK[plano.nome] ?? 0) > (PLANO_RANK[author.plano] ?? 0);
  const desconto = ehUpgrade ? descontoFidelidade(author.planoIniciadoEm) : 0;
  const valorCentavos = Math.round(valorCicloCentavos(plano, ciclo) * (1 - desconto / 100));

  let initPoint: string;
  try {
    initPoint = await criarAssinaturaMp({
      authorId: author.id,
      authorEmail: author.email,
      planoSlug,
      planoNome: plano.nome,
      ciclo,
      valorCentavos,
      backUrl: `${siteUrl}/painel?assinatura=pendente`,
    });
  } catch {
    return { error: "Não foi possível iniciar a assinatura no Mercado Pago. Tente novamente em instantes." };
  }

  redirect(initPoint);
}

export async function cancelarAssinatura() {
  const author = await requireAuthor();
  if (!author.mpPreapprovalId) return;

  await cancelarAssinaturaMp(author.mpPreapprovalId);

  await prisma.author.update({
    where: { id: author.id },
    data: { plano: "Iniciante", mpSubscriptionStatus: "cancelled" },
  });
}
