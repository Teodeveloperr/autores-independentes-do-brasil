import type { Metadata } from "next";
import { requireAuthor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { garantirSlug } from "@/lib/autorSlug";
import { carregarDadosPrevia, urlPrevia } from "@/lib/previaAutor";
import PainelApp from "@/components/painel/PainelApp";
import type { DadosBienalPainel } from "@/components/painel/types";
import { PLANO_PREMIUM_PLUS, premiumPlusPodeEscolher } from "@/lib/contrato/config";
import { carregarOcupacao, horariosDasReservas } from "@/lib/contrato/agenda";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Meu Painel" };

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ mercadopago?: string }> }) {
  const authorSession = await requireAuthor();
  const { mercadopago } = await searchParams;

  // Quem entra no painel já precisa ter o endereço amigável do perfil (aba "Divulgar meu perfil").
  await garantirSlug(authorSession.id);

  const [author, visualizacoesAgg, pedidosImpressao] = await Promise.all([
    prisma.author.findUniqueOrThrow({
      where: { id: authorSession.id },
      omit: { senhaHash: true },
      include: {
        books: { where: { OR: [{ ebookStatus: null }, { ebookStatus: { not: "retirado" } }] }, orderBy: { createdAt: "desc" } },
        eventos: { orderBy: { createdAt: "desc" } },
        fotos: { orderBy: { createdAt: "desc" } },
        portfolioEventos: { orderBy: { createdAt: "desc" } },
        orders: { orderBy: { createdAt: "desc" }, include: { book: { select: { capaUrl: true } } } },
        conversas: {
          orderBy: { createdAt: "desc" },
          include: { mensagens: { orderBy: { createdAt: "asc" } } },
        },
        avaliacoes: { orderBy: { createdAt: "desc" } },
        passkeys: { orderBy: { createdAt: "desc" }, omit: { publicKey: true } },
      },
    }),
    prisma.author.aggregate({ where: { status: "ativo" }, _max: { visualizacoes: true } }),
    prisma.pedidoImpressao.findMany({
      where: { authorId: authorSession.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, numero: true, titulo: true, tiragem: true, status: true, createdAt: true },
    }),
  ]);

  const temSenha = authorSession.senhaHash != null;
  // Imagem que aparece quando o autor compartilha o link (mostrada na aba "Divulgar meu perfil").
  const dadosPrevia = author.slug ? await carregarDadosPrevia(author.slug) : null;
  const previaUrl = dadosPrevia ? urlPrevia(dadosPrevia) : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

  // Agenda da Bienal Rio 2027: só o Premium+ tem essa aba.
  let bienal: DadosBienalPainel | null = null;
  if (author.plano === PLANO_PREMIUM_PLUS) {
    const [ocupacao, reserva] = await Promise.all([
      carregarOcupacao({ ignorarAutorId: author.id }),
      prisma.reservaBienalPremiumPlus.findUnique({ where: { authorId: author.id } }),
    ]);
    bienal = {
      ocupacao,
      reserva: reserva ? horariosDasReservas([{ tipo: "balcao", dia: reserva.dia, horaInicio: reserva.horaInicio }])[0] : null,
      podeEscolher: premiumPlusPodeEscolher(),
    };
  }

  return (
    <PainelApp
      bienal={bienal}
      pedidosImpressao={pedidosImpressao.map((p) => ({
        id: p.id,
        numero: p.numero,
        titulo: p.titulo,
        tiragem: p.tiragem,
        status: p.status,
        enviadoEm: p.createdAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
      }))}
      author={author}
      temSenha={temSenha}
      mercadoPagoStatus={mercadopago}
      siteUrl={siteUrl}
      previaUrl={previaUrl}
      maxVisualizacoesGlobal={visualizacoesAgg._max.visualizacoes ?? 0}
    />
  );
}
