import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buscarAssinatura, verificarAssinaturaWebhook } from "@/lib/mercadoPago";
import { PLANOS_PAGOS, type PlanoPagoSlug } from "@/lib/plans";

const TIPOS_ACEITOS = new Set(["preapproval", "subscription_preapproval"]);

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  let body: { type?: string; action?: string; data?: { id?: string } } = {};
  try {
    body = await request.json();
  } catch {
    // corpo vazio ou não-JSON — segue usando só os query params
  }

  const tipo = body.type || url.searchParams.get("type") || "";
  const dataId = body.data?.id || url.searchParams.get("data.id") || "";

  if (!TIPOS_ACEITOS.has(tipo) || !dataId) {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const xSignature = request.headers.get("x-signature");
  const xRequestId = request.headers.get("x-request-id");
  const assinaturaValida = verificarAssinaturaWebhook(xSignature, xRequestId, dataId);
  if (!assinaturaValida) {
    console.error("[mercadopago] Webhook rejeitado: assinatura inválida ou não configurada.");
    return NextResponse.json({ status: "invalid signature" }, { status: 401 });
  }

  const preapproval = await buscarAssinatura(dataId);
  if (!preapproval) {
    return NextResponse.json({ status: "not found" }, { status: 200 });
  }

  const [authorId, planoSlug] = (preapproval.externalReference || "").split("|") as [string, PlanoPagoSlug];
  if (!authorId) {
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  const author = await prisma.author.findUnique({ where: { id: authorId } });
  if (!author || author.mpPreapprovalId !== preapproval.id) {
    // Autor não encontrado ou webhook de uma assinatura antiga/substituída — ignora.
    return NextResponse.json({ status: "ignored" }, { status: 200 });
  }

  if (preapproval.status === "authorized") {
    const plano = PLANOS_PAGOS[planoSlug];
    await prisma.author.update({
      where: { id: authorId },
      data: { plano: plano?.nome ?? author.plano, mpSubscriptionStatus: "authorized" },
    });
  } else if (preapproval.status === "paused" || preapproval.status === "cancelled") {
    await prisma.author.update({
      where: { id: authorId },
      data: { plano: "Gratuito", mpSubscriptionStatus: preapproval.status },
    });
  } else {
    await prisma.author.update({
      where: { id: authorId },
      data: { mpSubscriptionStatus: preapproval.status },
    });
  }

  return NextResponse.json({ status: "ok" }, { status: 200 });
}
