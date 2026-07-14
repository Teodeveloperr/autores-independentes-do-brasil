"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAdminSession, deleteAdminSession } from "@/lib/session";
import { requireAdmin } from "@/lib/auth";

export type AdminLoginState = { error?: string } | undefined;

export async function adminLogin(
  _prev: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const senha = (formData.get("senha") as string) || "";

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
