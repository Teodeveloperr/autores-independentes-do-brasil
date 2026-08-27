import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { processarRepasse } from "@/lib/repasse";

const PRAZO_DIAS = 7;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const prazoLimite = new Date(Date.now() - PRAZO_DIAS * 24 * 60 * 60 * 1000);
  const pendentes = await prisma.order.findMany({
    where: { status: "Enviado", enviadoEm: { lt: prazoLimite }, repasseStatus: { not: "transferido" } },
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

  return NextResponse.json({ processados: pendentes.length, liberados });
}
