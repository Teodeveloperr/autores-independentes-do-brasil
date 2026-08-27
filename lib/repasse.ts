import "server-only";
import type { Order, Author } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { criarTransferenciaPix } from "@/lib/asaas";
import { valorRepasseCentavos } from "@/lib/plans";

export async function processarRepasse(order: Order, author: Author): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (!order.asaasPaymentId || order.repasseStatus === "transferido") {
    return { ok: true };
  }

  if (!author.pixKey || !author.pixKeyType) {
    const erro = "Autor sem chave Pix cadastrada.";
    await prisma.order.update({ where: { id: order.id }, data: { repasseStatus: "erro", repasseErro: erro } });
    return { ok: false, erro };
  }

  const valorRepasse = valorRepasseCentavos(author.plano, order.valorCentavos, order.freteCentavos ?? 0);
  const transferencia = await criarTransferenciaPix({
    valueCentavos: valorRepasse,
    pixKey: author.pixKey,
    pixKeyType: author.pixKeyType,
    description: `Repasse - Pedido ${order.id.slice(-6)}`,
    externalReference: order.id,
  });

  if (!transferencia) {
    const erro = "Falha ao criar transferência na Asaas.";
    await prisma.order.update({ where: { id: order.id }, data: { repasseStatus: "erro", repasseErro: erro } });
    return { ok: false, erro };
  }

  await prisma.order.update({
    where: { id: order.id },
    data: { repasseStatus: "transferido", repasseAsaasTransferId: transferencia.id, repasseErro: null },
  });
  return { ok: true };
}
