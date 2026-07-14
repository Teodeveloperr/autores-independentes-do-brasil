"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAuthorSession } from "@/lib/session";

export type Step1Data = {
  nome: string;
  email: string;
  senha: string;
  genero: string;
  cidade: string;
  bio: string;
};

export type Step1Result = { error: string } | { ok: true; data: Step1Data };

export async function validateStep1(formData: FormData): Promise<Step1Result> {
  const nome = ((formData.get("nome") as string) || "").trim() || "Autor(a)";
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const senha = (formData.get("senha") as string) || "";
  const confirmar = (formData.get("confirmar") as string) || "";
  const genero = (formData.get("genero") as string) || "Romance";
  const cidade = ((formData.get("cidade") as string) || "").trim() || "Brasil";
  const bio = ((formData.get("bio") as string) || "").trim();

  if (senha.length < 4) {
    return { error: "A senha deve ter pelo menos 4 caracteres." };
  }
  if (senha !== confirmar) {
    return { error: "As senhas não coincidem." };
  }
  if (!email) {
    return { error: "Informe um e-mail válido." };
  }

  const existente = await prisma.author.findUnique({ where: { email } });
  if (existente) {
    return { error: "Já existe uma conta cadastrada com esse e-mail." };
  }

  return { ok: true, data: { nome, email, senha, genero, cidade, bio } };
}

export type PlanId = "free" | "essencial" | "premium";
export type Cycle = "mensal" | "semestral" | "anual";

const PLANS: Record<PlanId, { nome: string; monthly: number }> = {
  free: { nome: "Gratuito", monthly: 0 },
  essencial: { nome: "Autor Essencial", monthly: 2990 },
  premium: { nome: "Autor Premium", monthly: 4990 },
};

function priceForCycle(monthlyCentavos: number, cycle: Cycle) {
  if (monthlyCentavos === 0) return 0;
  if (cycle === "semestral") return Math.round(monthlyCentavos * 6 * 0.9);
  if (cycle === "anual") return Math.round(monthlyCentavos * 12 * 0.8);
  return monthlyCentavos;
}

function cycleLabel(cycle: Cycle) {
  return cycle === "semestral" ? "Semestral" : cycle === "anual" ? "Anual" : "Mensal";
}

export async function createAccount(step1: Step1Data, planId: PlanId, cycle: Cycle) {
  // Revalida tudo no servidor — nunca confiar apenas na validação do passo 1 no cliente.
  const email = step1.email.trim().toLowerCase();
  const existente = await prisma.author.findUnique({ where: { email } });
  if (existente) {
    throw new Error("Já existe uma conta cadastrada com esse e-mail.");
  }
  if (step1.senha.length < 4) {
    throw new Error("Senha inválida.");
  }

  const plan = PLANS[planId] ?? PLANS.free;
  const precoCentavos = priceForCycle(plan.monthly, cycle);
  const senhaHash = await bcrypt.hash(step1.senha, 10);

  const author = await prisma.author.create({
    data: {
      nome: step1.nome,
      email,
      senhaHash,
      genero: step1.genero,
      cidade: step1.cidade,
      bio:
        step1.bio ||
        `Autor(a) independente do coletivo Autores Independentes do Brasil, de ${step1.cidade}.`,
      anoEntrada: new Date().getFullYear(),
      plano: plan.nome,
      planoCiclo: cycleLabel(cycle),
      planoValorCentavos: plan.monthly === 0 ? null : precoCentavos,
    },
  });

  await createAuthorSession(author.id);
  redirect("/painel");
}
