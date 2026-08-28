import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processarRepasse, enviarConfirmacaoRecebimento } from "@/lib/repasse";

const DIAS_LEMBRETE = 3;
const DIAS_LIBERACAO = 7;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const limiteLembrete = new Date(Date.now() - DIAS_LEMBRETE * 24 * 60 * 60 * 1000);
  const semConfirmacaoEnviada = await prisma.order.findMany({
    where: {
      status: { notIn: ["Aguardando pagamento", "Entregue"] },
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

  return NextResponse.json({ lembretes: semConfirmacaoEnviada.length, processados: pendentes.length, liberados });
}
