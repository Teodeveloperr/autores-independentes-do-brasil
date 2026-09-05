import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { listarAssinaturasPorCliente } from "@/lib/asaas";

// Endpoint temporário de diagnóstico — busca as assinaturas de um cliente na Asaas pra
// investigar um cadastro pendente travado (José Sérgio Batista, PendingSignup sem
// asaasSubscriptionId). Gated por sessão de admin (visitar logado no /admin). Remover
// depois de usado.
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const customer = new URL(request.url).searchParams.get("customer");
  if (!customer) {
    return NextResponse.json({ error: "Informe ?customer=cus_..." }, { status: 400 });
  }

  const assinaturas = await listarAssinaturasPorCliente(customer);
  return NextResponse.json({ assinaturas });
}
