import type { Metadata } from "next";
import { requireAuthor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { garantirSlug } from "@/lib/autorSlug";
import { carregarDadosPrevia, urlPrevia } from "@/lib/previaAutor";
import PainelApp from "@/components/painel/PainelApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Meu Painel" };

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ mercadopago?: string }> }) {
  const authorSession = await requireAuthor();
  const { mercadopago } = await searchParams;

  // Quem entra no painel já precisa ter o endereço amigável do perfil (aba "Divulgar meu perfil").
  await garantirSlug(authorSession.id);

  const [author, visualizacoesAgg] = await Promise.all([
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
  ]);

  const temSenha = authorSession.senhaHash != null;
  // Imagem que aparece quando o autor compartilha o link (mostrada na aba "Divulgar meu perfil").
  const dadosPrevia = author.slug ? await carregarDadosPrevia(author.slug) : null;
  const previaUrl = dadosPrevia ? urlPrevia(dadosPrevia) : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

  return (
    <PainelApp
      author={author}
      temSenha={temSenha}
      mercadoPagoStatus={mercadopago}
      siteUrl={siteUrl}
      previaUrl={previaUrl}
      maxVisualizacoesGlobal={visualizacoesAgg._max.visualizacoes ?? 0}
    />
  );
}
