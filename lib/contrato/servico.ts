import "server-only";
import { prisma } from "@/lib/db";
import { buscarCobranca, cancelarCobranca, criarCobrancaContrato, criarOuBuscarCliente } from "@/lib/asaas";
import { sendContratoPagoEmail, type ContratoEmailInfo } from "@/lib/email";
import { confirmarReservas, horariosDasReservas } from "./agenda";
import { gerarPdfContrato } from "./pdf";
import {
  PACOTES,
  formatarNumeroContrato,
  rotuloHorario,
  type FormaPagamentoContrato,
  type PacoteContrato,
} from "./config";
import type { DadosContratoTexto } from "./texto";
import type { ContratoBienal } from "@/app/generated/prisma/client";

export const ROTULO_FORMA_PAGAMENTO: Record<FormaPagamentoContrato, string> = {
  pix: "Pix à vista",
  cartao: "Cartão de crédito à vista",
};

export function dadosTextoDoContrato(c: ContratoBienal): DadosContratoTexto {
  return {
    numero: c.numero,
    pacote: c.pacote as PacoteContrato,
    formaPagamento: c.formaPagamento as FormaPagamentoContrato,
    descontoPercentual: c.descontoPercentual,
    valorCentavos: c.valorCentavos,
    tipoPessoa: c.tipoPessoa === "juridica" ? "juridica" : "fisica",
    nome: c.nome,
    cpfCnpj: c.cpfCnpj,
    representanteNome: c.representanteNome,
    representanteCpf: c.representanteCpf,
    email: c.email,
    telefone: c.telefone,
    cep: c.cep,
    endereco: c.endereco,
    cidade: c.cidade,
    uf: c.uf,
  };
}

export function infoEmailDoContrato(c: ContratoBienal): ContratoEmailInfo {
  return {
    numeroTexto: c.numero ? formatarNumeroContrato(c.numero) : "sem número",
    nome: c.nome,
    email: c.email,
    pacoteNome: PACOTES[c.pacote as PacoteContrato]?.nome ?? c.pacote,
    formaPagamentoRotulo: ROTULO_FORMA_PAGAMENTO[c.formaPagamento as FormaPagamentoContrato] ?? c.formaPagamento,
    valorCentavos: c.valorCentavos,
  };
}

export async function carregarAssinaturaContratada(): Promise<string | null> {
  const config = await prisma.contratoConfig.findUnique({ where: { id: "unico" } });
  return config?.assinaturaContratadaPng ?? null;
}

const STATUS_PAGO_ASAAS = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

/**
 * Marca o contrato como pago, uma única vez (o updateMany com pagoEm nulo faz de trava), e
 * dispara o que depende disso: horários definitivos e e-mails com o PDF.
 * Devolve true se esta chamada foi a que marcou.
 */
export async function marcarContratoPago(contratoId: string, valorLiquidoCentavos: number | null): Promise<boolean> {
  const marcado = await prisma.contratoBienal.updateMany({
    where: { id: contratoId, pagoEm: null },
    data: { status: "pago", pagoEm: new Date(), valorLiquidoCentavos },
  });
  if (marcado.count === 0) return false;

  const { conflito } = await confirmarReservas(contratoId);
  if (conflito) {
    await prisma.contratoBienal.update({ where: { id: contratoId }, data: { agendaConflito: true } });
  }
  await garantirEmailsDoContratoPago(contratoId);
  return true;
}

/**
 * Envia o contrato por e-mail ao contratante e à contratada, uma única vez. Se o envio falhar,
 * libera a trava pra uma próxima tentativa (a página de confirmação chama de novo).
 */
export async function garantirEmailsDoContratoPago(contratoId: string): Promise<void> {
  const trava = await prisma.contratoBienal.updateMany({
    where: { id: contratoId, status: "pago", emailPagoEnviadoEm: null },
    data: { emailPagoEnviadoEm: new Date() },
  });
  if (trava.count === 0) return;

  const contrato = await prisma.contratoBienal.findUnique({ where: { id: contratoId }, include: { reservas: true } });
  if (!contrato || !contrato.pdf) return;

  const info = infoEmailDoContrato(contrato);
  const agenda = horariosDasReservas(contrato.reservas).map(rotuloHorario);
  const pdf = Buffer.from(contrato.pdf);
  const contratada = process.env.EMAIL_CONTATO || "contato@autoresdobrasil.com.br";

  try {
    await sendContratoPagoEmail(contrato.email, info, { pdf, agenda, paraContratada: false });
    await sendContratoPagoEmail(contratada, info, { pdf, agenda, paraContratada: true });
  } catch (err) {
    console.error(`[contrato] Falha ao enviar e-mails do contrato pago ${contratoId}:`, err);
    await prisma.contratoBienal.update({ where: { id: contratoId }, data: { emailPagoEnviadoEm: null } });
  }
}

/**
 * Consulta a cobrança na Asaas e marca o contrato como pago se ela já foi paga. Rede de
 * segurança pra quando o webhook atrasa: a página de confirmação chama isto.
 */
export async function sincronizarPagamentoContrato(
  contrato: Pick<ContratoBienal, "id" | "status" | "asaasPaymentId">
): Promise<boolean> {
  if (contrato.status !== "assinado" || !contrato.asaasPaymentId) return false;
  const cobranca = await buscarCobranca(contrato.asaasPaymentId);
  if (!cobranca || !STATUS_PAGO_ASAAS.has(cobranca.status)) return false;
  await marcarContratoPago(contrato.id, cobranca.netValueCentavos);
  return true;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

export function urlDoContrato(token: string): string {
  return `${SITE_URL}/contrato-bienal/${token}`;
}

/**
 * Cria a cobrança do contrato na Asaas (Pix ou cartão, conforme a escolha) e grava o link de
 * pagamento. A Asaas pode recusar o endereço de retorno se o domínio não estiver cadastrado na
 * conta dela; nesse caso tenta de novo sem ele (a pessoa paga do mesmo jeito e volta pelo link
 * do e-mail, e a página do contrato confere o pagamento sozinha).
 */
export async function criarPagamentoDoContrato(contrato: ContratoBienal): Promise<string | null> {
  const customerId =
    contrato.asaasCustomerId ??
    (await criarOuBuscarCliente({ nome: contrato.nome, cpf: contrato.cpfCnpj, email: contrato.email }));
  if (!customerId) return null;

  const base = {
    customerId,
    valueCentavos: contrato.valorCentavos,
    billingType: contrato.formaPagamento === "pix" ? ("PIX" as const) : ("CREDIT_CARD" as const),
    description: `Contrato ${contrato.numero ? formatarNumeroContrato(contrato.numero) : ""} - Bienal do Livro Rio 2027 (${PACOTES[contrato.pacote as PacoteContrato]?.nome ?? contrato.pacote})`,
    externalReference: `contrato-bienal:${contrato.id}`,
  };
  let cobranca = await criarCobrancaContrato({ ...base, successUrl: urlDoContrato(contrato.token) });
  if (!cobranca) {
    console.error(`[contrato] Cobrança do contrato ${contrato.id} falhou com o endereço de retorno; tentando sem ele.`);
    cobranca = await criarCobrancaContrato({ ...base, successUrl: "" });
  }
  if (!cobranca) return null;

  await prisma.contratoBienal.update({
    where: { id: contrato.id },
    data: { asaasCustomerId: customerId, asaasPaymentId: cobranca.id, asaasInvoiceUrl: cobranca.invoiceUrl },
  });
  return cobranca.invoiceUrl;
}

/** Cancela a cobrança antiga (vencida ou recusada) e gera uma nova. */
export async function recriarPagamentoDoContrato(contrato: ContratoBienal): Promise<string | null> {
  if (contrato.asaasPaymentId) {
    await cancelarCobranca(contrato.asaasPaymentId);
    await prisma.contratoBienal.update({ where: { id: contrato.id }, data: { asaasPaymentId: null, asaasInvoiceUrl: null } });
  }
  return criarPagamentoDoContrato({ ...contrato, asaasPaymentId: null, asaasInvoiceUrl: null });
}

const LOCK_NUMERO = 7305002;

/**
 * Numera o contrato, gera o PDF com as duas assinaturas e grava tudo de uma vez. Numeração,
 * PDF e status ficam na mesma transação: sem PDF não existe contrato assinado, e a trava
 * (advisory lock) evita que dois contratos recebam o mesmo número.
 */
export async function registrarAssinatura(input: {
  contrato: ContratoBienal;
  assinaturaContratantePng: string;
  assinaturaContratadaPng: string;
  ip: string;
  userAgent: string | null;
  assinadoEm: Date;
}): Promise<ContratoBienal> {
  const { contrato, assinadoEm, ip, userAgent } = input;
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${LOCK_NUMERO})`);
      const ultimo = await tx.contratoBienal.aggregate({ _max: { numero: true } });
      const numero = (ultimo._max.numero ?? 0) + 1;

      const { pdf, pdfHash } = await gerarPdfContrato({
        dados: { ...dadosTextoDoContrato(contrato), numero },
        assinaturaContratantePng: input.assinaturaContratantePng,
        assinaturaContratadaPng: input.assinaturaContratadaPng,
        registro: { assinadoEm, ip, userAgent },
      });

      return tx.contratoBienal.update({
        where: { id: contrato.id },
        data: {
          numero,
          status: "assinado",
          assinadoEm,
          assinaturaIp: ip,
          assinaturaUserAgent: userAgent,
          assinaturaPng: input.assinaturaContratantePng,
          pdf: new Uint8Array(pdf),
          pdfHash,
        },
      });
    },
    { timeout: 30000, maxWait: 10000 }
  );
}
