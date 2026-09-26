"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  type RegistrationResponseJSON,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { requireAuthor } from "@/lib/auth";
import { deleteAuthorSession } from "@/lib/session";
import { centavosFromInput, sanitizeExternalUrl } from "@/lib/format";
import { podeUsarRecursosExtras, BIO_MAX_CARACTERES_INICIANTE, PORTFOLIO_EVENTOS_MAX_INICIANTE } from "@/lib/plans";
import { GENEROS } from "@/lib/genres";
import { MESES_EVENTO, STATUS_EVENTO, STATUS_PEDIDO, CATEGORIAS_FOTO } from "@/lib/painelOptions";
import { senhaNovaSchema, textoSchema, intSchema, primeiroErroZod } from "@/lib/validation";
import { TIPOS_CHAVE_PIX, chavePixValida } from "@/lib/pixKey";
import { enviarConfirmacaoRecebimento } from "@/lib/repasse";
import { checkRateLimit } from "@/lib/rateLimit";
import { CHAT_NOME_ADMIN } from "@/lib/chat";
import { desconectarMercadoPago as desconectarMercadoPagoLib } from "@/lib/mercadoPagoMarketplace";
import { excluirAutorCompletamente } from "@/lib/authorDeletion";
import { cancelarAssinaturaAtiva } from "@/app/assinatura/actions";
import {
  RP_NAME,
  getRpID,
  getExpectedOrigin,
  WEBAUTHN_CHALLENGE_COOKIE,
  WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS,
} from "@/lib/webauthn";

const GENERO_ENUM = GENEROS as [string, ...string[]];

export async function logout() {
  await deleteAuthorSession();
  redirect("/login");
}

export async function marcarAgradecimentoGrupoVisto() {
  const author = await requireAuthor();
  await prisma.author.update({ where: { id: author.id }, data: { agradecimentoGrupoWhatsappVisto: true } });
  revalidatePath("/painel");
}

export type ChatMensagemRow = {
  id: string;
  texto: string;
  createdAt: Date;
  authorId: string | null;
  authorNome: string;
  authorFotoUrl: string | null;
  deAdmin: boolean;
};

const CHAT_MENSAGEM_MAX_CARACTERES = 1000;
const CHAT_MENSAGENS_POR_PAGINA = 100;

// Chat de sala única — todo autor lê e escreve na mesma conversa. Sem tempo real de
// verdade: o cliente busca as últimas mensagens de novo a cada poucos segundos (polling).
export async function listarMensagensChat(): Promise<ChatMensagemRow[]> {
  await requireAuthor();

  const mensagens = await prisma.chatMensagem.findMany({
    orderBy: { createdAt: "desc" },
    take: CHAT_MENSAGENS_POR_PAGINA,
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

export async function enviarMensagemChat(texto: string): Promise<{ error?: string }> {
  const author = await requireAuthor();

  const parsed = textoSchema(CHAT_MENSAGEM_MAX_CARACTERES).safeParse(texto);
  if (!parsed.success) {
    return { error: "Escreva algo antes de enviar." };
  }

  const permitido = await checkRateLimit(`chat-comunidade:${author.id}`, 20, 1);
  if (!permitido) {
    return { error: "Você está enviando mensagens rápido demais. Aguarde um pouco." };
  }

  await prisma.chatMensagem.create({ data: { authorId: author.id, texto: parsed.data } });
  return {};
}

function clampInt(value: string, min: number, max: number, fallback: number): number {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function saveProfile(formData: FormData): Promise<{ error?: string }> {
  const author = await requireAuthor();

  const generos = formData.getAll("generos") as string[];
  if (generos.length > 0) {
    const generosParsed = z.array(z.enum(GENERO_ENUM)).safeParse(generos);
    if (!generosParsed.success) {
      return { error: "Selecione apenas gêneros literários válidos." };
    }
  }
  const bio = ((formData.get("bio") as string) || "").trim().slice(0, author.plano === "Iniciante" ? BIO_MAX_CARACTERES_INICIANTE : undefined);

  await prisma.author.update({
    where: { id: author.id },
    data: {
      nome: ((formData.get("nome") as string) || author.nome).trim().slice(0, 120),
      generos: generos.length > 0 ? generos : author.generos,
      cidade: ((formData.get("cidade") as string) || "").trim().slice(0, 120),
      bio,
      fraseApresentacao: ((formData.get("fraseApresentacao") as string) || "").trim().slice(0, 140) || null,
      profissoes: ((formData.get("profissoes") as string) || "").trim().slice(0, 120) || null,
      fotoUrl: (formData.get("fotoUrl") as string) || author.fotoUrl,
      bannerUrl: (formData.get("bannerUrl") as string) || author.bannerUrl,
      bannerPositionX: clampInt((formData.get("bannerPositionX") as string) || "", 0, 100, 50),
      bannerPositionY: clampInt((formData.get("bannerPositionY") as string) || "", 0, 100, 50),
      videoUrl: sanitizeExternalUrl((formData.get("videoUrl") as string) || ""),
      instagramUrl: sanitizeExternalUrl((formData.get("instagramUrl") as string) || ""),
      twitterUrl: sanitizeExternalUrl((formData.get("twitterUrl") as string) || ""),
      siteUrl: sanitizeExternalUrl((formData.get("siteUrl") as string) || ""),
    },
  });

  revalidatePath("/painel");
  return {};
}

const portfolioSchema = z.object({
  portfolioFormacao: textoSchema(1000, false),
  portfolioPremios: textoSchema(1000, false),
  portfolioCitacao: textoSchema(1000, false),
});

export async function updatePortfolio(formData: FormData): Promise<{ error?: string }> {
  const author = await requireAuthor();

  const obraDestaqueId = ((formData.get("portfolioObraDestaqueId") as string) || "").trim();
  if (obraDestaqueId) {
    const obra = await prisma.book.findFirst({ where: { id: obraDestaqueId, authorId: author.id } });
    if (!obra) return { error: "Obra em destaque inválida." };
  }

  const parsed = portfolioSchema.safeParse({
    portfolioFormacao: (formData.get("portfolioFormacao") as string) || "",
    portfolioPremios: (formData.get("portfolioPremios") as string) || "",
    portfolioCitacao: (formData.get("portfolioCitacao") as string) || "",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }

  await prisma.author.update({
    where: { id: author.id },
    data: {
      portfolioFormacao: parsed.data.portfolioFormacao || null,
      portfolioPremios: parsed.data.portfolioPremios || null,
      portfolioCitacao: parsed.data.portfolioCitacao || null,
      portfolioObraDestaqueId: obraDestaqueId || null,
      portfolioCapaUrl: (formData.get("portfolioCapaUrl") as string) || null,
    },
  });

  revalidatePath("/painel");
  return {};
}

export async function updatePixKey(formData: FormData): Promise<{ error: string } | undefined> {
  const author = await requireAuthor();

  const pixKey = ((formData.get("pixKey") as string) || "").trim();
  const pixKeyType = (formData.get("pixKeyType") as string) || "";

  if (!pixKey || !TIPOS_CHAVE_PIX.has(pixKeyType)) {
    return { error: "Informe uma chave Pix e o tipo dela." };
  }
  if (!chavePixValida(pixKeyType, pixKey)) {
    return { error: "Chave Pix inválida para o tipo selecionado." };
  }

  await prisma.author.update({
    where: { id: author.id },
    data: { pixKey, pixKeyType },
  });

  revalidatePath("/painel");
}

const bookSchema = z.object({
  titulo: textoSchema(200, false),
  genero: z.enum(GENERO_ENUM),
  estoque: intSchema(0, 100000),
  descricao: textoSchema(3000, false),
});

type BookData = {
  titulo: string;
  genero: string;
  precoCentavos: number;
  estoque: number;
  capaUrl: string | null;
  capaLargura: number | null;
  capaAltura: number | null;
  descricao: string | null;
  descontoPercentual: number | null;
};

// Lida via <input type="hidden"> preenchido no cliente (ver LivrosView.tsx) com a
// largura/altura reais lidas do arquivo no momento do upload — usado só pra exibir a capa
// na proporção verdadeira depois. Ignora valor ausente/inválido em vez de dar erro: é uma
// informação de exibição, não obrigatória pro cadastro do livro funcionar.
function intPositivoOuNull(valor: FormDataEntryValue | null): number | null {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

function bookDataFromForm(formData: FormData): { error: string } | { data: BookData } {
  const parsed = bookSchema.safeParse({
    titulo: ((formData.get("titulo") as string) || "").trim() || "Sem título",
    genero: (formData.get("genero") as string) || GENEROS[0],
    estoque: (formData.get("estoque") as string) || "0",
    descricao: (formData.get("descricao") as string) || "",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }

  const descontoRaw = ((formData.get("descontoPercentual") as string) || "").trim();
  let descontoPercentual: number | null = null;
  if (descontoRaw) {
    const n = parseInt(descontoRaw, 10);
    if (!Number.isFinite(n) || n < 0 || n > 90) {
      return { error: "O desconto deve ser um número entre 0% e 90%." };
    }
    descontoPercentual = n;
  }

  const preco = (formData.get("preco") as string) || "0";
  const capaUrl = (formData.get("capaUrl") as string) || null;
  const capaLargura = intPositivoOuNull(formData.get("capaLargura"));
  const capaAltura = intPositivoOuNull(formData.get("capaAltura"));

  return {
    data: {
      titulo: parsed.data.titulo || "Sem título",
      genero: parsed.data.genero,
      precoCentavos: Math.max(0, centavosFromInput(preco)),
      estoque: parsed.data.estoque,
      capaUrl,
      capaLargura,
      capaAltura,
      descricao: parsed.data.descricao || null,
      descontoPercentual,
    },
  };
}

export async function addBook(formData: FormData): Promise<{ error?: string }> {
  const author = await requireAuthor();

  const parsed = bookDataFromForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.book.create({
    data: {
      authorId: author.id,
      ...parsed.data,
    },
  });

  revalidatePath("/painel");
  return {};
}

export async function updateBook(id: string, formData: FormData): Promise<{ error?: string }> {
  const author = await requireAuthor();

  const parsed = bookDataFromForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.book.updateMany({
    where: { id, authorId: author.id },
    data: parsed.data,
  });

  revalidatePath("/painel");
  return {};
}

export async function removeBook(id: string) {
  const author = await requireAuthor();
  await prisma.book.deleteMany({ where: { id, authorId: author.id } });
  revalidatePath("/painel");
}

const anoAtual = new Date().getFullYear();

const eventoSchema = z.object({
  nome: textoSchema(120, false),
  diaInicio: intSchema(1, 31),
  mes: z.enum(MESES_EVENTO),
  ano: intSchema(anoAtual, anoAtual + 5),
  local: textoSchema(200, false),
  status: z.enum(STATUS_EVENTO),
});

type EventData = { nome: string; diaInicio: number; diaFim: number | null; mes: string; ano: number; local: string; status: string };

function eventDataFromForm(formData: FormData): { error: string } | { data: EventData } {
  const diaFimRaw = (formData.get("diaFim") as string) || "";

  const parsed = eventoSchema.safeParse({
    nome: ((formData.get("nome") as string) || "Evento").trim(),
    diaInicio: (formData.get("diaInicio") as string) || "1",
    mes: (formData.get("mes") as string) || "JAN",
    ano: (formData.get("ano") as string) || String(anoAtual),
    local: ((formData.get("local") as string) || "—").trim(),
    status: (formData.get("status") as string) || "Pendente",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }

  const diaFimParsed = diaFimRaw.trim() ? parseInt(diaFimRaw, 10) : null;
  const diaFim = diaFimParsed && diaFimParsed > parsed.data.diaInicio && diaFimParsed <= 31 ? diaFimParsed : null;

  return {
    data: {
      nome: parsed.data.nome || "Evento",
      diaInicio: parsed.data.diaInicio,
      diaFim,
      mes: parsed.data.mes,
      ano: parsed.data.ano,
      local: parsed.data.local || "—",
      status: parsed.data.status,
    },
  };
}

export async function addEvent(formData: FormData): Promise<{ error?: string }> {
  const author = await requireAuthor();
  if (!podeUsarRecursosExtras(author.plano)) {
    return { error: "A agenda de eventos não está disponível no seu plano. Faça upgrade para usar esse recurso." };
  }

  const parsed = eventDataFromForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.authorEvent.create({
    data: {
      authorId: author.id,
      ...parsed.data,
    },
  });

  revalidatePath("/painel");
  return {};
}

export async function updateEvent(id: string, formData: FormData): Promise<{ error?: string }> {
  const author = await requireAuthor();
  if (!podeUsarRecursosExtras(author.plano)) {
    return { error: "A agenda de eventos não está disponível no seu plano. Faça upgrade para usar esse recurso." };
  }

  const parsed = eventDataFromForm(formData);
  if ("error" in parsed) return parsed;

  await prisma.authorEvent.updateMany({
    where: { id, authorId: author.id },
    data: parsed.data,
  });

  revalidatePath("/painel");
  return {};
}

export async function removeEvent(id: string) {
  const author = await requireAuthor();
  await prisma.authorEvent.deleteMany({ where: { id, authorId: author.id } });
  revalidatePath("/painel");
}

const fotoSchema = z.object({
  titulo: textoSchema(120, false),
  categoria: z.enum(CATEGORIAS_FOTO),
});

export async function addPhoto(formData: FormData): Promise<{ error?: string }> {
  const author = await requireAuthor();
  const url = (formData.get("url") as string) || "";
  if (!url) return {};

  if (author.plano === "Iniciante") {
    return { error: "A galeria de fotos é exclusiva dos planos Essencial e Premium. Faça upgrade para adicionar fotos." };
  }

  const parsed = fotoSchema.safeParse({
    titulo: (formData.get("titulo") as string) || "Foto",
    categoria: (formData.get("categoria") as string) || "Outros",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }

  await prisma.authorPhoto.create({
    data: {
      authorId: author.id,
      titulo: parsed.data.titulo || "Foto",
      categoria: parsed.data.categoria,
      url,
    },
  });

  revalidatePath("/painel");
  return {};
}

export async function removePhoto(id: string) {
  const author = await requireAuthor();
  await prisma.authorPhoto.deleteMany({ where: { id, authorId: author.id } });
  revalidatePath("/painel");
}

const portfolioEventoSchema = z.object({
  titulo: z.string().trim().min(1, "Informe o título do evento.").max(150, "Título muito longo."),
  descricao: textoSchema(2000, false),
});

export async function addPortfolioEvento(formData: FormData): Promise<{ error?: string }> {
  const author = await requireAuthor();

  if (author.plano === "Iniciante") {
    const total = await prisma.portfolioEvento.count({ where: { authorId: author.id } });
    if (total >= PORTFOLIO_EVENTOS_MAX_INICIANTE) {
      return { error: `O plano Iniciante permite até ${PORTFOLIO_EVENTOS_MAX_INICIANTE} eventos no portfólio. Faça upgrade para adicionar mais.` };
    }
  }

  const parsed = portfolioEventoSchema.safeParse({
    titulo: (formData.get("titulo") as string) || "",
    descricao: (formData.get("descricao") as string) || "",
  });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }

  const fotos = (formData.getAll("fotos") as string[]).filter(Boolean);
  if (fotos.length === 0) {
    return { error: "Adicione ao menos uma foto do evento." };
  }
  if (fotos.length > 6) {
    return { error: "No máximo 6 fotos por evento." };
  }

  await prisma.portfolioEvento.create({
    data: {
      authorId: author.id,
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao || null,
      fotos,
    },
  });

  revalidatePath("/painel");
  return {};
}

export async function removePortfolioEvento(id: string) {
  const author = await requireAuthor();
  await prisma.portfolioEvento.deleteMany({ where: { id, authorId: author.id } });
  revalidatePath("/painel");
}

export async function setOrderStatus(id: string, status: string): Promise<{ error?: string }> {
  const author = await requireAuthor();

  const statusParsed = z.enum(STATUS_PEDIDO).safeParse(status);
  if (!statusParsed.success) {
    return { error: "Status de pedido inválido." };
  }
  const novoStatus = statusParsed.data;

  const order = await prisma.order.findFirst({ where: { id, authorId: author.id } });
  if (!order) return { error: "Pedido não encontrado." };

  if (novoStatus === "Entregue") {
    return { error: "Esse status é definido automaticamente quando o comprador confirma o recebimento." };
  }

  if (novoStatus === "Enviado" && order.status !== "Enviado") {
    await prisma.order.update({ where: { id }, data: { status: novoStatus } });
    await enviarConfirmacaoRecebimento(order, author);
    revalidatePath("/painel");
    return {};
  }

  await prisma.order.updateMany({ where: { id, authorId: author.id }, data: { status: novoStatus } });
  revalidatePath("/painel");
  return {};
}

export async function markConversationRead(id: string) {
  const author = await requireAuthor();
  await prisma.conversation.updateMany({ where: { id, authorId: author.id }, data: { unread: false } });
  revalidatePath("/painel");
}

export type ChangePasswordState = { error?: string; ok?: boolean } | undefined;

export async function changePassword(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const author = await requireAuthor();

  const permitido = await checkRateLimit(`change-password:${author.id}`, 5, 15);
  if (!permitido) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }

  const senhaAtual = (formData.get("senhaAtual") as string) || "";

  if (author.senhaHash) {
    if (!senhaAtual) {
      return { error: "Informe sua senha atual." };
    }
    const senhaOk = await bcrypt.compare(senhaAtual, author.senhaHash);
    if (!senhaOk) {
      return { error: "Senha atual incorreta." };
    }
  }

  const parsed = z
    .object({ novaSenha: senhaNovaSchema, confirmar: z.string() })
    .refine((d) => d.novaSenha === d.confirmar, { message: "As senhas não coincidem.", path: ["confirmar"] })
    .safeParse({
      novaSenha: (formData.get("novaSenha") as string) || "",
      confirmar: (formData.get("confirmar") as string) || "",
    });
  if (!parsed.success) {
    return { error: primeiroErroZod(parsed.error) };
  }

  const senhaHash = await bcrypt.hash(parsed.data.novaSenha, 10);
  await prisma.author.update({ where: { id: author.id }, data: { senhaHash } });

  return { ok: true };
}

export async function desconectarMercadoPago() {
  const author = await requireAuthor();
  await desconectarMercadoPagoLib(author.id);
  revalidatePath("/painel");
}

export async function iniciarRegistroPasskey() {
  const author = await requireAuthor();

  const passkeysExistentes = await prisma.authorPasskey.findMany({ where: { authorId: author.id } });

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: getRpID(),
    userName: author.email,
    userDisplayName: author.nome,
    userID: new TextEncoder().encode(author.id),
    attestationType: "none",
    excludeCredentials: passkeysExistentes.map((p) => ({
      id: p.credentialId,
      transports: p.transports as AuthenticatorTransportFuture[],
    })),
    authenticatorSelection: { residentKey: "required", userVerification: "preferred" },
  });

  const cookieStore = await cookies();
  cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS,
  });

  return options;
}

export type PasskeyRegistroState = { error?: string; ok?: boolean } | undefined;

export async function confirmarRegistroPasskey(
  response: RegistrationResponseJSON,
  deviceLabel: string
): Promise<PasskeyRegistroState> {
  const author = await requireAuthor();

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
  cookieStore.delete(WEBAUTHN_CHALLENGE_COOKIE);
  if (!expectedChallenge) {
    return { error: "Sessão de cadastro expirada. Tente novamente." };
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getRpID(),
    });
  } catch (err) {
    console.error("[webauthn] Falha ao verificar registro de biometria:", err);
    return { error: "Não foi possível confirmar a biometria. Tente novamente." };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { error: "Não foi possível confirmar a biometria." };
  }

  const { credential } = verification.registrationInfo;

  const jaExiste = await prisma.authorPasskey.findUnique({ where: { credentialId: credential.id } });
  if (jaExiste) {
    return { error: "Essa biometria já está cadastrada." };
  }

  await prisma.authorPasskey.create({
    data: {
      authorId: author.id,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      transports: credential.transports ?? [],
      deviceLabel: deviceLabel.trim() || "Dispositivo",
    },
  });

  revalidatePath("/painel");
  return { ok: true };
}

export async function removerPasskey(id: string) {
  const author = await requireAuthor();
  await prisma.authorPasskey.deleteMany({ where: { id, authorId: author.id } });
  revalidatePath("/painel");
}

export async function excluirMinhaConta(): Promise<{ error?: string }> {
  const author = await requireAuthor();

  const pedidosPendentes = await prisma.order.count({
    where: { authorId: author.id, status: { notIn: ["Entregue", "Aguardando pagamento", "Cancelado"] } },
  });
  if (pedidosPendentes > 0) {
    return {
      error: "Você tem pedidos em andamento (pagos, aguardando envio ou repasse). Finalize-os antes de excluir sua conta.",
    };
  }

  // Cancela qualquer assinatura/autorização ativa antes de apagar a conta, pra não deixar
  // nada pendurado do lado da Asaas/Mercado Pago.
  await cancelarAssinaturaAtiva(author);

  await excluirAutorCompletamente(author.id);
  await deleteAuthorSession();
  redirect("/");
}
