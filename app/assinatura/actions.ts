"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuthor } from "@/lib/auth";
import { criarAssinatura, cancelarAssinaturaMp } from "@/lib/mercadoPago";
import { PLANOS_PAGOS, CICLO_MESES, valorCicloCentavos, type PlanoPagoSlug, type CicloAssinatura } from "@/lib/plans";
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
  const valorCentavos = valorCicloCentavos(plano.valorMensalCentavos, ciclo);

  const assinatura = await criarAssinatura({
    authorId: author.id,
    authorEmail: author.email,
    planoSlug,
    planoNome: plano.nome,
    valorCentavos,
    cicloMeses: CICLO_MESES[ciclo],
    backUrl: `${siteUrl}/painel?assinatura=pendente`,
  });

  if (!assinatura) {
    return { error: "Não foi possível iniciar a assinatura no Mercado Pago. Tente novamente em instantes." };
  }

  await prisma.author.update({
    where: { id: author.id },
    data: {
      mpPreapprovalId: assinatura.id,
      mpSubscriptionStatus: "pending",
      planoCiclo: ciclo,
      planoValorCentavos: valorCentavos,
    },
  });

  redirect(assinatura.initPoint);
}

export async function cancelarAssinatura() {
  const author = await requireAuthor();
  if (!author.mpPreapprovalId) return;

  await cancelarAssinaturaMp(author.mpPreapprovalId);

  await prisma.author.update({
    where: { id: author.id },
    data: { plano: "Gratuito", mpSubscriptionStatus: "cancelled" },
  });
}
