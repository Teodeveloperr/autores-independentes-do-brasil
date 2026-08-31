import { NextResponse } from "next/server";
import { criarOuBuscarCliente, criarAutorizacaoPixAutomatico, cancelarAutorizacaoPixAutomatico } from "@/lib/asaas";

// Rota temporária de diagnóstico — confirma se a conta Asaas já tem Pix Automático
// liberado, criando uma autorização de valor simbólico e cancelando na sequência.
// Remover depois do teste.
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const customerId = await criarOuBuscarCliente({
    nome: "Teste Pix Automatico",
    cpf: "11144477735",
    email: "teste-diagnostico@autoresdobrasil.com.br",
  });

  if (!customerId) {
    return NextResponse.json({ etapa: "criarOuBuscarCliente", ok: false });
  }

  const autorizacao = await criarAutorizacaoPixAutomatico({
    customerId,
    frequency: "MONTHLY",
    contractId: `diagnostico-${Date.now()}`,
    valueCentavos: 500,
    description: "Teste de diagnóstico — Pix Automático",
  });

  if (!autorizacao) {
    return NextResponse.json({ etapa: "criarAutorizacaoPixAutomatico", ok: false, customerId });
  }

  const cancelado = await cancelarAutorizacaoPixAutomatico(autorizacao.id);

  return NextResponse.json({
    ok: true,
    customerId,
    autorizacaoId: autorizacao.id,
    temQrCode: Boolean(autorizacao.qrCodePayload),
    cancelado,
  });
}
