import type { Metadata } from "next";
import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buscarSaldoAsaas } from "@/lib/asaas";
import AdminLoginGate from "@/components/admin/AdminLoginGate";
import AdminApp from "@/components/admin/AdminApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Administração" };

export default async function AdminPage() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return <AdminLoginGate />;
  }

  // Mesmo cálculo de data (string ISO em UTC) usado em app/api/track-visit/route.ts —
  // evita divergência de fuso horário entre quem grava e quem lê o contador.
  const hojeISO = new Date().toISOString().slice(0, 10);
  const inicioMesISO = `${hojeISO.slice(0, 7)}-01`;

  const [
    eventos,
    oportunidades,
    fotos,
    autores,
    artigos,
    talkShowVideos,
    avaliacoes,
    pedidos,
    pedidosReceita,
    assinaturaPagamentos,
    saldoAsaasCentavos,
    visitaHoje,
    visitasMesAgg,
    contratos,
    contratoConfig,
    acessosEbook,
    ebooks,
  ] = await Promise.all([
    prisma.collectiveEvent.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.opportunity.findMany({ orderBy: { prazoFinal: "asc" } }),
    prisma.collectiveGalleryPhoto.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.author.findMany({
      where: { status: { not: "encerrado" } },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { books: true } } },
    }),
    prisma.article.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.talkShowVideo.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.review.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { nome: true } } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { nome: true } } } }),
    prisma.order.findMany({
      where: { status: { notIn: ["Aguardando pagamento", "Cancelado"] } },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { plano: true } } },
    }),
    prisma.subscriptionPayment.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { nome: true } } } }),
    buscarSaldoAsaas(),
    prisma.siteVisit.findUnique({ where: { data: new Date(hojeISO) } }),
    prisma.siteVisit.aggregate({ _sum: { contagem: true }, where: { data: { gte: new Date(inicioMesISO) } } }),
    // Sem o PDF e a assinatura (pesados e sensíveis): o PDF abre por uma rota própria só do admin.
    prisma.contratoBienal.findMany({
      orderBy: { createdAt: "desc" },
      omit: { pdf: true, assinaturaPng: true, codigoHash: true, assinaturaUserAgent: true },
      include: { reservas: true },
    }),
    prisma.contratoConfig.findUnique({ where: { id: "unico" } }),
    prisma.acessoEbook.findMany({
      orderBy: { concedidoEm: "desc" },
      include: {
        leitor: { select: { id: true, email: true, nome: true, ultimoAcessoEm: true, _count: { select: { sessoes: { where: { expiraEm: { gt: new Date() } } } } } } },
        book: { select: { titulo: true, author: { select: { nome: true } } } },
        order: { select: { id: true, status: true } },
      },
    }),
    prisma.book.findMany({
      where: { formato: "ebook" },
      orderBy: { createdAt: "desc" },
      select: { id: true, titulo: true, ebookStatus: true, ebookPaginas: true, ebookErro: true, ebookAtualizadoEm: true, author: { select: { nome: true } }, _count: { select: { acessosEbook: true } } },
    }),
  ]);

  return (
    <AdminApp
      eventos={eventos}
      oportunidades={oportunidades}
      fotos={fotos}
      autores={autores}
      artigos={artigos}
      talkShowVideos={talkShowVideos}
      avaliacoes={avaliacoes}
      pedidos={pedidos}
      pedidosReceita={pedidosReceita}
      assinaturaPagamentos={assinaturaPagamentos}
      saldoAsaasCentavos={saldoAsaasCentavos}
      contratos={contratos}
      assinaturaContratada={contratoConfig?.assinaturaContratadaPng ?? null}
      acessosEbook={acessosEbook}
      ebooks={ebooks}
      totpEnabled={admin.totpEnabled}
      premiumPlusPixKey={admin.premiumPlusPixKey}
      premiumPlusPixKeyType={admin.premiumPlusPixKeyType}
      visitasHoje={visitaHoje?.contagem ?? 0}
      visitasMes={visitasMesAgg._sum.contagem ?? 0}
    />
  );
}
