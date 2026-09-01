import type { Metadata } from "next";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminLoginGate from "@/components/admin/AdminLoginGate";
import AdminApp from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Administração" };

export default async function AdminPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return <AdminLoginGate />;
  }

  const [eventos, oportunidades, fotos, autores, artigos, avaliacoes, pedidos, pedidosReceita, assinaturaPagamentos] = await Promise.all([
    prisma.collectiveEvent.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.opportunity.findMany({ orderBy: { prazoFinal: "asc" } }),
    prisma.collectiveGalleryPhoto.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.author.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { books: true } } },
    }),
    prisma.article.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { nome: true } } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { nome: true } } } }),
    prisma.order.findMany({
      where: { status: { not: "Aguardando pagamento" } },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { plano: true } } },
    }),
    prisma.subscriptionPayment.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { nome: true } } } }),
  ]);

  return (
    <AdminApp
      eventos={eventos}
      oportunidades={oportunidades}
      fotos={fotos}
      autores={autores}
      artigos={artigos}
      avaliacoes={avaliacoes}
      pedidos={pedidos}
      pedidosReceita={pedidosReceita}
      assinaturaPagamentos={assinaturaPagamentos}
      totpEnabled={admin.totpEnabled}
    />
  );
}
