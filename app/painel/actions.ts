"use server";

import bcrypt from "bcryptjs";
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
import { validarSenha } from "@/lib/password";
import { validarCpf } from "@/lib/cpf";
import { criarTransferenciaPix } from "@/lib/asaas";
import { valorRepasseCentavos, podeUsarRecursosExtras, BIO_MAX_CARACTERES_INICIANTE, FOTOS_MAX_INICIANTE } from "@/lib/plans";
import { checkRateLimit } from "@/lib/rateLimit";
import { desconectarMercadoPago as desconectarMercadoPagoLib } from "@/lib/mercadoPagoMarketplace";
import {
  RP_NAME,
  getRpID,
  getExpectedOrigin,
  WEBAUTHN_CHALLENGE_COOKIE,
  WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS,
} from "@/lib/webauthn";

export async function logout() {
  await deleteAuthorSession();
  redirect("/login");
}

export async function saveProfile(formData: FormData) {
  const author = await requireAuthor();

  const generos = formData.getAll("generos") as string[];
  const bio = ((formData.get("bio") as string) || "").trim();

  if (author.plano === "Iniciante" && bio.length > BIO_MAX_CARACTERES_INICIANTE) {
    throw new Error(`O plano Iniciante permite bio de até ${BIO_MAX_CARACTERES_INICIANTE} caracteres. Faça upgrade para escrever mais.`);
  }

  await prisma.author.update({
    where: { id: author.id },
    data: {
      nome: ((formData.get("nome") as string) || author.nome).trim(),
      generos: generos.length > 0 ? generos : author.generos,
      cidade: ((formData.get("cidade") as string) || "").trim(),
      bio,
      fraseApresentacao: ((formData.get("fraseApresentacao") as string) || "").trim().slice(0, 140) || null,
      profissoes: ((formData.get("profissoes") as string) || "").trim().slice(0, 120) || null,
      fotoUrl: (formData.get("fotoUrl") as string) || author.fotoUrl,
      bannerUrl: (formData.get("bannerUrl") as string) || author.bannerUrl,
      bannerPositionX: parseInt((formData.get("bannerPositionX") as string) || "", 10) || 50,
      bannerPositionY: parseInt((formData.get("bannerPositionY") as string) || "", 10) || 50,
      videoUrl: (formData.get("videoUrl") as string) || null,
      instagramUrl: sanitizeExternalUrl((formData.get("instagramUrl") as string) || ""),
      twitterUrl: sanitizeExternalUrl((formData.get("twitterUrl") as string) || ""),
      siteUrl: sanitizeExternalUrl((formData.get("siteUrl") as string) || ""),
    },
  });

  revalidatePath("/painel");
}

export async function updatePortfolio(formData: FormData) {
  const author = await requireAuthor();

  const obraDestaqueId = ((formData.get("portfolioObraDestaqueId") as string) || "").trim();
  if (obraDestaqueId) {
    const obra = await prisma.book.findFirst({ where: { id: obraDestaqueId, authorId: author.id } });
    if (!obra) throw new Error("Obra em destaque inválida.");
  }

  await prisma.author.update({
    where: { id: author.id },
    data: {
      portfolioFormacao: ((formData.get("portfolioFormacao") as string) || "").trim() || null,
      portfolioPremios: ((formData.get("portfolioPremios") as string) || "").trim() || null,
      portfolioCitacao: ((formData.get("portfolioCitacao") as string) || "").trim() || null,
      portfolioObraDestaqueId: obraDestaqueId || null,
      portfolioCapaUrl: (formData.get("portfolioCapaUrl") as string) || null,
    },
  });

  revalidatePath("/painel");
}

const TIPOS_CHAVE_PIX = new Set(["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"]);

export async function updatePixKey(formData: FormData) {
  const author = await requireAuthor();

  const pixKey = ((formData.get("pixKey") as string) || "").trim();
  const pixKeyType = (formData.get("pixKeyType") as string) || "";

  if (!pixKey || !TIPOS_CHAVE_PIX.has(pixKeyType)) {
    throw new Error("Informe uma chave Pix e o tipo dela.");
  }
  if (pixKeyType === "CPF" && !validarCpf(pixKey)) {
    throw new Error("CPF inválido.");
  }

  await prisma.author.update({
    where: { id: author.id },
    data: { pixKey, pixKeyType },
  });

  revalidatePath("/painel");
}

function bookDataFromForm(formData: FormData) {
  const titulo = ((formData.get("titulo") as string) || "").trim() || "Sem título";
  const genero = (formData.get("genero") as string) || "Romance";
  const preco = (formData.get("preco") as string) || "0";
  const estoque = parseInt((formData.get("estoque") as string) || "0", 10) || 0;
  const capaUrl = (formData.get("capaUrl") as string) || null;
  const descricao = ((formData.get("descricao") as string) || "").trim() || null;

  return {
    titulo,
    genero,
    precoCentavos: centavosFromInput(preco),
    estoque,
    capaUrl,
    descricao,
  };
}

export async function addBook(formData: FormData) {
  const author = await requireAuthor();

  await prisma.book.create({
    data: {
      authorId: author.id,
      ...bookDataFromForm(formData),
    },
  });

  revalidatePath("/painel");
}

export async function updateBook(id: string, formData: FormData) {
  const author = await requireAuthor();

  await prisma.book.updateMany({
    where: { id, authorId: author.id },
    data: bookDataFromForm(formData),
  });

  revalidatePath("/painel");
}

export async function removeBook(id: string) {
  const author = await requireAuthor();
  await prisma.book.deleteMany({ where: { id, authorId: author.id } });
  revalidatePath("/painel");
}

function eventDataFromForm(formData: FormData) {
  const diaInicio = parseInt((formData.get("diaInicio") as string) || "1", 10) || 1;
  const diaFimRaw = (formData.get("diaFim") as string) || "";
  const diaFim = diaFimRaw.trim() ? parseInt(diaFimRaw, 10) || null : null;

  return {
    nome: ((formData.get("nome") as string) || "Evento").trim(),
    diaInicio,
    diaFim: diaFim && diaFim > diaInicio ? diaFim : null,
    mes: (formData.get("mes") as string) || "JAN",
    ano: parseInt((formData.get("ano") as string) || "", 10) || new Date().getFullYear(),
    local: ((formData.get("local") as string) || "—").trim(),
    status: (formData.get("status") as string) || "Pendente",
  };
}

export async function addEvent(formData: FormData) {
  const author = await requireAuthor();
  if (!podeUsarRecursosExtras(author.plano)) {
    throw new Error("A agenda de eventos não está disponível no seu plano. Faça upgrade para usar esse recurso.");
  }

  await prisma.authorEvent.create({
    data: {
      authorId: author.id,
      ...eventDataFromForm(formData),
    },
  });

  revalidatePath("/painel");
}

export async function updateEvent(id: string, formData: FormData) {
  const author = await requireAuthor();
  if (!podeUsarRecursosExtras(author.plano)) {
    throw new Error("A agenda de eventos não está disponível no seu plano. Faça upgrade para usar esse recurso.");
  }

  await prisma.authorEvent.updateMany({
    where: { id, authorId: author.id },
    data: eventDataFromForm(formData),
  });

  revalidatePath("/painel");
}

export async function removeEvent(id: string) {
  const author = await requireAuthor();
  await prisma.authorEvent.deleteMany({ where: { id, authorId: author.id } });
  revalidatePath("/painel");
}

export async function addPhoto(formData: FormData) {
  const author = await requireAuthor();
  const url = (formData.get("url") as string) || "";
  if (!url) return;

  if (author.plano === "Iniciante") {
    const totalFotos = await prisma.authorPhoto.count({ where: { authorId: author.id } });
    if (totalFotos >= FOTOS_MAX_INICIANTE) {
      throw new Error(`O plano Iniciante permite até ${FOTOS_MAX_INICIANTE} fotos. Faça upgrade para adicionar mais.`);
    }
  }

  await prisma.authorPhoto.create({
    data: {
      authorId: author.id,
      titulo: ((formData.get("titulo") as string) || "Foto").trim(),
      categoria: (formData.get("categoria") as string) || "Outros",
      url,
    },
  });

  revalidatePath("/painel");
}

export async function removePhoto(id: string) {
  const author = await requireAuthor();
  await prisma.authorPhoto.deleteMany({ where: { id, authorId: author.id } });
  revalidatePath("/painel");
}

export async function setOrderStatus(id: string, status: string) {
  const author = await requireAuthor();
  const order = await prisma.order.findFirst({ where: { id, authorId: author.id } });
  if (!order) throw new Error("Pedido não encontrado.");

  const precisaRepasse = status === "Enviado" && order.asaasPaymentId && order.repasseStatus !== "transferido";

  if (precisaRepasse) {
    if (!author.pixKey || !author.pixKeyType) {
      throw new Error("Cadastre sua chave Pix em Configurações antes de marcar como enviado.");
    }

    const valorRepasse = valorRepasseCentavos(author.plano, order.valorCentavos, order.freteCentavos ?? 0);
    const transferencia = await criarTransferenciaPix({
      valueCentavos: valorRepasse,
      pixKey: author.pixKey,
      pixKeyType: author.pixKeyType,
      description: `Repasse - Pedido ${order.id.slice(-6)}`,
      externalReference: order.id,
    });

    if (!transferencia) {
      await prisma.order.update({
        where: { id },
        data: { repasseStatus: "erro", repasseErro: "Falha ao criar transferência na Asaas." },
      });
      throw new Error("Não foi possível processar o repasse automático. Tente novamente em instantes ou contate o suporte.");
    }

    await prisma.order.update({
      where: { id },
      data: { status, repasseStatus: "transferido", repasseAsaasTransferId: transferencia.id, repasseErro: null },
    });
    revalidatePath("/painel");
    return;
  }

  await prisma.order.updateMany({ where: { id, authorId: author.id }, data: { status } });
  revalidatePath("/painel");
}

export async function markConversationRead(id: string) {
  const author = await requireAuthor();
  await prisma.conversation.updateMany({ where: { id, authorId: author.id }, data: { unread: false } });
  revalidatePath("/painel");
}

export async function sendMessage(conversationId: string, texto: string) {
  const author = await requireAuthor();
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, authorId: author.id },
  });
  if (!conversation || !texto.trim()) return;

  await prisma.message.create({
    data: { conversationId, de: "me", texto: texto.trim() },
  });

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
  const novaSenha = (formData.get("novaSenha") as string) || "";
  const confirmar = (formData.get("confirmar") as string) || "";

  if (author.senhaHash) {
    if (!senhaAtual) {
      return { error: "Informe sua senha atual." };
    }
    const senhaOk = await bcrypt.compare(senhaAtual, author.senhaHash);
    if (!senhaOk) {
      return { error: "Senha atual incorreta." };
    }
  }

  const erroSenha = validarSenha(novaSenha);
  if (erroSenha) {
    return { error: erroSenha };
  }
  if (novaSenha !== confirmar) {
    return { error: "As senhas não coincidem." };
  }

  const senhaHash = await bcrypt.hash(novaSenha, 10);
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
