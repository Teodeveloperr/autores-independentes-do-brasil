"use server";

import bcrypt from "bcryptjs";
import QRCode from "qrcode";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAdminSession, deleteAdminSession, createAdminPending2FA, getAdminPending2FA, deleteAdminPending2FA } from "@/lib/session";
import { requireAdmin } from "@/lib/auth";
import { excluirAutorCompletamente } from "@/lib/authorDeletion";
import { listarCobrancasRecebidas, buscarCobranca } from "@/lib/asaas";
import { recalcularAvaliacaoAutor } from "@/lib/reviews";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { gerarSegredoTotp, gerarOtpauthUri, verificarCodigoTotp, gerarCodigosBackup } from "@/lib/totp";
import { criarLinkRedefinicaoSenha } from "@/lib/passwordReset";
import { sendAccountCreatedEmail } from "@/lib/email";
import { TODOS_PLANOS, planoAdminExpiraEm, type CicloConcessaoAdmin } from "@/lib/plans";
import { sanitizeExternalUrl } from "@/lib/format";
import { extrairYoutubeId } from "@/lib/youtube";
import { CHAT_NOME_ADMIN } from "@/lib/chat";
import { MESES_EVENTO } from "@/lib/painelOptions";
import { CATEGORIAS_AGENDA_ADMIN, CATEGORIAS_GALERIA_ADMIN, CATEGORIAS_OPORTUNIDADES, CATEGORIAS_BLOG } from "@/lib/adminOptions";
import { emailSchema, textoSchema, intSchema, primeiroErroZod } from "@/lib/validation";
import type { ChatMensagemRow } from "@/app/painel/actions";

export type AdminLoginState = { error?: string; precisa2fa?: boolean } | undefined;

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const senha = (formData.get("senha") as string) || "";
  if (!senha) {
    return { error: "Informe sua senha." };
  }

  const ip = await getClientIp();
  const permitido = await checkRateLimit(`admin-login:${ip}`, 5, 15);
  if (!permitido) {
    return { error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." };
  }

  const admin = await prisma.admin.findFirst({ orderBy: { createdAt: "asc" } });
  if (!admin) {
    return { error: "Nenhuma conta de administrador foi configurada ainda." };
  }

  const senhaOk = await bcrypt.compare(senha, admin.senhaHash);
  if (!senhaOk) {
    return { error: "Senha incorreta. Tente novamente." };
  }

  if (admin.totpEnabled) {
    await createAdminPending2FA(admin.id);
    return { precisa2fa: true };
  }

  await createAdminSession(admin.id);
  return undefined;
}

export type Verify2FAState = { error?: string } | undefined;

export async function verificarCodigo2FA(_prev: Verify2FAState, formData: FormData): Promise<Verify2FAState> {
  const codigo = ((formData.get("codigo") as string) || "").trim();
  if (!codigo) {
    return { error: "Digite o código de 6 dígitos ou um código de backup." };
  }

  const pending = await getAdminPending2FA();
  if (!pending) {
    return { error: "Sessão de login expirada. Volte e faça login novamente." };
  }

  const ip = await getClientIp();
  const permitido = await checkRateLimit(`admin-2fa:${ip}`, 8, 10);
  if (!permitido) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }

  const admin = await prisma.admin.findUnique({ where: { id: pending.pendingAdminId } });
  if (!admin || !admin.totpEnabled || !admin.totpSecret) {
    await deleteAdminPending2FA();
    return { error: "Sessão inválida. Faça login novamente." };
  }

  if (verificarCodigoTotp(admin.totpSecret, codigo)) {
    await deleteAdminPending2FA();
    await createAdminSession(admin.id);
    return undefined;
  }

  const codigoBackup = codigo.toUpperCase();
  for (const hash of admin.totpBackupCodes) {
    if (await bcrypt.compare(codigoBackup, hash)) {
      await prisma.admin.update({
        where: { id: admin.id },
        data: { totpBackupCodes: admin.totpBackupCodes.filter((h) => h !== hash) },
      });
      await deleteAdminPending2FA();
      await createAdminSession(admin.id);
      return undefined;
    }
  }

  return { error: "Código inválido. Tente novamente." };
}

export async function adminLogout() {
  await deleteAdminSession();
}

export async function iniciarConfiguracao2FA() {
  const admin = await requireAdmin();
  const secret = gerarSegredoTotp();
  const otpauthUri = gerarOtpauthUri(secret, admin.email);
  const qrDataUrl = await QRCode.toDataURL(otpauthUri);
  return { secret, qrDataUrl };
}

export type Confirmar2FAState = { error?: string; backupCodes?: string[] } | undefined;

export async function confirmarAtivacao2FA(_prev: Confirmar2FAState, formData: FormData): Promise<Confirmar2FAState> {
  const admin = await requireAdmin();
  const secret = (formData.get("secret") as string) || "";
  const codigo = ((formData.get("codigo") as string) || "").trim();

  if (!secret || !codigo) {
    return { error: "Preencha o código do aplicativo autenticador." };
  }
  if (!verificarCodigoTotp(secret, codigo)) {
    return { error: "Código incorreto. Confira o aplicativo e tente novamente." };
  }

  const backupCodes = gerarCodigosBackup();
  const backupCodesHash = await Promise.all(backupCodes.map((c) => bcrypt.hash(c, 10)));

  await prisma.admin.update({
    where: { id: admin.id },
    data: { totpSecret: secret, totpEnabled: true, totpBackupCodes: backupCodesHash },
  });

  revalidatePath("/admin");
  return { backupCodes };
}

export type Desativar2FAState = { error?: string; ok?: boolean } | undefined;

export async function desativar2FA(_prev: Desativar2FAState, formData: FormData): Promise<Desativar2FAState> {
  const admin = await requireAdmin();
  const senha = (formData.get("senha") as string) || "";

  const senhaOk = await bcrypt.compare(senha, admin.senhaHash);
  if (!senhaOk) {
    return { error: "Senha incorreta." };
  }

  await prisma.admin.update({
    where: { id: admin.id },
    data: { totpSecret: null, totpEnabled: false, totpBackupCodes: [] },
  });

  revalidatePath("/admin");
  return { ok: true };
}

const anoAtualAdmin = new Date().getFullYear();

const collectiveEventSchema = z.object({
  nome: textoSchema(150, false),
  dia: intSchema(1, 31),
  mes: z.enum(MESES_EVENTO),
  ano: intSchema(anoAtualAdmin, anoAtualAdmin + 5),
  categoria: z.enum(CATEGORIAS_AGENDA_ADMIN),
  local: textoSchema(200, false),
  periodo: textoSchema(60, false),
});

function collectiveEventDataFromForm(formData: FormData) {
  const parsed = collectiveEventSchema.safeParse({
    nome: ((formData.get("nome") as string) || "Evento").trim(),
    dia: (formData.get("dia") as string) || "1",
    mes: (formData.get("mes") as string) || "JAN",
    ano: (formData.get("ano") as string) || String(anoAtualAdmin),
    categoria: (formData.get("categoria") as string) || CATEGORIAS_AGENDA_ADMIN[0],
    local: ((formData.get("local") as string) || "—").trim(),
    periodo: (formData.get("periodo") as string) || "",
  });
  if (!parsed.success) {
    throw new Error(primeiroErroZod(parsed.error));
  }

  return {
    nome: parsed.data.nome || "Evento",
    dia: parsed.data.dia,
    mes: parsed.data.mes,
    ano: parsed.data.ano,
    categoria: parsed.data.categoria,
    local: parsed.data.local || "—",
    periodo: parsed.data.periodo || null,
  };
}

export async function addCollectiveEvent(formData: FormData) {
  await requireAdmin();

  await prisma.collectiveEvent.create({ data: collectiveEventDataFromForm(formData) });

  revalidatePath("/admin");
  revalidatePath("/eventos");
  revalidatePath("/");
}

export async function updateCollectiveEvent(id: string, formData: FormData) {
  await requireAdmin();

  await prisma.collectiveEvent.update({ where: { id }, data: collectiveEventDataFromForm(formData) });

  revalidatePath("/admin");
  revalidatePath("/eventos");
  revalidatePath("/");
}

export async function removeCollectiveEvent(id: string) {
  await requireAdmin();
  await prisma.collectiveEvent.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/eventos");
  revalidatePath("/");
}

const opportunitySchema = z.object({
  nome: textoSchema(150),
  categoria: z.enum(CATEGORIAS_OPORTUNIDADES),
  estado: textoSchema(60, false),
  valor: textoSchema(60, false),
});

function opportunityDataFromForm(formData: FormData) {
  const link = sanitizeExternalUrl((formData.get("link") as string) || "");
  if (!link) {
    throw new Error("Informe um link válido para a oportunidade.");
  }
  const prazoFinal = new Date(`${(formData.get("prazoFinal") as string) || ""}T00:00:00`);
  if (Number.isNaN(prazoFinal.getTime())) {
    throw new Error("Informe um prazo final válido.");
  }

  const parsed = opportunitySchema.safeParse({
    nome: (formData.get("nome") as string) || "",
    categoria: (formData.get("categoria") as string) || CATEGORIAS_OPORTUNIDADES[0],
    estado: (formData.get("estado") as string) || "",
    valor: (formData.get("valor") as string) || "",
  });
  if (!parsed.success) {
    throw new Error(primeiroErroZod(parsed.error));
  }

  return {
    nome: parsed.data.nome,
    categoria: parsed.data.categoria,
    prazoFinal,
    estado: parsed.data.estado,
    valor: parsed.data.valor || null,
    link,
  };
}

export async function addOpportunity(formData: FormData) {
  await requireAdmin();
  await prisma.opportunity.create({ data: opportunityDataFromForm(formData) });
  revalidatePath("/admin");
  revalidatePath("/oportunidades");
}

export async function updateOpportunity(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.opportunity.update({ where: { id }, data: opportunityDataFromForm(formData) });
  revalidatePath("/admin");
  revalidatePath("/oportunidades");
}

export async function removeOpportunity(id: string) {
  await requireAdmin();
  await prisma.opportunity.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/oportunidades");
}

const galeriaAdminSchema = z.object({
  titulo: textoSchema(120, false),
  categoria: z.enum(CATEGORIAS_GALERIA_ADMIN),
});

export async function addCollectiveGalleryPhoto(formData: FormData) {
  await requireAdmin();
  const url = (formData.get("url") as string) || "";
  if (!url) return;

  const parsed = galeriaAdminSchema.safeParse({
    titulo: (formData.get("titulo") as string) || "Foto",
    categoria: (formData.get("categoria") as string) || CATEGORIAS_GALERIA_ADMIN[0],
  });
  if (!parsed.success) {
    throw new Error(primeiroErroZod(parsed.error));
  }

  await prisma.collectiveGalleryPhoto.create({
    data: {
      titulo: parsed.data.titulo || "Foto",
      categoria: parsed.data.categoria,
      url,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/galeria");
}

export async function removeCollectiveGalleryPhoto(id: string) {
  await requireAdmin();
  await prisma.collectiveGalleryPhoto.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/galeria");
}

export type CreateAuthorState = { error?: string; success?: boolean } | undefined;

export async function adminCreateAuthor(_prev: CreateAuthorState, formData: FormData): Promise<CreateAuthorState> {
  await requireAdmin();

  const nome = ((formData.get("nome") as string) || "").trim().slice(0, 120);
  const plano = (formData.get("plano") as string) || "Iniciante";
  const ciclo = (formData.get("ciclo") as string) || undefined;

  if (!nome) {
    return { error: "Preencha o nome." };
  }
  const emailParsed = emailSchema.safeParse((formData.get("email") as string) || "");
  if (!emailParsed.success) {
    return { error: "Informe um e-mail válido." };
  }
  const email = emailParsed.data;

  if (!TODOS_PLANOS.includes(plano)) {
    return { error: "Selecione um plano válido." };
  }
  // Plano pago concedido direto na criação (sem cobrança real) também tem prazo — mesma
  // regra da troca manual de plano de um autor já existente.
  if (plano !== "Iniciante" && ciclo !== "semestral" && ciclo !== "anual") {
    return { error: "Selecione o ciclo (semestral ou anual) do plano." };
  }

  const existente = await prisma.author.findUnique({ where: { email } });
  if (existente) {
    return { error: "Já existe uma conta cadastrada com esse e-mail." };
  }

  const author = await prisma.author.create({
    data: {
      nome,
      email,
      plano,
      planoConcedidoAdminCiclo: plano !== "Iniciante" ? ciclo : null,
      planoConcedidoAdminAte: plano !== "Iniciante" ? planoAdminExpiraEm(ciclo as CicloConcessaoAdmin) : null,
      anoEntrada: new Date().getFullYear(),
      bio: "Autor(a) independente do coletivo Autores Independentes do Brasil.",
    },
  });

  const setupUrl = await criarLinkRedefinicaoSenha(author.id);
  try {
    await sendAccountCreatedEmail(author.email, author.nome, plano, setupUrl);
  } catch (err) {
    console.error("[admin] Falha ao enviar e-mail de criação de conta:", err);
  }

  revalidatePath("/admin");
  revalidatePath("/autores");
  return { success: true };
}

export async function removeAuthor(id: string) {
  await requireAdmin();
  await excluirAutorCompletamente(id);

  revalidatePath("/admin");
  revalidatePath("/autores");
  revalidatePath("/livros");
  revalidatePath("/");
}

async function setAuthorStatus(id: string, status: "ativo" | "suspenso") {
  await requireAdmin();
  await prisma.author.update({ where: { id }, data: { status } });
  revalidatePath("/admin");
  revalidatePath("/autores");
  revalidatePath("/livros");
  revalidatePath(`/perfil/${id}`);
  revalidatePath("/");
}

export async function suspendAuthor(id: string) {
  await setAuthorStatus(id, "suspenso");
}

export async function reactivateAuthor(id: string) {
  await setAuthorStatus(id, "ativo");
}

export async function alterarPlanoAutor(id: string, plano: string, ciclo?: string): Promise<{ error?: string }> {
  await requireAdmin();

  if (!TODOS_PLANOS.includes(plano)) {
    return { error: "Plano inválido." };
  }

  // Concessão manual pelo admin (sem cobrança real por trás) tem prazo — expira sozinha
  // via cron e volta pro Iniciante, a menos que o admin renove antes.
  if (plano === "Iniciante") {
    await prisma.author.update({
      where: { id },
      data: { plano, planoConcedidoAdminCiclo: null, planoConcedidoAdminAte: null },
    });
  } else {
    if (ciclo !== "semestral" && ciclo !== "anual") {
      return { error: "Selecione o ciclo (semestral ou anual) da concessão." };
    }
    await prisma.author.update({
      where: { id },
      data: {
        plano,
        planoConcedidoAdminCiclo: ciclo,
        planoConcedidoAdminAte: planoAdminExpiraEm(ciclo as CicloConcessaoAdmin),
      },
    });
  }
  revalidatePath("/admin");
  revalidatePath("/autores");
  revalidatePath("/livros");
  revalidatePath(`/perfil/${id}`);
  revalidatePath("/");
  return {};
}

export async function removeReview(id: string) {
  await requireAdmin();

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return;

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id } });
    await recalcularAvaliacaoAutor(tx, review.authorId);
  });

  revalidatePath("/admin");
  revalidatePath(`/perfil/${review.authorId}`);
}

const articleSchema = z.object({
  titulo: textoSchema(200, false),
  resumo: textoSchema(1000, false),
  conteudo: textoSchema(50000, false),
  categoria: z.enum(CATEGORIAS_BLOG),
  autorNome: textoSchema(120, false),
});

type ArticleData = { titulo: string; resumo: string; conteudo: string; categoria: string; autorNome: string; capaUrl: string | null };

// Erros lançados com throw numa Server Action ficam sem mensagem em produção e derrubam a
// tela inteira se o cliente não capturar — por isso essa função sempre retorna { error }
// em vez de lançar, e addArticle/updateArticle repassam isso pro formulário tratar.
function articleDataFromForm(formData: FormData): { error: string } | { data: ArticleData } {
  const parsed = articleSchema.safeParse({
    titulo: (formData.get("titulo") as string) || "Artigo",
    resumo: (formData.get("resumo") as string) || "",
    conteudo: (formData.get("conteudo") as string) || "",
    categoria: (formData.get("categoria") as string) || CATEGORIAS_BLOG[2],
    autorNome: (formData.get("autorNome") as string) || "Coletivo",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }

  return {
    data: {
      titulo: parsed.data.titulo || "Artigo",
      resumo: parsed.data.resumo,
      conteudo: parsed.data.conteudo,
      categoria: parsed.data.categoria,
      autorNome: parsed.data.autorNome || "Coletivo",
      capaUrl: (formData.get("capaUrl") as string) || null,
    },
  };
}

export async function addArticle(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = articleDataFromForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.article.create({ data: parsed.data });
  revalidatePath("/admin");
  revalidatePath("/blog");
  return {};
}

export async function updateArticle(id: string, formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = articleDataFromForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.article.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin");
  revalidatePath("/blog");
  return {};
}

export async function removeArticle(id: string) {
  await requireAdmin();
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/blog");
}

function talkShowDataFromForm(formData: FormData): { error: string } | { data: { titulo: string; descricao: string | null; youtubeUrl: string } } {
  const titulo = ((formData.get("titulo") as string) || "").trim().slice(0, 200);
  const descricao = ((formData.get("descricao") as string) || "").trim().slice(0, 1000) || null;
  const youtubeUrl = ((formData.get("youtubeUrl") as string) || "").trim();

  if (!titulo || !youtubeUrl) {
    return { error: "Preencha o título e o link do YouTube." };
  }
  if (!extrairYoutubeId(youtubeUrl)) {
    return { error: "Link do YouTube inválido. Use um link como https://www.youtube.com/watch?v=... ou https://youtu.be/..." };
  }
  return { data: { titulo, descricao, youtubeUrl } };
}

export async function addTalkShowVideo(formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = talkShowDataFromForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.talkShowVideo.create({ data: parsed.data });
  revalidatePath("/admin");
  revalidatePath("/talk-show");
  return {};
}

export async function updateTalkShowVideo(id: string, formData: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const parsed = talkShowDataFromForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.talkShowVideo.update({ where: { id }, data: parsed.data });
  revalidatePath("/admin");
  revalidatePath("/talk-show");
  return {};
}

export async function removeTalkShowVideo(id: string) {
  await requireAdmin();
  await prisma.talkShowVideo.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/talk-show");
}

export type CobrancaFaltante = {
  id: string;
  valorCentavos: number;
  invoiceUrl: string;
  status: string;
  paymentDate: string | null;
  tipo: "assinatura" | "venda";
};

/**
 * Compara as cobranças recebidas/confirmadas na Asaas num mês com o que já está gravado
 * no nosso banco (SubscriptionPayment/Order) — só pra conferência manual, não altera nada.
 */
export async function reconciliarReceita(mesChave: string): Promise<{ faltantes: CobrancaFaltante[]; totalConferido: number }> {
  await requireAdmin();

  if (!/^\d{4}-\d{2}$/.test(mesChave)) {
    throw new Error("Mês inválido — use o formato AAAA-MM.");
  }

  const [ano, mes] = mesChave.split("-").map(Number);
  const desde = new Date(ano, mes - 1, 1);
  const ate = new Date(ano, mes, 0, 23, 59, 59);

  const cobrancas = await listarCobrancasRecebidas({
    desde: desde.toISOString().slice(0, 10),
    ate: ate.toISOString().slice(0, 10),
  });

  const [pagamentosAssinatura, pedidos] = await Promise.all([
    prisma.subscriptionPayment.findMany({ where: { createdAt: { gte: desde, lte: ate } }, select: { asaasPaymentId: true } }),
    prisma.order.findMany({ where: { createdAt: { gte: desde, lte: ate }, asaasPaymentId: { not: null } }, select: { asaasPaymentId: true } }),
  ]);
  const idsConhecidos = new Set([
    ...pagamentosAssinatura.map((r) => r.asaasPaymentId),
    ...pedidos.map((r) => r.asaasPaymentId as string),
  ]);

  // Cobrança sem "subscription" não é necessariamente venda de livro — Pix Automático não
  // usa esse campo, é identificado pelo customer. Busca os customers de assinatura via Pix
  // conhecidos (autor ou cadastro pendente) pra classificar certo.
  const customersPixConhecidos = new Set([
    ...(await prisma.author.findMany({ where: { asaasPixCustomerId: { not: null } }, select: { asaasPixCustomerId: true } })).map((a) => a.asaasPixCustomerId),
    ...(await prisma.pendingSignup.findMany({ where: { asaasPixCustomerId: { not: null } }, select: { asaasPixCustomerId: true } })).map((p) => p.asaasPixCustomerId),
  ]);

  const faltantes: CobrancaFaltante[] = cobrancas
    .filter((c) => !idsConhecidos.has(c.id))
    .map((c) => ({
      id: c.id,
      valorCentavos: c.valueCentavos,
      invoiceUrl: c.invoiceUrl,
      status: c.status,
      paymentDate: c.paymentDate,
      tipo: c.subscription || customersPixConhecidos.has(c.customer) ? "assinatura" : "venda",
    }));

  return { faltantes, totalConferido: cobrancas.length };
}

/**
 * Busca na Asaas o valor líquido (já descontada a tarifa) e a disponibilidade (se o saldo
 * já está liberado pra movimentação — status RECEIVED) dos pagamentos de assinatura e
 * pedidos de livro que ainda não têm essa informação gravada — cobre registros de antes
 * dessas informações passarem a ser gravadas pelo próprio webhook.
 */
export async function atualizarValoresLiquidos(): Promise<{ atualizados: number; falhas: number }> {
  await requireAdmin();

  let atualizados = 0;
  let falhas = 0;

  const assinaturasPendentes = await prisma.subscriptionPayment.findMany({
    where: { OR: [{ valorLiquidoCentavos: null }, { disponivelEm: null }] },
    select: { id: true, asaasPaymentId: true },
  });
  for (const pagamento of assinaturasPendentes) {
    const cobranca = await buscarCobranca(pagamento.asaasPaymentId);
    if (!cobranca) {
      falhas++;
      continue;
    }
    await prisma.subscriptionPayment.update({
      where: { id: pagamento.id },
      data: {
        valorLiquidoCentavos: cobranca.netValueCentavos,
        disponivelEm: cobranca.status === "RECEIVED" ? new Date() : null,
      },
    });
    atualizados++;
  }

  const pedidosPendentes = await prisma.order.findMany({
    where: {
      status: { notIn: ["Aguardando pagamento", "Cancelado"] },
      asaasPaymentId: { not: null },
      OR: [{ valorLiquidoCentavos: null }, { disponivelEm: null }],
    },
    select: { id: true, asaasPaymentId: true, valorCentavos: true, freteCentavos: true },
  });
  const pedidosPorCobranca = new Map<string, typeof pedidosPendentes>();
  for (const pedido of pedidosPendentes) {
    if (!pedido.asaasPaymentId) continue;
    const lista = pedidosPorCobranca.get(pedido.asaasPaymentId) ?? [];
    lista.push(pedido);
    pedidosPorCobranca.set(pedido.asaasPaymentId, lista);
  }
  for (const [asaasPaymentId, linhas] of pedidosPorCobranca) {
    const cobranca = await buscarCobranca(asaasPaymentId);
    if (!cobranca) {
      falhas += linhas.length;
      continue;
    }
    const totalBrutoCobranca = linhas.reduce((sum, r) => sum + r.valorCentavos + (r.freteCentavos ?? 0), 0);
    const proporcaoLiquida =
      totalBrutoCobranca > 0 && cobranca.netValueCentavos != null ? cobranca.netValueCentavos / totalBrutoCobranca : null;
    for (const linha of linhas) {
      await prisma.order.update({
        where: { id: linha.id },
        data: {
          valorLiquidoCentavos:
            proporcaoLiquida != null ? Math.round((linha.valorCentavos + (linha.freteCentavos ?? 0)) * proporcaoLiquida) : null,
          disponivelEm: cobranca.status === "RECEIVED" ? new Date() : null,
        },
      });
      atualizados++;
    }
  }

  revalidatePath("/admin");
  return { atualizados, falhas };
}

// Chat da Comunidade (autores) visto e usado pelo admin — mesma sala única. O admin não
// tem conta de Author, então as mensagens dele ficam com authorId nulo e deAdmin=true.
export async function listarMensagensChatAdmin(): Promise<ChatMensagemRow[]> {
  await requireAdmin();

  const mensagens = await prisma.chatMensagem.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { author: { select: { nome: true, fotoUrl: true } } },
  });

  return mensagens.reverse().map((m) => ({
    id: m.id,
    texto: m.texto,
    createdAt: m.createdAt,
    authorId: m.authorId,
    authorNome: m.deAdmin ? CHAT_NOME_ADMIN : (m.author?.nome ?? "Autor removido"),
    authorFotoUrl: m.deAdmin ? null : (m.author?.fotoUrl ?? null),
    deAdmin: m.deAdmin,
  }));
}

export async function enviarMensagemChatAdmin(texto: string): Promise<{ error?: string }> {
  await requireAdmin();

  const parsed = textoSchema(1000).safeParse(texto);
  if (!parsed.success) {
    return { error: "Escreva algo antes de enviar." };
  }

  await prisma.chatMensagem.create({ data: { texto: parsed.data, deAdmin: true } });
  return {};
}

export async function removerMensagemChat(id: string) {
  await requireAdmin();
  await prisma.chatMensagem.delete({ where: { id } });
}
