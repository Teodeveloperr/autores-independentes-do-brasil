"use server";

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export type ResetState = { error?: string; ok?: boolean } | undefined;

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = (formData.get("token") as string) || "";
  const senha = (formData.get("senha") as string) || "";
  const confirmar = (formData.get("confirmar") as string) || "";

  if (!token) {
    return { error: "Link de redefinição inválido." };
  }
  if (senha.length < 4) {
    return { error: "A senha deve ter pelo menos 4 caracteres." };
  }
  if (senha !== confirmar) {
    return { error: "As senhas não coincidem." };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { error: "Este link de redefinição é inválido ou expirou. Solicite um novo." };
  }

  const senhaHash = await bcrypt.hash(senha, 10);
  await prisma.$transaction([
    prisma.author.update({ where: { id: record.authorId }, data: { senhaHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);

  return { ok: true };
}
