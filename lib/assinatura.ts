import "server-only";
import { prisma } from "@/lib/db";
import { criarAssinatura } from "@/lib/mercadoPago";
import { criarOuBuscarCliente, criarAutorizacaoPixAutomatico, criarAssinaturaAsaas, type FrequenciaPixAutomatico, type CicloAssinaturaAsaas } from "@/lib/asaas";
import { CICLO_MESES, type PlanoPagoSlug, type CicloAssinatura } from "@/lib/plans";

const FREQUENCIA_POR_CICLO: Record<CicloAssinatura, FrequenciaPixAutomatico> = {
  mensal: "MONTHLY",
  semestral: "SEMIANNUALLY",
  anual: "ANNUALLY",
};

const CYCLE_POR_CICLO: Record<CicloAssinatura, CicloAssinaturaAsaas> = {
  mensal: "MONTHLY",
  semestral: "SEMIANNUALLY",
  anual: "YEARLY",
};

export async function criarAssinaturaMp(input: {
  authorId: string;
  authorEmail: string;
  planoSlug: PlanoPagoSlug;
  planoNome: string;
  ciclo: CicloAssinatura;
  valorCentavos: number;
  backUrl: string;
}): Promise<string> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

  const assinatura = await criarAssinatura({
    authorId: input.authorId,
    authorEmail: input.authorEmail,
    planoSlug: input.planoSlug,
    planoNome: input.planoNome,
    valorCentavos: input.valorCentavos,
    cicloMeses: CICLO_MESES[input.ciclo],
    backUrl: input.backUrl,
    notificationUrl: `${siteUrl}/api/webhooks/mercadopago`,
  });

  if (!assinatura) {
    throw new Error("Não foi possível iniciar a assinatura no Mercado Pago. Tente novamente em instantes.");
  }

  await prisma.author.update({
    where: { id: input.authorId },
    data: {
      mpPreapprovalId: assinatura.id,
      mpSubscriptionStatus: "pending",
      planoCiclo: input.ciclo,
      planoValorCentavos: input.valorCentavos,
    },
  });

  return assinatura.initPoint;
}

export async function criarAssinaturaPixAutomatico(input: {
  authorId: string;
  authorEmail: string;
  authorNome: string;
  cpf: string;
  planoNome: string;
  ciclo: CicloAssinatura;
  valorCentavos: number;
}): Promise<{ qrCodePayload: string; qrCodeImage: string }> {
  const customerId = await criarOuBuscarCliente({ nome: input.authorNome, cpf: input.cpf, email: input.authorEmail });
  if (!customerId) {
    throw new Error("Não foi possível validar seus dados na Asaas. Confira o CPF e tente novamente.");
  }

  const autorizacao = await criarAutorizacaoPixAutomatico({
    customerId,
    frequency: FREQUENCIA_POR_CICLO[input.ciclo],
    contractId: input.authorId,
    valueCentavos: input.valorCentavos,
    description: `Assinatura ${input.planoNome}`,
  });

  if (!autorizacao) {
    throw new Error("Não foi possível gerar o Pix Automático. Tente novamente em instantes.");
  }

  await prisma.author.update({
    where: { id: input.authorId },
    data: {
      cpf: input.cpf,
      asaasPixCustomerId: customerId,
      asaasPixAutoAuthorizationId: autorizacao.id,
      asaasPixAutoStatus: "pending",
      planoCiclo: input.ciclo,
      planoValorCentavos: input.valorCentavos,
      planoPendente: input.planoNome,
    },
  });

  return { qrCodePayload: autorizacao.qrCodePayload, qrCodeImage: autorizacao.qrCodeImage };
}

export async function criarAssinaturaAsaasParaAutor(input: {
  authorId: string;
  authorEmail: string;
  authorNome: string;
  cpf: string;
  planoNome: string;
  ciclo: CicloAssinatura;
  valorCentavos: number;
}): Promise<string> {
  const customerId = await criarOuBuscarCliente({ nome: input.authorNome, cpf: input.cpf, email: input.authorEmail });
  if (!customerId) {
    throw new Error("Não foi possível validar seus dados na Asaas. Confira o CPF e tente novamente.");
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

  const assinatura = await criarAssinaturaAsaas({
    customerId,
    cycle: CYCLE_POR_CICLO[input.ciclo],
    valueCentavos: input.valorCentavos,
    description: `Assinatura ${input.planoNome}`,
    successUrl: `${siteUrl}/painel?assinatura=pendente`,
  });

  if (!assinatura || !assinatura.invoiceUrl) {
    throw new Error("Não foi possível iniciar a assinatura. Tente novamente em instantes.");
  }

  await prisma.author.update({
    where: { id: input.authorId },
    data: {
      cpf: input.cpf,
      asaasSubscriptionId: assinatura.id,
      asaasSubscriptionStatus: "pending",
      planoCiclo: input.ciclo,
      planoValorCentavos: input.valorCentavos,
      planoPendente: input.planoNome,
    },
  });

  return assinatura.invoiceUrl;
}
