import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processarRepasse, enviarConfirmacaoRecebimento } from "@/lib/repasse";
import { cancelarAutorizacaoPixAutomatico, cancelarAssinaturaAsaas, buscarCobranca, cancelarCobranca } from "@/lib/asaas";

const DIAS_LEMBRETE = 3;
const DIAS_LIBERACAO = 7;
const DIAS_CADASTRO_PENDENTE = 3;
const DIAS_PEDIDO_ABANDONADO = 3;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const limiteLembrete = new Date(Date.now() - DIAS_LEMBRETE * 24 * 60 * 60 * 1000);
  const semConfirmacaoEnviada = await prisma.order.findMany({
    where: {
      status: { notIn: ["Aguardando pagamento", "Entregue", "Cancelado"] },
      confirmacaoTokenHash: null,
      createdAt: { lt: limiteLembrete },
    },
    include: { author: true },
  });
  for (const order of semConfirmacaoEnviada) {
    await enviarConfirmacaoRecebimento(order, order.author);
  }

  const limiteLiberacao = new Date(Date.now() - DIAS_LIBERACAO * 24 * 60 * 60 * 1000);
  const pendentes = await prisma.order.findMany({
    where: {
      confirmacaoTokenHash: { not: null },
      confirmacaoEnviadaEm: { lt: limiteLiberacao },
      repasseStatus: { not: "transferido" },
    },
    include: { author: true },
  });

  let liberados = 0;
  for (const order of pendentes) {
    const resultado = await processarRepasse(order, order.author);
    if (resultado.ok) {
      await prisma.order.update({ where: { id: order.id }, data: { status: "Entregue" } });
      liberados++;
    }
  }

  // Pedidos criados no checkout mas nunca pagos (a pessoa desistiu antes de concluir o
  // pagamento) — cancela a cobrança de verdade na Asaas (senão a fatura continua válida e
  // um pagamento atrasado nela passaria despercebido) e só marca como "Cancelado" aqui se
  // a Asaas confirmar que ainda não foi pago; se por acaso já tiver sido pago (webhook que
  // falhou), não mexe, pra não arriscar perder um pagamento real.
  const limitePedidoAbandonado = new Date(Date.now() - DIAS_PEDIDO_ABANDONADO * 24 * 60 * 60 * 1000);
  const pedidosAbandonados = await prisma.order.findMany({
    where: { status: "Aguardando pagamento", createdAt: { lt: limitePedidoAbandonado } },
  });
  const gruposAbandonados = new Map<string, string>();
  for (const order of pedidosAbandonados) {
    if (order.grupoPedidoId && order.asaasPaymentId && !gruposAbandonados.has(order.grupoPedidoId)) {
      gruposAbandonados.set(order.grupoPedidoId, order.asaasPaymentId);
    }
  }

  let pedidosCancelados = 0;
  for (const [grupoPedidoId, asaasPaymentId] of gruposAbandonados) {
    const cobranca = await buscarCobranca(asaasPaymentId);
    if (!cobranca) continue;
    if (cobranca.status === "RECEIVED" || cobranca.status === "CONFIRMED") continue;

    const cancelou = await cancelarCobranca(asaasPaymentId);
    if (cancelou) {
      await prisma.order.updateMany({ where: { grupoPedidoId }, data: { status: "Cancelado" } });
      pedidosCancelados++;
    }
  }

  const limiteCadastroPendente = new Date(Date.now() - DIAS_CADASTRO_PENDENTE * 24 * 60 * 60 * 1000);
  const cadastrosAbandonados = await prisma.pendingSignup.findMany({
    where: { createdAt: { lt: limiteCadastroPendente } },
  });
  for (const pendente of cadastrosAbandonados) {
    if (pendente.asaasSubscriptionId) {
      await cancelarAssinaturaAsaas(pendente.asaasSubscriptionId);
    }
    if (pendente.asaasPixAutoAuthorizationId) {
      await cancelarAutorizacaoPixAutomatico(pendente.asaasPixAutoAuthorizationId);
    }
    await prisma.pendingSignup.delete({ where: { id: pendente.id } });
  }

  // Plano concedido manualmente pelo admin (sem cobrança/assinatura real por trás) vence
  // sozinho no prazo escolhido — volta pro Iniciante. Nunca mexe em quem tem assinatura
  // paga de verdade ativa (Checkout ou Pix Automático): essa é controlada pela Asaas, não
  // por esse prazo administrativo.
  const planosAdminVencidos = await prisma.author.findMany({
    where: {
      planoConcedidoAdminAte: { lt: new Date() },
      asaasSubscriptionStatus: { not: "active" },
      asaasPixAutoStatus: { not: "active" },
    },
  });
  for (const author of planosAdminVencidos) {
    await prisma.author.update({
      where: { id: author.id },
      data: { plano: "Iniciante", planoConcedidoAdminCiclo: null, planoConcedidoAdminAte: null },
    });
  }

  return NextResponse.json({
    lembretes: semConfirmacaoEnviada.length,
    processados: pendentes.length,
    liberados,
    pedidosCancelados,
    cadastrosPendentesLimpos: cadastrosAbandonados.length,
    planosAdminVencidos: planosAdminVencidos.length,
  });
}
