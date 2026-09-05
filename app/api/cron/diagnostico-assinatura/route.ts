import { NextResponse } from "next/server";
import { getCurrentAdmin } from "@/lib/auth";
import { listarAssinaturasPorCliente, listarCobrancasDaAssinatura } from "@/lib/asaas";

// Endpoint temporário de diagnóstico — busca as assinaturas de um cliente na Asaas (e as
// cobranças de uma assinatura específica) pra investigar um cadastro pendente travado
// (José Sérgio Batista, PendingSignup sem asaasSubscriptionId). Gated por sessão de admin
// (visitar logado no /admin). Remover depois de usado.
export async function GET(request: Request) {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const customer = url.searchParams.get("customer");
  const subscription = url.searchParams.get("subscription");

  if (subscription) {
    const cobrancas = await listarCobrancasDaAssinatura(subscription);
    return NextResponse.json({ cobrancas });
  }

  if (!customer) {
    return NextResponse.json({ error: "Informe ?customer=cus_... ou ?subscription=sub_..." }, { status: 400 });
  }

  const assinaturas = await listarAssinaturasPorCliente(customer);
  return NextResponse.json({ assinaturas });
}
