import "server-only";
import { prisma } from "@/lib/db";
import { kitPorId, resumoDoKit, valorParceiroKitCentavos } from "@/lib/kits";
import { sendPedidoKitCompradorEmail, sendPedidoKitEquipeEmail } from "@/lib/email";

/**
 * Marca o pedido do kit como pago (uma única vez) e avisa a equipe e o comprador por e-mail.
 * No cartão parcelado a Asaas confirma cada parcela; só a primeira confirmação muda o pedido.
 * Se o envio dos e-mails falhar, libera a trava para a próxima confirmação tentar de novo.
 */
export async function marcarPedidoKitPago(pedidoId: string, valorLiquidoCentavos: number | null): Promise<boolean> {
  const marcado = await prisma.pedidoKit.updateMany({
    where: { id: pedidoId, pagoEm: null },
    data: { status: "pago", pagoEm: new Date(), valorLiquidoCentavos },
  });
  await garantirEmailsDoKitPago(pedidoId);
  return marcado.count > 0;
}

export async function garantirEmailsDoKitPago(pedidoId: string): Promise<void> {
  const trava = await prisma.pedidoKit.updateMany({
    where: { id: pedidoId, status: "pago", emailPagoEnviadoEm: null },
    data: { emailPagoEnviadoEm: new Date() },
  });
  if (trava.count === 0) return;

  const pedido = await prisma.pedidoKit.findUnique({ where: { id: pedidoId } });
  const kit = pedido ? kitPorId(pedido.kit) : null;
  if (!pedido || !kit) return;

  const info = {
    numero: pedido.numero,
    kitNome: kit.nome,
    resumo: resumoDoKit(kit),
    valorCentavos: pedido.valorCentavos,
    parcelas: pedido.parcelas,
    nome: pedido.nome,
    email: pedido.email,
    telefone: pedido.telefone,
    impressaoUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br"}/kit/imprimir?pedido=${pedido.token}`,
  };
  try {
    await sendPedidoKitEquipeEmail(info);
  } catch (err) {
    console.error(`[kit] Falha ao avisar a equipe do kit pago ${pedidoId}:`, err);
    await prisma.pedidoKit.update({ where: { id: pedidoId }, data: { emailPagoEnviadoEm: null } });
    return;
  }
  await sendPedidoKitCompradorEmail(info).catch((err) => console.error(`[kit] Falha ao enviar a confirmação ao comprador do kit ${pedidoId}:`, err));
}

/**
 * Registra um pagamento recebido do kit (à vista ou uma parcela) com a fatia do parceiro (90%).
 * Chamado a cada PAYMENT_CONFIRMED/PAYMENT_RECEIVED: o primeiro cria a linha; o PAYMENT_RECEIVED
 * (saldo disponível na Asaas; no cartão chega semanas depois) só preenche disponivelEm, que libera o repasse.
 */
export async function registrarPagamentoKit(
  pedidoId: string,
  cobranca: { id: string; valueCentavos: number; netValueCentavos: number | null },
  evento: string
): Promise<void> {
  const disponivel = evento === "PAYMENT_RECEIVED" ? new Date() : null;
  const existente = await prisma.pedidoKitPagamento.findUnique({ where: { asaasPaymentId: cobranca.id } });

  if (!existente) {
    try {
      await prisma.pedidoKitPagamento.create({
        data: {
          pedidoId,
          asaasPaymentId: cobranca.id,
          valorCentavos: cobranca.valueCentavos,
          valorLiquidoCentavos: cobranca.netValueCentavos,
          disponivelEm: disponivel,
          repasseValorCentavos: valorParceiroKitCentavos(cobranca.valueCentavos),
        },
      });
      return;
    } catch {
      // Dois eventos do mesmo pagamento ao mesmo tempo: o outro criou primeiro, segue para a atualização.
    }
  }

  if (disponivel) {
    await prisma.pedidoKitPagamento.updateMany({
      where: { asaasPaymentId: cobranca.id, disponivelEm: null },
      data: { disponivelEm: disponivel, ...(cobranca.netValueCentavos != null ? { valorLiquidoCentavos: cobranca.netValueCentavos } : {}) },
    });
  }
}
