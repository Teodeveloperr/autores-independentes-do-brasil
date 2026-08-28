import "server-only";
import { prisma } from "@/lib/db";
import { criarAssinatura } from "@/lib/mercadoPago";
import { CICLO_MESES, type PlanoPagoSlug, type CicloAssinatura } from "@/lib/plans";

export async function criarAssinaturaMp(input: {
  authorId: string;
  authorEmail: string;
  planoSlug: PlanoPagoSlug;
  planoNome: string;
  ciclo: CicloAssinatura;
  valorCentavos: number;
  backUrl: string;
}): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

  const assinatura = await criarAssinatura({
    authorId: input.authorId,
    authorEmail: input.authorEmail,
    planoSlug: input.planoSlug,
    planoNome: input.planoNome,
    valorCentavos: input.valorCentavos,
    cicloMeses: CICLO_MESES[input.ciclo],
    backUrl: input.backUrl,
    notificationUrl: `${siteUrl}/api/webhooks/mercadopago`,
  });

  if (!assinatura) {
    throw new Error("Não foi possível iniciar a assinatura no Mercado Pago. Tente novamente em instantes.");
  }

  await prisma.author.update({
    where: { id: input.authorId },
    data: {
      mpPreapprovalId: assinatura.id,
      mpSubscriptionStatus: "pending",
      planoCiclo: input.ciclo,
      planoValorCentavos: input.valorCentavos,
    },
  });

  return assinatura.initPoint;
}
