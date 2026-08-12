import "server-only";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";

export async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headerList.get("x-real-ip") || "desconhecido";
}

/**
 * Retorna true se a ação for permitida, false se o limite de tentativas na janela
 * de tempo já foi atingido. Cada chamada permitida registra uma nova tentativa.
 */
export async function checkRateLimit(chave: string, maxTentativas: number, janelaMinutos: number): Promise<boolean> {
  const desde = new Date(Date.now() - janelaMinutos * 60 * 1000);

  const tentativas = await prisma.rateLimitAttempt.count({ where: { chave, createdAt: { gt: desde } } });
  if (tentativas >= maxTentativas) {
    return false;
  }

  await Promise.all([
    prisma.rateLimitAttempt.create({ data: { chave } }),
    prisma.rateLimitAttempt.deleteMany({ where: { chave, createdAt: { lte: desde } } }),
  ]);

  return true;
}
