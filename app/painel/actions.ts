"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireAuthor } from "@/lib/auth";
import { deleteAuthorSession } from "@/lib/session";
import { centavosFromInput } from "@/lib/format";

export async function logout() {
  await deleteAuthorSession();
  redirect("/login");
}

export async function saveProfile(formData: FormData) {
  const author = await requireAuthor();

  await prisma.author.update({
    where: { id: author.id },
    data: {
      nome: ((formData.get("nome") as string) || author.nome).trim(),
      genero: (formData.get("genero") as string) || author.genero,
      cidade: ((formData.get("cidade") as string) || "").trim(),
      bio: ((formData.get("bio") as string) || "").trim(),
      fotoUrl: (formData.get("fotoUrl") as string) || author.fotoUrl,
      bannerUrl: (formData.get("bannerUrl") as string) || author.bannerUrl,
    },
  });

  revalidatePath("/painel");
}

export async function addBook(formData: FormData) {
  const author = await requireAuthor();

  const titulo = ((formData.get("titulo") as string) || "").trim() || "Sem título";
  const genero = (formData.get("genero") as string) || "Romance";
  const preco = (formData.get("preco") as string) || "0";
  const estoque = parseInt((formData.get("estoque") as string) || "0", 10) || 0;
  const capaUrl = (formData.get("capaUrl") as string) || null;
  const descricao = ((formData.get("descricao") as string) || "").trim() || null;

  await prisma.book.create({
    data: {
      authorId: author.id,
      titulo,
      genero,
      precoCentavos: centavosFromInput(preco),
      estoque,
      capaUrl,
      descricao,
    },
  });

  revalidatePath("/painel");
}

export async function removeBook(id: string) {
  const author = await requireAuthor();
  await prisma.book.deleteMany({ where: { id, authorId: author.id } });
  revalidatePath("/painel");
}

export async function addEvent(formData: FormData) {
  const author = await requireAuthor();

  await prisma.authorEvent.create({
    data: {
      authorId: author.id,
      nome: ((formData.get("nome") as string) || "Evento").trim(),
      dia: parseInt((formData.get("dia") as string) || "1", 10) || 1,
      mes: (formData.get("mes") as string) || "JAN",
      local: ((formData.get("local") as string) || "—").trim(),
      status: (formData.get("status") as string) || "Pendente",
    },
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
