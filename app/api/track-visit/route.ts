import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

// Incrementa o contador do dia (cria a linha se ainda não existir) — chamado de forma
// assíncrona pelo navegador (fetch com keepalive), nunca bloqueia o carregamento da página.
export async function POST() {
  try {
    await prisma.siteVisit.upsert({
      where: { data: new Date(hoje()) },
      update: { contagem: { increment: 1 } },
      create: { data: new Date(hoje()), contagem: 1 },
    });
  } catch (err) {
    console.error("[track-visit] Falha ao registrar visita:", err);
  }
  return NextResponse.json({ ok: true });
}
