"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAuthorSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validarSenha } from "@/lib/password";
import { validarCpf } from "@/lib/cpf";
import { criarAssinaturaAsaasParaAutor } from "@/lib/assinatura";
import { PLANOS_PAGOS, valorCicloCentavos, type PlanoPagoSlug, type CicloAssinatura } from "@/lib/plans";

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

export type PlanId = "free" | PlanoPagoSlug;
export type Cycle = CicloAssinatura;

export async function createAccount(step1: Step1Data, planId: PlanId, cycle: Cycle, cpf: string) {
  const ip = await getClientIp();
  const permitido = await checkRateLimit(`cadastro:${ip}`, 5, 60);
  if (!permitido) {
    throw new Error("Muitas tentativas de cadastro a partir deste endereço. Aguarde um pouco e tente novamente.");
  }

  if (planId !== "free" && !validarCpf(cpf)) {
    throw new Error("CPF inválido.");
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

  // A conta é sempre criada como Iniciante — se um plano pago foi escolhido, a assinatura
  // na Asaas é iniciada logo em seguida, e o plano só vira Essencial/Premium de
  // verdade quando o webhook confirmar o pagamento (mesmo funcionamento do upgrade em /assinatura).
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
      plano: "Iniciante",
    },
  });

  try {
    await sendWelcomeEmail(author.email, author.nome);
  } catch (err) {
    // Falha no envio do e-mail não deve impedir o cadastro.
    console.error("[email] Falha ao enviar e-mail de boas-vindas:", err);
  }

  await createAuthorSession(author.id);

  if (planId === "free") {
    redirect("/painel");
  }

  const plano = PLANOS_PAGOS[planId];

  let invoiceUrl: string;
  try {
    invoiceUrl = await criarAssinaturaAsaasParaAutor({
      authorId: author.id,
      authorEmail: author.email,
      authorNome: author.nome,
      cpf,
      planoNome: plano.nome,
      ciclo: cycle,
      valorCentavos: valorCicloCentavos(plano, cycle),
    });
  } catch {
    redirect("/painel?assinatura=erro");
  }

  redirect(invoiceUrl);
}
