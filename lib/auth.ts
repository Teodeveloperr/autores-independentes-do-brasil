import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthorSession, getAdminSession } from "@/lib/session";

export const getCurrentAuthor = cache(async () => {
  const session = await getAuthorSession();
  if (!session?.authorId) return null;
  return prisma.author.findUnique({ where: { id: session.authorId } });
});

export async function requireAuthor() {
  const author = await getCurrentAuthor();
  if (!author) redirect("/login");
  return author;
}

export const getCurrentAdmin = cache(async () => {
  const session = await getAdminSession();
  if (!session?.adminId) return null;
  return prisma.admin.findUnique({ where: { id: session.adminId } });
});

export async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin");
  return admin;
}
