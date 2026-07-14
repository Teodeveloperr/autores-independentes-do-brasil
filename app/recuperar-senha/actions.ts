"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1h

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type RequestResetState = { sent?: boolean; error?: string } | undefined;

export async function requestPasswordReset(
  _prev: RequestResetState,
  formData: FormData
): Promise<RequestResetState> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  if (!email) {
    return { error: "Digite um e-mail válido." };
  }

  const author = await prisma.author.findUnique({ where: { email } });

  // Sempre um sucesso genérico — não revela se o e-mail existe na base.
  if (author) {
    const rawToken = crypto.randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: {
        authorId: author.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const resetUrl = `${siteUrl}/redefinir-senha?token=${rawToken}`;
    await sendPasswordResetEmail(author.email, resetUrl);
  }

  return { sent: true };
}
