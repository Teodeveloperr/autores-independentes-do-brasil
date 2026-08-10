import type { Metadata } from "next";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminLoginGate from "@/components/admin/AdminLoginGate";
import AdminApp from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Administração" };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ melhorenvio?: string; erro?: string }>;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return <AdminLoginGate />;
  }

  const { melhorenvio, erro } = await searchParams;

  const [eventos, fotos, autores, artigos, melhorEnvioToken] = await Promise.all([
    prisma.collectiveEvent.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.collectiveGalleryPhoto.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.author.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { books: true } } },
    }),
    prisma.article.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.melhorEnvioToken.findUnique({ where: { id: "singleton" } }),
  ]);

  return (
    <AdminApp
      eventos={eventos}
      fotos={fotos}
      autores={autores}
      artigos={artigos}
      melhorEnvioConectado={!!melhorEnvioToken}
      melhorEnvioFeedback={melhorenvio === "conectado" ? "sucesso" : erro === "melhorenvio" ? "erro" : null}
    />
  );
}
