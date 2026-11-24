import "server-only";
import { list, del } from "@vercel/blob";
import type { InscricaoPremio } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { buscarCobranca, cancelarCobranca, criarTransferenciaPix } from "@/lib/asaas";
import { sendInscricaoPremioEquipeEmail, sendInscricaoPremioParticipanteEmail } from "@/lib/email";
import { tamanhoArquivoPrivado, tokenArmazenamentoPrivado } from "@/lib/ebookStorage";
import { linkArquivoPremio } from "@/lib/premioLinks";
import {
  PREMIO_ARQUIVOS,
  PREMIO_ARQUIVOS_DIAS,
  PREMIO_EMAIL_COPIA,
  PREMIO_EMAIL_PADRAO,
  PREMIO_PIX_INSTITUTO,
  PREMIO_VALOR_CENTAVOS,
  arquivosDaForma,
  extensaoDoArquivo,
  prefixoPremio,
  type ArquivoPremio,
} from "@/lib/premio";

// Pagamento da taxa de inscrição do prêmio pela plataforma (cartão de crédito à vista, Asaas).
// Mesmo desenho do kit da Bienal: a inscrição é criada "aguardando", o webhook da Asaas a marca como
// paga (e só então a organização recebe o e-mail), e o cron repassa o valor LÍQUIDO ao Instituto por Pix
// quando o saldo fica disponível. Nada fica com a plataforma.

const DIAS_ABANDONADA = 3;

function tamanhoLegivel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function reais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function dataHoraBrasil(d: Date): string {
  return d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

/** Lê o JSON de nomes originais guardado na inscrição ({ capa: "x.pdf", ... }). */
function lerNomes(inscricao: Pick<InscricaoPremio, "nomesArquivos">): Partial<Record<ArquivoPremio, string>> {
  try {
    const bruto = JSON.parse(inscricao.nomesArquivos ?? "{}") as Record<string, unknown>;
    const nomes: Partial<Record<ArquivoPremio, string>> = {};
    for (const [k, v] of Object.entries(bruto)) if (k in PREMIO_ARQUIVOS && typeof v === "string") nomes[k as ArquivoPremio] = v;
    return nomes;
  } catch {
    return {};
  }
}

/**
 * Chamado a cada PAYMENT_CONFIRMED / PAYMENT_RECEIVED da cobrança de uma inscrição. O primeiro marca a
 * inscrição como paga e avisa a organização e a pessoa; o PAYMENT_RECEIVED (saldo disponível na Asaas, no
 * cartão semanas depois) só preenche disponivelEm, que libera o repasse.
 */
export async function registrarPagamentoPremio(
  inscricaoId: string,
  cobranca: { valueCentavos: number; netValueCentavos: number | null },
  evento: string
): Promise<void> {
  const liquido = cobranca.netValueCentavos;
  await prisma.inscricaoPremio.updateMany({
    where: { id: inscricaoId, pagoEm: null, pagamentoStatus: { in: ["aguardando", "cancelado"] } },
    data: {
      pagamentoStatus: "pago",
      pagoEm: new Date(),
      valorCentavos: cobranca.valueCentavos,
      valorLiquidoCentavos: liquido,
      repasseStatus: "pendente",
      repasseValorCentavos: liquido,
    },
  });

  if (evento === "PAYMENT_RECEIVED") {
    await prisma.inscricaoPremio.updateMany({
      where: { id: inscricaoId, pagamentoStatus: "pago", disponivelEm: null },
      data: { disponivelEm: new Date(), ...(liquido != null ? { valorLiquidoCentavos: liquido, repasseValorCentavos: liquido } : {}) },
    });
  }

  await garantirEmailsPremioPago(inscricaoId);
}

/**
 * Avisa a organização e a pessoa (uma única vez) de que a inscrição foi paga. Se o e-mail da equipe falhar,
 * libera a trava para a próxima confirmação da Asaas tentar de novo.
 */
export async function garantirEmailsPremioPago(inscricaoId: string): Promise<void> {
  const trava = await prisma.inscricaoPremio.updateMany({
    where: { id: inscricaoId, pagamentoStatus: "pago", emailPagoEnviadoEm: null },
    data: { emailPagoEnviadoEm: new Date() },
  });
  if (trava.count === 0) return;

  const insc = await prisma.inscricaoPremio.findUnique({ where: { id: inscricaoId } });
  if (!insc) return;

  const nomes = lerNomes(insc);
  const arquivos: Array<{ rotulo: string; nomeOriginal: string; tamanho: string; url: string }> = [];
  for (const tipo of arquivosDaForma("cartao")) {
    const nome = nomes[tipo] ?? "";
    const ext = extensaoDoArquivo(nome);
    if (!ext) continue;
    const caminho = `${prefixoPremio(insc.pasta)}${tipo}.${ext}`;
    const bytes = await tamanhoArquivoPrivado(caminho).catch(() => null);
    arquivos.push({
      rotulo: PREMIO_ARQUIVOS[tipo].rotulo,
      nomeOriginal: nome.slice(0, 200),
      tamanho: bytes != null ? tamanhoLegivel(bytes) : "arquivo não encontrado",
      url: linkArquivoPremio(caminho),
    });
  }

  try {
    await sendInscricaoPremioEquipeEmail({
      destino: process.env.PREMIO_EMAIL_DESTINO || PREMIO_EMAIL_PADRAO,
      copia: process.env.PREMIO_EMAIL_COPIA || PREMIO_EMAIL_COPIA,
      nome: insc.nome,
      nomeArtistico: insc.nomeArtistico,
      telefone: insc.telefone,
      email: insc.email,
      titulo: insc.titulo,
      categoria: insc.categoria,
      arquivos,
      pagamento: { forma: "cartao", valor: reais(insc.valorCentavos ?? PREMIO_VALOR_CENTAVOS), confirmadoEm: dataHoraBrasil(insc.pagoEm ?? new Date()) },
    });
  } catch (err) {
    console.error(`[premio] Falha ao avisar a equipe da inscrição paga ${inscricaoId}:`, err);
    await prisma.inscricaoPremio.update({ where: { id: inscricaoId }, data: { emailPagoEnviadoEm: null } });
    return;
  }
  await sendInscricaoPremioParticipanteEmail(insc.email, {
    nome: insc.nome,
    titulo: insc.titulo,
    categoria: insc.categoria,
    pagamentoConfirmado: true,
  }).catch((err) => console.error(`[premio] Falha ao enviar a confirmação de pagamento à inscrição ${inscricaoId}:`, err));
}

/** Chave Pix do Instituto: a do regulamento, ou a das variáveis de ambiente (ver PREMIO_PIX_INSTITUTO). */
function chavePixInstituto(): { chave: string; tipo: string } {
  return { chave: process.env.PREMIO_PIX_CHAVE || PREMIO_PIX_INSTITUTO.chave, tipo: process.env.PREMIO_PIX_TIPO || PREMIO_PIX_INSTITUTO.tipo };
}

/**
 * Repassa ao Instituto, por Pix, o valor LÍQUIDO (já sem a tarifa da Asaas) de uma inscrição paga. Só sai
 * depois de o saldo estar disponível na Asaas (cartão: cerca de 32 dias). Antes de transferir, "reserva" a
 * inscrição (status "processando"), para duas execuções do cron ao mesmo tempo nunca pagarem duas vezes;
 * se a transferência falhar, volta para "erro" e o próximo cron tenta de novo.
 */
export async function processarRepasseInstituto(insc: InscricaoPremio): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (insc.pagamentoStatus !== "pago" || insc.repasseStatus === "transferido" || insc.repasseStatus === "cancelado") return { ok: true };
  if (!insc.disponivelEm) return { ok: false, erro: "Pagamento ainda não está disponível para movimentação na Asaas." };

  const liquido = insc.repasseValorCentavos ?? insc.valorLiquidoCentavos;
  if (!liquido || liquido <= 0) {
    const erro = "Valor líquido do pagamento ainda não conhecido.";
    await prisma.inscricaoPremio.update({ where: { id: insc.id }, data: { repasseStatus: "erro", repasseErro: erro } });
    return { ok: false, erro };
  }

  const reserva = await prisma.inscricaoPremio.updateMany({
    where: { id: insc.id, repasseStatus: { in: ["pendente", "erro"] } },
    data: { repasseStatus: "processando" },
  });
  if (reserva.count === 0) return { ok: false, erro: "Repasse já está em andamento." };

  // Teto de segurança: nunca repassa mais que a taxa cobrada.
  const valor = Math.min(liquido, insc.valorCentavos ?? PREMIO_VALOR_CENTAVOS);
  const { chave, tipo } = chavePixInstituto();
  const transferencia = await criarTransferenciaPix({
    valueCentavos: valor,
    pixKey: chave,
    pixKeyType: tipo,
    description: `Repasse inscricao premio literario - ${insc.id.slice(-6)}`,
    externalReference: `premio-${insc.id}`,
  });

  if (!transferencia) {
    const erro = "Falha ao criar transferência na Asaas.";
    await prisma.inscricaoPremio.update({ where: { id: insc.id }, data: { repasseStatus: "erro", repasseErro: erro } });
    return { ok: false, erro };
  }

  await prisma.inscricaoPremio.update({
    where: { id: insc.id },
    data: { repasseStatus: "transferido", repasseAsaasTransferId: transferencia.id, repasseValorCentavos: valor, repasseEm: new Date(), repasseErro: null },
  });
  return { ok: true };
}

/** Repasses prontos para sair (pagos, com saldo disponível). Chamado pelo cron diário. */
export async function repassarInscricoesPremioDisponiveis(): Promise<{ processados: number; liberados: number }> {
  const pendentes = await prisma.inscricaoPremio.findMany({
    where: { pagamentoStatus: "pago", repasseStatus: { in: ["pendente", "erro"] }, disponivelEm: { not: null } },
  });
  let liberados = 0;
  for (const insc of pendentes) {
    const r = await processarRepasseInstituto(insc);
    if (r.ok) liberados++;
  }
  return { processados: pendentes.length, liberados };
}

/** Pagamento estornado ou contestado: a inscrição deixa de constar como paga; a equipe acerta o resto. */
export async function marcarInscricaoPremioEstornada(inscricaoId: string, evento: string): Promise<void> {
  await prisma.inscricaoPremio.update({ where: { id: inscricaoId }, data: { pagamentoStatus: "estornado" } });
  // Repasse que ainda não saiu é cancelado; o que já saiu não volta sozinho e fica com aviso para o admin.
  await prisma.inscricaoPremio.updateMany({ where: { id: inscricaoId, repasseStatus: { in: ["pendente", "erro", "processando"] } }, data: { repasseStatus: "cancelado" } });
  await prisma.inscricaoPremio.updateMany({
    where: { id: inscricaoId, repasseStatus: "transferido" },
    data: { repasseErro: `Pagamento estornado/contestado depois do repasse (${evento}). Conferir e cobrar do Instituto.` },
  });
  console.error(`[premio] Inscrição ${inscricaoId} ${evento}: marcada como estornada. Conferir com a pessoa e com o Instituto.`);
}

/**
 * Inscrições pelo cartão que ficaram "aguardando" por dias (a pessoa desistiu na página de pagamento):
 * cancela a cobrança de verdade na Asaas e marca como cancelada, mas só se a Asaas confirmar que ainda não
 * foi paga (se por acaso já foi, não mexe, para não perder um pagamento real).
 */
export async function cancelarInscricoesPremioAbandonadas(): Promise<number> {
  const limite = new Date(Date.now() - DIAS_ABANDONADA * 24 * 60 * 60 * 1000);
  const abandonadas = await prisma.inscricaoPremio.findMany({
    where: { formaPagamento: "cartao", pagamentoStatus: "aguardando", createdAt: { lt: limite } },
  });
  let canceladas = 0;
  for (const insc of abandonadas) {
    if (insc.asaasPaymentId) {
      const cobranca = await buscarCobranca(insc.asaasPaymentId);
      if (!cobranca) continue;
      if (cobranca.status === "RECEIVED" || cobranca.status === "CONFIRMED") continue;
      if (!(await cancelarCobranca(insc.asaasPaymentId))) continue;
    }
    await prisma.inscricaoPremio.updateMany({ where: { id: insc.id, pagamentoStatus: "aguardando" }, data: { pagamentoStatus: "cancelado" } });
    canceladas++;
  }
  return canceladas;
}

/**
 * Regra de validade dos arquivos de uma pasta (função pura, testável): `inscricao` é a inscrição dona da pasta (ou
 * null se não houver) e `enviadoEm` as datas de envio dos arquivos dela.
 */
export function pastaDoPremioVencida(
  inscricao: { formaPagamento: string; pagamentoStatus: string; createdAt: Date; pagoEm: Date | null } | null,
  enviadoEm: Date[],
  agora: Date = new Date()
): boolean {
  const dia = 24 * 60 * 60 * 1000;
  const limite = new Date(agora.getTime() - PREMIO_ARQUIVOS_DIAS * dia);
  if (!inscricao) return enviadoEm.every((d) => d < limite);
  if (inscricao.formaPagamento === "cartao" && inscricao.pagamentoStatus === "aguardando") return inscricao.createdAt < new Date(agora.getTime() - 14 * dia);
  return (inscricao.pagoEm ?? inscricao.createdAt) < limite;
}

/**
 * Apaga os arquivos das inscrições do prêmio do armazenamento: PREMIO_ARQUIVOS_DIAS dias depois do envio (Pix
 * com comprovante) ou depois da CONFIRMAÇÃO do pagamento (cartão), para quem demora a pagar não ficar sem
 * arquivos no e-mail. Inscrição ainda aguardando pagamento só perde os arquivos depois de 14 dias; pastas
 * sem inscrição (envio abandonado) saem em 7 dias. Os dados da inscrição ficam no banco.
 */
export async function limparArquivosPremio(): Promise<number> {
  const token = tokenArmazenamentoPrivado();
  const arquivos: Array<{ pathname: string; uploadedAt: Date }> = [];
  let cursor: string | undefined;
  do {
    const pagina = await list({ prefix: "premio/", limit: 1000, cursor, token });
    arquivos.push(...pagina.blobs.map((b) => ({ pathname: b.pathname, uploadedAt: b.uploadedAt })));
    cursor = pagina.hasMore ? pagina.cursor : undefined;
  } while (cursor);
  if (arquivos.length === 0) return 0;

  const porPasta = new Map<string, Array<{ pathname: string; uploadedAt: Date }>>();
  for (const a of arquivos) {
    const pasta = a.pathname.split("/")[1] ?? "";
    porPasta.set(pasta, [...(porPasta.get(pasta) ?? []), a]);
  }
  const inscricoes = await prisma.inscricaoPremio.findMany({
    where: { pasta: { in: [...porPasta.keys()] } },
    select: { pasta: true, formaPagamento: true, pagamentoStatus: true, createdAt: true, pagoEm: true },
  });
  const porPastaInscricao = new Map(inscricoes.map((i) => [i.pasta, i]));

  const apagar: string[] = [];
  for (const [pasta, itens] of porPasta) {
    if (pastaDoPremioVencida(porPastaInscricao.get(pasta) ?? null, itens.map((a) => a.uploadedAt))) apagar.push(...itens.map((a) => a.pathname));
  }
  for (let i = 0; i < apagar.length; i += 100) await del(apagar.slice(i, i + 100), { token });
  return apagar.length;
}
