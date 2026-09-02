import "server-only";
import crypto from "node:crypto";
import type { Order, Author } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { criarTransferenciaPix, buscarCobranca } from "@/lib/asaas";
import { valorRepasseCentavos, valorRepasseCentavosLiquido } from "@/lib/plans";
import { sendConfirmacaoRecebimentoEmail } from "@/lib/email";

export async function processarRepasse(order: Order, author: Author): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (!order.asaasPaymentId || order.repasseStatus === "transferido") {
    return { ok: true };
  }

  if (!author.pixKey || !author.pixKeyType) {
    const erro = "Autor sem chave Pix cadastrada.";
    await prisma.order.update({ where: { id: order.id }, data: { repasseStatus: "erro", repasseErro: erro } });
    return { ok: false, erro };
  }

  // Confere se o dinheiro da cobrança original já está disponível pra movimentação na
  // Asaas antes de transferir — cartão de crédito só libera em D+32, bem depois do
  // pagamento confirmar. Não é erro, só ainda não é hora: não marca repasseStatus, tenta
  // de novo no próximo cron (fica "aguardando" na tela do autor).
  const cobranca = await buscarCobranca(order.asaasPaymentId);
  if (!cobranca || cobranca.status !== "RECEIVED") {
    return { ok: false, erro: "Cobrança ainda não está disponível para movimentação na Asaas." };
  }

  const valorRepasse =
    order.valorLiquidoCentavos != null
      ? valorRepasseCentavosLiquido(author.plano, order.valorCentavos, order.freteCentavos ?? 0, order.valorLiquidoCentavos)
      : valorRepasseCentavos(author.plano, order.valorCentavos, order.freteCentavos ?? 0);

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
    data: { repasseStatus: "transferido", repasseAsaasTransferId: transferencia.id, repasseValorCentavos: valorRepasse, repasseErro: null },
  });
  return { ok: true };
}

export async function enviarConfirmacaoRecebimento(order: Order, author: Author): Promise<void> {
  if (order.confirmacaoTokenHash) return;

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.order.update({
    where: { id: order.id },
    data: { confirmacaoEnviadaEm: new Date(), confirmacaoTokenHash: tokenHash },
  });

  if (!order.compradorEmail) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";
  await sendConfirmacaoRecebimentoEmail(order.compradorEmail, {
    livro: order.livro,
    autorNome: author.nome,
    confirmarUrl: `${siteUrl}/pedido/confirmar?token=${rawToken}`,
  }).catch((err) => console.error("[repasse] Falha ao enviar e-mail de confirmação ao comprador:", err));
}
