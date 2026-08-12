"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAuthorSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validarSenha } from "@/lib/password";

export type Step1Data = {
  nome: string;
  email: string;
  senha: string;
  generos: string[];
  cidade: string;
  bio: string;
};

export type Step1Result = { error: string } | { ok: true; data: Step1Data };

export async function validateStep1(formData: FormData): Promise<Step1Result> {
  const nome = ((formData.get("nome") as string) || "").trim() || "Autor(a)";
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const senha = (formData.get("senha") as string) || "";
  const confirmar = (formData.get("confirmar") as string) || "";
  const generos = formData.getAll("generos") as string[];
  const cidade = ((formData.get("cidade") as string) || "").trim() || "Brasil";
  const bio = ((formData.get("bio") as string) || "").trim();

  const erroSenha = validarSenha(senha);
  if (erroSenha) {
    return { error: erroSenha };
  }
  if (senha !== confirmar) {
    return { error: "As senhas não coincidem." };
  }
  if (!email) {
    return { error: "Informe um e-mail válido." };
  }
  if (generos.length === 0) {
    return { error: "Selecione ao menos um gênero literário." };
  }

  const existente = await prisma.author.findUnique({ where: { email } });
  if (existente) {
    return { error: "Já existe uma conta cadastrada com esse e-mail." };
  }

  return { ok: true, data: { nome, email, senha, generos, cidade, bio } };
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
  const ip = await getClientIp();
  const permitido = await checkRateLimit(`cadastro:${ip}`, 5, 60);
  if (!permitido) {
    throw new Error("Muitas tentativas de cadastro a partir deste endereço. Aguarde um pouco e tente novamente.");
  }

  // Revalida tudo no servidor — nunca confiar apenas na validação do passo 1 no cliente.
  const email = step1.email.trim().toLowerCase();
  const existente = await prisma.author.findUnique({ where: { email } });
  if (existente) {
    throw new Error("Já existe uma conta cadastrada com esse e-mail.");
  }
  const erroSenha = validarSenha(step1.senha);
  if (erroSenha) {
    throw new Error(erroSenha);
  }

  // Gateway de pagamento ainda não integrado: força o plano Gratuito
  // independentemente do que o cliente enviar.
  void planId;
  const plan = PLANS.free;
  const precoCentavos = priceForCycle(plan.monthly, cycle);
  const senhaHash = await bcrypt.hash(step1.senha, 10);

  const author = await prisma.author.create({
    data: {
      nome: step1.nome,
      email,
      senhaHash,
      generos: step1.generos,
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

  try {
    await sendWelcomeEmail(author.email, author.nome);
  } catch (err) {
    // Falha no envio do e-mail não deve impedir o cadastro.
    console.error("[email] Falha ao enviar e-mail de boas-vindas:", err);
  }

  await createAuthorSession(author.id);
  redirect("/painel");
}
