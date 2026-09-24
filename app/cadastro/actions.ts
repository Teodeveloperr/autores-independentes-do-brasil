"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAuthorSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { validarSenha } from "@/lib/password";
import { criarCadastroPendenteAssinatura, criarCadastroPendente, criarCadastroPendenteParcelado } from "@/lib/assinatura";
import { cancelarAutorizacaoPixAutomatico, cancelarAssinaturaAsaas } from "@/lib/asaas";
import { PLANOS_PAGOS, valorCicloCentavos, type PlanoPagoSlug, type CicloAssinatura } from "@/lib/plans";
import { verificarTurnstile } from "@/lib/turnstile";
import { emailSchema, senhaNovaSchema, cpfSchema, textoSchema, primeiroErroZod } from "@/lib/validation";

export type Step1Data = {
  nome: string;
  email: string;
  senha: string;
  generos: string[];
  cidade: string;
  bio: string;
};

export type Step1Result = { error: string } | { ok: true; data: Step1Data };

const step1Schema = z
  .object({
    nome: textoSchema(120, false),
    email: emailSchema,
    senha: senhaNovaSchema,
    confirmar: z.string(),
    generos: z.array(z.string().min(1)).min(1, "Selecione ao menos um gênero literário."),
    cidade: textoSchema(120, false),
    bio: textoSchema(5000, false),
  })
  .refine((d) => d.senha === d.confirmar, { message: "As senhas não coincidem.", path: ["confirmar"] });

export async function validateStep1(formData: FormData): Promise<Step1Result> {
  const parsed = step1Schema.safeParse({
    nome: (formData.get("nome") as string) || "",
    email: (formData.get("email") as string) || "",
    senha: (formData.get("senha") as string) || "",
    confirmar: (formData.get("confirmar") as string) || "",
    generos: formData.getAll("generos") as string[],
    cidade: (formData.get("cidade") as string) || "",
    bio: (formData.get("bio") as string) || "",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }
  const nome = parsed.data.nome || "Autor(a)";
  const email = parsed.data.email;
  const senha = parsed.data.senha;
  const generos = parsed.data.generos;
  const cidade = parsed.data.cidade || "Brasil";
  const bio = parsed.data.bio;

  const turnstileToken = (formData.get("cf-turnstile-response") as string) || null;
  const humano = await verificarTurnstile(turnstileToken);
  if (!humano) {
    return { error: "Não foi possível confirmar que você não é um robô. Atualize a página e tente de novo." };
  }

  // Não bloqueia por PendingSignup aqui: é só uma tentativa de assinatura em andamento,
  // não uma conta de verdade — se a pessoa desistiu e quer tentar de novo com o mesmo
  // e-mail, createAccount() cuida de cancelar a tentativa antiga e abrir uma nova.
  const existente = await prisma.author.findUnique({ where: { email } });
  if (existente) {
    return { error: "Já existe uma conta cadastrada com esse e-mail." };
  }

  return { ok: true, data: { nome, email, senha, generos, cidade, bio } };
}

export type PlanId = "free" | PlanoPagoSlug;
export type Cycle = CicloAssinatura;
export type MetodoPagamento = "cartao" | "pix" | "parcelado";

export type CreateAccountResult = { error: string } | { pixQrCode: { payload: string; image: string } } | undefined;

export type DadosCartao = { telefone: string; cep: string; numero: string; complemento?: string };

export async function createAccount(
  step1: Step1Data,
  planId: PlanId,
  cycle: Cycle,
  cpf: string,
  metodoPagamento: MetodoPagamento,
  dadosCartao?: DadosCartao
): Promise<CreateAccountResult> {
  // Erros lançados com throw numa Server Action são redigidos pelo Next.js em produção
  // (a mensagem some, só sobra um digest genérico) — por isso essa função sempre retorna
  // { error } em vez de lançar, exceto pra redirect(), que o framework trata à parte.
  const ip = await getClientIp();
  const permitido = await checkRateLimit(`cadastro:${ip}`, 5, 60);
  if (!permitido) {
    return { error: "Muitas tentativas de cadastro a partir deste endereço. Aguarde um pouco e tente novamente." };
  }

  if (planId !== "free" && !cpfSchema.safeParse(cpf).success) {
    return { error: "CPF inválido." };
  }

  if (planId === "premiumPlus" && cycle !== "anual") {
    return { error: "O plano Premium+ está disponível apenas no ciclo anual." };
  }

  if (metodoPagamento === "parcelado" && cycle === "mensal") {
    return { error: "O parcelamento no cartão está disponível apenas nos ciclos semestral e anual." };
  }

  if (planId !== "free" && metodoPagamento === "cartao") {
    if (!dadosCartao?.telefone || !dadosCartao?.cep || !dadosCartao?.numero) {
      return { error: "Preencha telefone, CEP e número pra pagar com cartão." };
    }
  }

  // Revalida tudo no servidor — nunca confiar apenas na validação do passo 1 no cliente.
  const email = step1.email.trim().toLowerCase();
  const [existente, pendente] = await Promise.all([
    prisma.author.findUnique({ where: { email } }),
    prisma.pendingSignup.findUnique({ where: { email } }),
  ]);
  if (existente) {
    return { error: "Já existe uma conta cadastrada com esse e-mail." };
  }
  const erroSenha = validarSenha(step1.senha);
  if (erroSenha) {
    return { error: erroSenha };
  }

  const senhaHash = await bcrypt.hash(step1.senha, 10);

  if (planId === "free") {
    // Se a pessoa tinha uma tentativa de plano pago pendente com esse e-mail e desistiu
    // pra ir de gratuito, cancela aquela autorização e libera o e-mail.
    if (pendente) {
      if (pendente.asaasSubscriptionId) {
        await cancelarAssinaturaAsaas(pendente.asaasSubscriptionId);
      }
      if (pendente.asaasPixAutoAuthorizationId) {
        await cancelarAutorizacaoPixAutomatico(pendente.asaasPixAutoAuthorizationId);
      }
      await prisma.pendingSignup.delete({ where: { id: pendente.id } });
    }

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
    redirect("/painel");
  }

  // Plano pago: a conta só é criada de verdade quando o webhook confirmar que o pagamento
  // da assinatura foi recebido (ver app/api/webhooks/asaas/route.ts) — até lá, os dados
  // ficam guardados em PendingSignup. Assim, se a pessoa desistir antes de pagar,
  // não sobra nenhuma conta "fantasma".
  const plano = PLANOS_PAGOS[planId];

  if (metodoPagamento === "pix") {
    try {
      const { qrCodePayload, qrCodeImage } = await criarCadastroPendente({
        nome: step1.nome,
        email,
        senhaHash,
        generos: step1.generos,
        cidade: step1.cidade,
        bio: step1.bio || `Autor(a) independente do coletivo Autores Independentes do Brasil, de ${step1.cidade}.`,
        planoSlug: planId,
        planoNome: plano.nome,
        ciclo: cycle,
        valorCentavos: valorCicloCentavos(plano, cycle),
        cpf,
      });
      return { pixQrCode: { payload: qrCodePayload, image: qrCodeImage } };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Não foi possível gerar o Pix. Tente novamente em instantes." };
    }
  }

  if (metodoPagamento === "parcelado") {
    let checkoutUrlParcelado: string;
    try {
      ({ checkoutUrl: checkoutUrlParcelado } = await criarCadastroPendenteParcelado({
        nome: step1.nome,
        email,
        senhaHash,
        generos: step1.generos,
        cidade: step1.cidade,
        bio: step1.bio || `Autor(a) independente do coletivo Autores Independentes do Brasil, de ${step1.cidade}.`,
        planoSlug: planId,
        planoNome: plano.nome,
        ciclo: cycle,
        valorCentavos: valorCicloCentavos(plano, cycle),
        cpf,
      }));
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Não foi possível iniciar o pagamento parcelado. Tente novamente em instantes." };
    }
    redirect(checkoutUrlParcelado);
  }

  let checkoutUrl: string;
  try {
    ({ checkoutUrl } = await criarCadastroPendenteAssinatura({
      nome: step1.nome,
      email,
      senhaHash,
      generos: step1.generos,
      cidade: step1.cidade,
      bio: step1.bio || `Autor(a) independente do coletivo Autores Independentes do Brasil, de ${step1.cidade}.`,
      planoSlug: planId,
      planoNome: plano.nome,
      ciclo: cycle,
      valorCentavos: valorCicloCentavos(plano, cycle),
      cpf,
      telefone: dadosCartao!.telefone,
      cep: dadosCartao!.cep,
      numero: dadosCartao!.numero,
      complemento: dadosCartao!.complemento,
    }));
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível iniciar o pagamento. Tente novamente em instantes." };
  }

  redirect(checkoutUrl);
}
