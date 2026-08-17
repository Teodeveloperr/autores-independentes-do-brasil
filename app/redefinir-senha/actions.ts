"use server";

import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { validarSenha } from "@/lib/password";
import { hashToken } from "@/lib/passwordReset";

export type ResetState = { error?: string; ok?: boolean } | undefined;

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const token = (formData.get("token") as string) || "";
  const senha = (formData.get("senha") as string) || "";
  const confirmar = (formData.get("confirmar") as string) || "";

  if (!token) {
    return { error: "Link de redefinição inválido." };
  }
  const erroSenha = validarSenha(senha);
  if (erroSenha) {
    return { error: erroSenha };
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
