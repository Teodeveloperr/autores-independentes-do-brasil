"use server";

import crypto from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getCurrentAuthor } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verificarTurnstile } from "@/lib/turnstile";
import { validarCpf, validarCnpj } from "@/lib/cpf";
import { buscarCobranca } from "@/lib/asaas";
import {
  sendContratoAguardandoPagamentoEmail,
  sendContratoAssinadoAvisoEmail,
  sendContratoCodigoEmail,
  sendContratoPagoEmail,
} from "@/lib/email";
import { emailSchema } from "@/lib/validation";
import {
  ESTADOS_BR,
  HORAS_RESERVA_APOS_ASSINAR,
  MINUTOS_RESERVA_ANTES_ASSINAR,
  TEXTO_VERSAO,
  calcularPrecoContrato,
  formaPagamentoValida,
  pacoteValido,
  rotuloHorario,
  type HorarioEscolhido,
} from "@/lib/contrato/config";
import { carregarOcupacao, horariosDasReservas, prorrogarReservas, reservarHorarios, validarSelecao } from "@/lib/contrato/agenda";
import { validarImagemAssinatura } from "@/lib/contrato/assinaturaImagem";
import { montarContrato, type ContratoMontado } from "@/lib/contrato/texto";
import {
  carregarAssinaturaContratada,
  criarPagamentoDoContrato,
  dadosTextoDoContrato,
  infoEmailDoContrato,
  marcarContratoPago,
  recriarPagamentoDoContrato,
  registrarAssinatura,
  urlDoContrato,
} from "@/lib/contrato/servico";

const STATUS_PAGO_ASAAS = new Set(["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"]);

function hashCodigo(codigo: string, token: string): string {
  return crypto.createHash("sha256").update(`${codigo}:${token}`).digest("hex");
}

function gerarCodigo(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

function soDigitos(valor: FormDataEntryValue | null): string {
  return typeof valor === "string" ? valor.replace(/\D/g, "") : "";
}

function texto(valor: FormDataEntryValue | null, max: number): string {
  return typeof valor === "string" ? valor.trim().slice(0, max) : "";
}

async function cabecalhos() {
  const lista = await headers();
  return { userAgent: lista.get("user-agent")?.slice(0, 300) ?? null };
}

export type DisponibilidadeAgenda = Record<string, number>;

/** Ocupação atual de cada horário, pra grade de escolha. Não expõe nada de quem reservou. */
export async function obterDisponibilidade(): Promise<DisponibilidadeAgenda> {
  return carregarOcupacao();
}

export type IniciarContratoResultado = { erro: string } | { token: string };

export async function iniciarContrato(formData: FormData): Promise<IniciarContratoResultado> {
  const ip = await getClientIp();
  if (!(await checkRateLimit(`contrato-iniciar:${ip}`, 8, 60))) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
  }
  if (!(await verificarTurnstile(typeof formData.get("cf-turnstile-response") === "string" ? (formData.get("cf-turnstile-response") as string) : null))) {
    return { erro: "Não foi possível confirmar que você não é um robô. Recarregue a página e tente de novo." };
  }
  if (!(await carregarAssinaturaContratada())) {
    return { erro: "A contratação está indisponível no momento. Fale com a equipe pelo WhatsApp." };
  }

  const pacote = texto(formData.get("pacote"), 20);
  const forma = texto(formData.get("formaPagamento"), 10);
  if (!pacoteValido(pacote)) return { erro: "Escolha um pacote." };
  if (!formaPagamentoValida(forma)) return { erro: "Escolha a forma de pagamento." };

  let horarios: HorarioEscolhido[] = [];
  try {
    const bruto = JSON.parse(texto(formData.get("horarios"), 4000) || "[]") as unknown;
    if (!Array.isArray(bruto)) throw new Error("formato");
    horarios = bruto.map((h) => ({
      tipo: (h as HorarioEscolhido).tipo,
      dia: String((h as HorarioEscolhido).dia),
      horaInicio: Number((h as HorarioEscolhido).horaInicio),
    }));
  } catch {
    return { erro: "Horários inválidos. Escolha os horários de novo." };
  }
  const erroHorarios = validarSelecao(pacote, horarios);
  if (erroHorarios) return { erro: erroHorarios };

  const tipoPessoa = texto(formData.get("tipoPessoa"), 10) === "juridica" ? "juridica" : "fisica";
  const nome = texto(formData.get("nome"), 120);
  if (nome.length < 3) return { erro: "Informe o nome completo." };

  const cpfCnpj = soDigitos(formData.get("cpfCnpj"));
  if (tipoPessoa === "fisica" && !validarCpf(cpfCnpj)) return { erro: "CPF inválido." };
  if (tipoPessoa === "juridica" && !validarCnpj(cpfCnpj)) return { erro: "CNPJ inválido." };

  let representanteNome: string | null = null;
  let representanteCpf: string | null = null;
  if (tipoPessoa === "juridica") {
    representanteNome = texto(formData.get("representanteNome"), 120);
    representanteCpf = soDigitos(formData.get("representanteCpf"));
    if (representanteNome.length < 3) return { erro: "Informe o nome de quem assina pela empresa." };
    if (!validarCpf(representanteCpf)) return { erro: "CPF de quem assina pela empresa é inválido." };
  }

  const emailResultado = emailSchema.safeParse(texto(formData.get("email"), 160));
  if (!emailResultado.success) return { erro: "Informe um e-mail válido." };
  const email = emailResultado.data as string;

  const telefone = soDigitos(formData.get("telefone"));
  if (telefone.length < 10 || telefone.length > 11) return { erro: "Informe um telefone com DDD." };

  const cep = soDigitos(formData.get("cep"));
  if (cep.length !== 8) return { erro: "Informe um CEP válido." };
  const endereco = texto(formData.get("endereco"), 160);
  const cidade = texto(formData.get("cidade"), 80);
  const uf = texto(formData.get("uf"), 2).toUpperCase();
  if (endereco.length < 3) return { erro: "Informe o endereço." };
  if (cidade.length < 2) return { erro: "Informe a cidade." };
  if (!(ESTADOS_BR as readonly string[]).includes(uf)) return { erro: "Escolha o estado." };

  if (!(await checkRateLimit(`contrato-iniciar-email:${email}`, 5, 60))) {
    return { erro: "Muitas tentativas com este e-mail. Aguarde um pouco e tente de novo." };
  }

  // O desconto de assinante só vale com a pessoa logada; o preço nunca vem do navegador.
  const author = await getCurrentAuthor();
  const planoAssinante = author?.plano ?? null;
  const preco = calcularPrecoContrato(pacote, forma, planoAssinante);

  const token = crypto.randomBytes(24).toString("base64url");
  const codigo = gerarCodigo();

  const contrato = await prisma.contratoBienal.create({
    data: {
      token,
      pacote,
      formaPagamento: forma,
      valorTabelaCentavos: preco.tabelaCentavos,
      descontoPercentual: preco.descontoPercentual,
      valorCentavos: preco.valorCentavos,
      planoAssinante,
      textoVersao: TEXTO_VERSAO,
      tipoPessoa,
      nome,
      cpfCnpj,
      representanteNome,
      representanteCpf,
      email,
      telefone,
      cep,
      endereco,
      cidade,
      uf,
      autorId: author?.id ?? null,
      codigoHash: hashCodigo(codigo, token),
      codigoExpiraEm: new Date(Date.now() + 15 * 60 * 1000),
    },
  });

  const reserva = await reservarHorarios(contrato.id, horarios, new Date(Date.now() + MINUTOS_RESERVA_ANTES_ASSINAR * 60 * 1000));
  if (!reserva.ok) {
    await prisma.contratoBienal.delete({ where: { id: contrato.id } });
    return { erro: reserva.erro };
  }

  try {
    await sendContratoCodigoEmail(email, nome, codigo);
  } catch (err) {
    console.error("[contrato] Falha ao enviar o código de confirmação:", err);
    await prisma.contratoBienal.delete({ where: { id: contrato.id } });
    return { erro: "Não conseguimos enviar o código para o seu e-mail. Confira o endereço e tente de novo." };
  }

  return { token };
}

export async function reenviarCodigo(token: string): Promise<{ erro?: string }> {
  if (!(await checkRateLimit(`contrato-codigo:${token}`, 5, 30))) {
    return { erro: "Você já pediu muitos códigos. Aguarde alguns minutos." };
  }
  const contrato = await prisma.contratoBienal.findUnique({ where: { token } });
  if (!contrato || contrato.status !== "rascunho") return { erro: "Contrato não encontrado." };

  const codigo = gerarCodigo();
  await prisma.contratoBienal.update({
    where: { id: contrato.id },
    data: { codigoHash: hashCodigo(codigo, token), codigoExpiraEm: new Date(Date.now() + 15 * 60 * 1000), codigoTentativas: 0 },
  });
  try {
    await sendContratoCodigoEmail(contrato.email, contrato.nome, codigo);
  } catch (err) {
    console.error("[contrato] Falha ao reenviar o código:", err);
    return { erro: "Não conseguimos enviar o código agora. Tente de novo em instantes." };
  }
  return {};
}

/**
 * Troca o e-mail de um contrato ainda não assinado (quem digitou errado) e envia o código para o
 * novo endereço. O e-mail só é trocado depois de o código sair, pra nunca ficar um endereço
 * novo sem código. Respeita o mesmo limite por e-mail do início do contrato.
 */
export async function corrigirEmail(token: string, novoEmail: string): Promise<{ erro: string } | { email: string }> {
  const ip = await getClientIp();
  if (!(await checkRateLimit(`contrato-corrigir-ip:${ip}`, 15, 60))) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
  }
  if (!(await checkRateLimit(`contrato-corrigir:${token}`, 5, 30))) {
    return { erro: "Você já trocou o e-mail várias vezes. Aguarde alguns minutos." };
  }
  const resultado = emailSchema.safeParse(novoEmail.slice(0, 160));
  if (!resultado.success) return { erro: "Informe um e-mail válido." };
  const email = resultado.data as string;

  const contrato = await prisma.contratoBienal.findUnique({ where: { token } });
  if (!contrato || contrato.status !== "rascunho") return { erro: "Contrato não encontrado." };
  if (contrato.emailVerificadoEm) return { erro: "O e-mail já foi confirmado." };
  if (email === contrato.email) return { erro: "Este já é o e-mail informado. Use o botão para enviar o código de novo." };

  if (!(await checkRateLimit(`contrato-iniciar-email:${email}`, 5, 60))) {
    return { erro: "Muitas tentativas com este e-mail. Aguarde um pouco e tente de novo." };
  }

  const codigo = gerarCodigo();
  try {
    await sendContratoCodigoEmail(email, contrato.nome, codigo);
  } catch (err) {
    console.error("[contrato] Falha ao enviar o código para o e-mail corrigido:", err);
    return { erro: "Não conseguimos enviar o código para esse e-mail. Confira o endereço e tente de novo." };
  }
  await prisma.contratoBienal.update({
    where: { id: contrato.id },
    data: { email, codigoHash: hashCodigo(codigo, token), codigoExpiraEm: new Date(Date.now() + 15 * 60 * 1000), codigoTentativas: 0 },
  });
  return { email };
}

export type VerificarCodigoResultado = { erro: string } | { contrato: ContratoMontado };

export async function verificarCodigo(token: string, codigoDigitado: string): Promise<VerificarCodigoResultado> {
  const contrato = await prisma.contratoBienal.findUnique({ where: { token } });
  if (!contrato || contrato.status !== "rascunho") return { erro: "Contrato não encontrado." };

  if (!contrato.emailVerificadoEm) {
    if (!contrato.codigoHash || !contrato.codigoExpiraEm || contrato.codigoExpiraEm < new Date()) {
      return { erro: "O código expirou. Peça um novo código." };
    }
    if (contrato.codigoTentativas >= 5) return { erro: "Muitas tentativas erradas. Peça um novo código." };

    const digitado = codigoDigitado.replace(/\D/g, "");
    const esperado = Buffer.from(contrato.codigoHash);
    const recebido = Buffer.from(hashCodigo(digitado, token));
    const confere = esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido);
    if (!confere) {
      await prisma.contratoBienal.update({ where: { id: contrato.id }, data: { codigoTentativas: { increment: 1 } } });
      return { erro: "Código incorreto. Confira o e-mail e tente de novo." };
    }
    await prisma.contratoBienal.update({
      where: { id: contrato.id },
      data: { emailVerificadoEm: new Date(), codigoHash: null, codigoExpiraEm: null },
    });
  }
  return { contrato: montarContrato(dadosTextoDoContrato(contrato)) };
}

export type AssinarResultado = { erro: string; recomecar?: boolean } | { pagamentoUrl: string | null };

export async function assinarContrato(token: string, assinaturaPng: string, aceitou: boolean): Promise<AssinarResultado> {
  const ip = await getClientIp();
  if (!(await checkRateLimit(`contrato-assinar:${ip}`, 10, 60))) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
  }
  if (!aceitou) return { erro: "Marque a declaração de aceite para assinar." };
  const imagem = validarImagemAssinatura(assinaturaPng);
  if (!imagem) return { erro: "Assinatura inválida. Assine de novo." };

  const contrato = await prisma.contratoBienal.findUnique({ where: { token }, include: { reservas: true } });
  if (!contrato || contrato.status !== "rascunho") return { erro: "Contrato não encontrado ou já assinado." };
  if (!contrato.emailVerificadoEm) return { erro: "Confirme o seu e-mail antes de assinar." };

  const assinaturaContratada = await carregarAssinaturaContratada();
  if (!assinaturaContratada) return { erro: "A contratação está indisponível no momento. Fale com a equipe." };

  // Se o prazo curto da reserva venceu enquanto a pessoa lia, tenta segurar os mesmos horários de novo.
  const agora = new Date();
  if (contrato.reservas.some((r) => r.status === "reservado" && r.expiraEm && r.expiraEm < agora)) {
    const segurou = await reservarHorarios(
      contrato.id,
      horariosDasReservas(contrato.reservas),
      new Date(agora.getTime() + MINUTOS_RESERVA_ANTES_ASSINAR * 60 * 1000)
    );
    if (!segurou.ok) {
      return { erro: "O tempo da reserva acabou e um dos horários foi ocupado. Comece de novo para escolher outros horários.", recomecar: true };
    }
  }

  const { userAgent } = await cabecalhos();
  const assinadoEm = new Date();

  let assinado;
  try {
    assinado = await registrarAssinatura({
      contrato,
      assinaturaContratantePng: imagem,
      assinaturaContratadaPng: assinaturaContratada,
      ip,
      userAgent,
      assinadoEm,
    });
  } catch (err) {
    console.error("[contrato] Falha ao assinar e gerar o PDF:", err);
    return { erro: "Não foi possível finalizar a assinatura agora. Tente de novo em instantes." };
  }

  await prorrogarReservas(assinado.id, new Date(Date.now() + HORAS_RESERVA_APOS_ASSINAR * 60 * 60 * 1000));
  await sendContratoAssinadoAvisoEmail(infoEmailDoContrato(assinado)).catch((err) =>
    console.error("[contrato] Falha ao avisar a contratada do novo contrato:", err)
  );

  // O contratante recebe o link do contrato por e-mail: se fechar a página de pagamento antes
  // de pagar, volta por ele (a página do contrato refaz a cobrança se preciso).
  await sendContratoAguardandoPagamentoEmail(assinado.email, infoEmailDoContrato(assinado), urlDoContrato(assinado.token)).catch((err) =>
    console.error("[contrato] Falha ao enviar o link do contrato ao contratante:", err)
  );

  const pagamentoUrl = await criarPagamentoDoContrato(assinado);
  return { pagamentoUrl };
}

export type GerarPagamentoResultado = { erro: string } | { pago: true } | { pagamentoUrl: string };

/** Link de pagamento de um contrato já assinado; recria a cobrança se a anterior venceu. */
export async function gerarPagamento(token: string): Promise<GerarPagamentoResultado> {
  const ip = await getClientIp();
  if (!(await checkRateLimit(`contrato-pagamento:${ip}`, 20, 60))) {
    return { erro: "Muitas tentativas. Aguarde alguns minutos." };
  }
  const contrato = await prisma.contratoBienal.findUnique({ where: { token } });
  if (!contrato || contrato.status === "rascunho") return { erro: "Contrato não encontrado." };
  if (contrato.status === "pago") return { pago: true };

  if (contrato.asaasPaymentId) {
    const cobranca = await buscarCobranca(contrato.asaasPaymentId);
    if (cobranca && STATUS_PAGO_ASAAS.has(cobranca.status)) {
      await marcarContratoPago(contrato.id, cobranca.netValueCentavos);
      return { pago: true };
    }
    if (cobranca && cobranca.status === "PENDING" && contrato.asaasInvoiceUrl) {
      return { pagamentoUrl: contrato.asaasInvoiceUrl };
    }
  }

  const url = contrato.asaasPaymentId ? await recriarPagamentoDoContrato(contrato) : await criarPagamentoDoContrato(contrato);
  if (!url) return { erro: "Não conseguimos gerar o pagamento agora. Tente de novo em instantes ou fale com a equipe." };
  return { pagamentoUrl: url };
}

/** Envia o contrato em PDF, só para o e-mail informado no próprio contrato. */
export async function enviarContratoPorEmail(token: string): Promise<{ erro?: string; enviadoPara?: string }> {
  if (!(await checkRateLimit(`contrato-envio:${token}`, 5, 60))) {
    return { erro: "Você já pediu o envio várias vezes. Aguarde um pouco e tente de novo." };
  }
  const contrato = await prisma.contratoBienal.findUnique({ where: { token }, include: { reservas: true } });
  if (!contrato || contrato.status !== "pago" || !contrato.pdf) return { erro: "O contrato ainda não está disponível para envio." };

  try {
    await sendContratoPagoEmail(contrato.email, infoEmailDoContrato(contrato), {
      pdf: Buffer.from(contrato.pdf),
      agenda: horariosDasReservas(contrato.reservas).map(rotuloHorario),
      paraContratada: false,
    });
  } catch (err) {
    console.error("[contrato] Falha ao enviar o contrato por e-mail:", err);
    return { erro: "Não conseguimos enviar o e-mail agora. Tente de novo em instantes." };
  }
  await prisma.contratoBienal.update({ where: { id: contrato.id }, data: { enviosEmail: { increment: 1 } } });
  const [usuario, dominio] = contrato.email.split("@");
  return { enviadoPara: `${usuario.slice(0, 2)}***@${dominio}` };
}
