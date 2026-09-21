"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/passwordReset";
import { senhaNovaSchema, primeiroErroZod } from "@/lib/validation";

export type ResetState = { error?: string; ok?: boolean } | undefined;

const resetSchema = z
  .object({
    token: z.string().min(1, "Link de redefinição inválido."),
    senha: senhaNovaSchema,
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, { message: "As senhas não coincidem.", path: ["confirmar"] });

export async function resetPassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = resetSchema.safeParse({
    token: (formData.get("token") as string) || "",
    senha: (formData.get("senha") as string) || "",
    confirmar: (formData.get("confirmar") as string) || "",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }
  const { token, senha } = parsed.data;

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
