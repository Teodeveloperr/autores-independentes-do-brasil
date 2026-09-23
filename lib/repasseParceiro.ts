import "server-only";
import type { SubscriptionPayment } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { criarTransferenciaPix } from "@/lib/asaas";
import { PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS } from "@/lib/plans";

/**
 * Repassa automaticamente, via Pix, a fatia do parceiro de cada assinatura Premium+ —
 * mesmo padrão de processarRepasse() em lib/repasse.ts, mas pra uma chave Pix única e fixa
 * (configurada pelo admin em Admin.premiumPlusPixKey), não por autor.
 */
export async function processarRepasseParceiro(pagamento: SubscriptionPayment): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (pagamento.plano !== "Autor Premium+" || pagamento.repasseParceiroStatus === "transferido") {
    return { ok: true };
  }

  // Cobrança ainda não confirmada como disponível pra movimentação na Asaas (webhook só
  // preenche disponivelEm em PAYMENT_RECEIVED) — não é erro, só ainda não é hora. Tenta de
  // novo no próximo cron, sem marcar repasseParceiroStatus.
  if (!pagamento.disponivelEm) {
    return { ok: false, erro: "Pagamento ainda não está disponível para movimentação na Asaas." };
  }

  const admin = await prisma.admin.findFirst({ orderBy: { createdAt: "asc" } });
  if (!admin?.premiumPlusPixKey || !admin?.premiumPlusPixKeyType) {
    const erro = "Chave Pix do parceiro não configurada.";
    await prisma.subscriptionPayment.update({
      where: { id: pagamento.id },
      data: { repasseParceiroStatus: "erro", repasseParceiroErro: erro },
    });
    return { ok: false, erro };
  }

  const valorRepasse = pagamento.repasseParceiroValorCentavos ?? PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS;

  const transferencia = await criarTransferenciaPix({
    valueCentavos: valorRepasse,
    pixKey: admin.premiumPlusPixKey,
    pixKeyType: admin.premiumPlusPixKeyType,
    description: `Repasse parceiro Premium+ - ${pagamento.id.slice(-6)}`,
    externalReference: pagamento.id,
  });

  if (!transferencia) {
    const erro = "Falha ao criar transferência na Asaas.";
    await prisma.subscriptionPayment.update({
      where: { id: pagamento.id },
      data: { repasseParceiroStatus: "erro", repasseParceiroErro: erro },
    });
    return { ok: false, erro };
  }

  await prisma.subscriptionPayment.update({
    where: { id: pagamento.id },
    data: {
      repasseParceiroStatus: "transferido",
      repasseParceiroAsaasTransferId: transferencia.id,
      repasseParceiroValorCentavos: valorRepasse,
      repasseParceiroErro: null,
    },
  });
  return { ok: true };
}
