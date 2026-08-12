"use server";

import bcrypt from "bcryptjs";
import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAdminSession, deleteAdminSession } from "@/lib/session";
import { requireAdmin } from "@/lib/auth";
import { recalcularAvaliacaoAutor } from "@/lib/reviews";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

export type AdminLoginState = { error?: string } | undefined;

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const senha = (formData.get("senha") as string) || "";

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

  await createAdminSession(admin.id);
  return undefined;
}

export async function adminLogout() {
  await deleteAdminSession();
}

export async function addCollectiveEvent(formData: FormData) {
  await requireAdmin();

  await prisma.collectiveEvent.create({
    data: {
      nome: ((formData.get("nome") as string) || "Evento").trim(),
      dia: parseInt((formData.get("dia") as string) || "1", 10) || 1,
      mes: (formData.get("mes") as string) || "JAN",
      categoria: (formData.get("categoria") as string) || "Outros",
      local: ((formData.get("local") as string) || "—").trim(),
      periodo: ((formData.get("periodo") as string) || "").trim() || null,
    },
  });

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

export async function addCollectiveGalleryPhoto(formData: FormData) {
  await requireAdmin();
  const url = (formData.get("url") as string) || "";
  if (!url) return;

  await prisma.collectiveGalleryPhoto.create({
    data: {
      titulo: ((formData.get("titulo") as string) || "Foto").trim(),
      categoria: (formData.get("categoria") as string) || "Outros",
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

export async function removeAuthor(id: string) {
  await requireAdmin();

  const author = await prisma.author.findUnique({
    where: { id },
    include: { books: true, fotos: true },
  });

  const blobUrls = [
    author?.fotoUrl,
    author?.bannerUrl,
    ...(author?.books.map((b) => b.capaUrl) ?? []),
    ...(author?.fotos.map((f) => f.url) ?? []),
  ].filter((url): url is string => !!url && url.includes(".blob.vercel-storage.com"));

  await prisma.author.delete({ where: { id } });

  if (blobUrls.length > 0) {
    try {
      await del(blobUrls);
    } catch (err) {
      // Registros já foram apagados; falha ao limpar arquivos não deve impedir a exclusão.
      console.error("[admin] Falha ao apagar arquivos do autor removido:", err);
    }
  }

  revalidatePath("/admin");
  revalidatePath("/autores");
  revalidatePath("/livros");
  revalidatePath("/");
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

export async function addArticle(formData: FormData) {
  await requireAdmin();
  const capaUrl = (formData.get("capaUrl") as string) || null;

  await prisma.article.create({
    data: {
      titulo: ((formData.get("titulo") as string) || "Artigo").trim(),
      resumo: ((formData.get("resumo") as string) || "").trim(),
      conteudo: ((formData.get("conteudo") as string) || "").trim(),
      categoria: (formData.get("categoria") as string) || "Artigos",
      autorNome: ((formData.get("autorNome") as string) || "Coletivo").trim(),
      capaUrl,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/blog");
}

export async function removeArticle(id: string) {
  await requireAdmin();
  await prisma.article.delete({ where: { id } });
  revalidatePath("/admin");
  revalidatePath("/blog");
}
