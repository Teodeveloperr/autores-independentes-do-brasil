import "server-only";
import { prisma } from "@/lib/db";
import { kitPorId, resumoDoKit } from "@/lib/kits";
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
