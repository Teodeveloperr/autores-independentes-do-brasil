import "server-only";
import crypto from "node:crypto";
import { prisma } from "@/lib/db";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function criarLinkRedefinicaoSenha(authorId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      authorId,
      tokenHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return `${siteUrl}/redefinir-senha?token=${rawToken}`;
}
