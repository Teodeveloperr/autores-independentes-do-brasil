"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAuthorSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const senha = (formData.get("senha") as string) || "";

  if (!email || !senha) {
    return { error: "Preencha e-mail e senha para continuar." };
  }

  const author = await prisma.author.findUnique({ where: { email } });
  if (!author) {
    return { error: "Não encontramos uma conta com esse e-mail." };
  }

  const senhaOk = await bcrypt.compare(senha, author.senhaHash);
  if (!senhaOk) {
    return { error: "Senha incorreta. Tente novamente." };
  }

  await createAuthorSession(author.id);
  redirect("/painel");
}
