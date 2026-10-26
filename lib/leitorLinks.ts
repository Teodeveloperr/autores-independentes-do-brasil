import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/passwordReset";

// Link de uso único, enviado por e-mail, para o leitor criar a senha (primeiro acesso, depois de
// comprar) ou refazê-la (recuperação). Só o hash do código fica no banco.

export type FinalidadeLink = "primeiro_acesso" | "recuperacao";

const VALIDADE_MS: Record<FinalidadeLink, number> = {
  // Quem acabou de comprar pode abrir o e-mail só depois.
  primeiro_acesso: 7 * 24 * 60 * 60 * 1000,
  recuperacao: 60 * 60 * 1000,
};

/** Cria um link novo e invalida os anteriores ainda não usados. Devolve o endereço completo. */
export async function criarLinkLeitor(leitorId: string, finalidade: FinalidadeLink): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.leitorLink.deleteMany({ where: { leitorId, usadoEm: null } });
  await prisma.leitorLink.create({
    data: {
      leitorId,
      tokenHash: hashToken(rawToken),
      finalidade,
      expiraEm: new Date(Date.now() + VALIDADE_MS[finalidade]),
    },
  });
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${siteUrl}/entrar/senha?token=${rawToken}`;
}

/** Procura um link válido (existe, não usado, não expirado) pelo código recebido na URL. */
export async function buscarLinkLeitorValido(rawToken: string) {
  if (!rawToken) return null;
  const link = await prisma.leitorLink.findUnique({ where: { tokenHash: hashToken(rawToken) } });
  if (!link || link.usadoEm || link.expiraEm < new Date()) return null;
  return link;
}
