import { NextResponse } from "next/server";
import { listarAssinaturasPorCliente } from "@/lib/asaas";

// Endpoint temporário de diagnóstico — busca as assinaturas de um cliente na Asaas pra
// investigar um cadastro pendente travado (José Sérgio Batista, PendingSignup sem
// asaasSubscriptionId). Remover depois de usado.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const customer = new URL(request.url).searchParams.get("customer");
  if (!customer) {
    return NextResponse.json({ error: "Informe ?customer=cus_..." }, { status: 400 });
  }

  const assinaturas = await listarAssinaturasPorCliente(customer);
  return NextResponse.json({ assinaturas });
}
