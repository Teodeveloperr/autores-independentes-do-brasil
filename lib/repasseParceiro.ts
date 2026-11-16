import "server-only";
import type { PedidoKitPagamento, SubscriptionPayment } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { criarTransferenciaPix } from "@/lib/asaas";
import { valorParceiroPremiumPlusCentavos } from "@/lib/plans";
import { valorParceiroKitCentavos } from "@/lib/kits";

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

  // Teto de segurança: a fatia do parceiro nunca passa da proporção do que foi realmente pago. Pagamentos
  // antigos do parcelado foram gravados com o valor cheio (R$ 421,20) em CADA parcela; sem este teto, cada
  // parcela de R$ 75,00 repassaria R$ 421,20.
  const proporcional = valorParceiroPremiumPlusCentavos(pagamento.valorCentavos);
  const valorRepasse = Math.min(pagamento.repasseParceiroValorCentavos ?? proporcional, proporcional);

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

/**
 * Repassa ao parceiro, via Pix, a fatia (90%) de um pagamento de kit da Bienal. Mesma chave Pix do
 * Premium+ (Admin.premiumPlusPixKey). Antes de transferir, "reserva" o pagamento (status
 * "processando"), para duas execuções do cron ao mesmo tempo nunca pagarem duas vezes; se a
 * transferência falhar, volta para "erro" e o próximo cron tenta de novo.
 */
export async function processarRepasseKit(pagamento: PedidoKitPagamento): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (pagamento.repasseStatus === "transferido" || pagamento.repasseStatus === "cancelado") return { ok: true };
  if (!pagamento.disponivelEm) return { ok: false, erro: "Pagamento ainda não está disponível para movimentação na Asaas." };

  const admin = await prisma.admin.findFirst({ orderBy: { createdAt: "asc" } });
  if (!admin?.premiumPlusPixKey || !admin?.premiumPlusPixKeyType) {
    const erro = "Chave Pix do parceiro não configurada.";
    await prisma.pedidoKitPagamento.update({ where: { id: pagamento.id }, data: { repasseStatus: "erro", repasseErro: erro } });
    return { ok: false, erro };
  }

  const reserva = await prisma.pedidoKitPagamento.updateMany({
    where: { id: pagamento.id, repasseStatus: { in: ["pendente", "erro"] } },
    data: { repasseStatus: "processando" },
  });
  if (reserva.count === 0) return { ok: false, erro: "Repasse já está em andamento." };

  // Teto de segurança: nunca repassa mais que a fatia do que foi realmente pago.
  const valorRepasse = Math.min(pagamento.repasseValorCentavos, valorParceiroKitCentavos(pagamento.valorCentavos));

  const transferencia = await criarTransferenciaPix({
    valueCentavos: valorRepasse,
    pixKey: admin.premiumPlusPixKey,
    pixKeyType: admin.premiumPlusPixKeyType,
    description: `Repasse parceiro Kit Bienal - ${pagamento.id.slice(-6)}`,
    externalReference: pagamento.id,
  });

  if (!transferencia) {
    const erro = "Falha ao criar transferência na Asaas.";
    await prisma.pedidoKitPagamento.update({ where: { id: pagamento.id }, data: { repasseStatus: "erro", repasseErro: erro } });
    return { ok: false, erro };
  }

  await prisma.pedidoKitPagamento.update({
    where: { id: pagamento.id },
    data: { repasseStatus: "transferido", repasseAsaasTransferId: transferencia.id, repasseValorCentavos: valorRepasse, repasseErro: null, repasseEm: new Date() },
  });
  return { ok: true };
}
