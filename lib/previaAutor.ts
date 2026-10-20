import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";

// Dados que entram na imagem de prévia do perfil (a que aparece quando o link é colado no
// WhatsApp, Instagram, Facebook etc.).
export type DadosPrevia = {
  nome: string;
  slug: string;
  fotoUrl: string | null;
  capas: string[];
  totalLivros: number;
};

const MAX_CAPAS = 3;

export async function carregarDadosPrevia(slug: string): Promise<DadosPrevia | null> {
  const author = await prisma.author.findUnique({
    where: { slug },
    select: {
      nome: true,
      slug: true,
      fotoUrl: true,
      status: true,
      books: {
        select: { capaUrl: true },
        where: { capaUrl: { not: null } },
        orderBy: { createdAt: "desc" },
        take: MAX_CAPAS,
      },
      _count: { select: { books: true } },
    },
  });
  if (!author || !author.slug || author.status === "suspenso") return null;

  return {
    nome: author.nome,
    slug: author.slug,
    fotoUrl: author.fotoUrl,
    capas: author.books.flatMap((b) => (b.capaUrl ? [b.capaUrl] : [])),
    totalLivros: author._count.books,
  };
}

/**
 * Identificador curto do conteúdo da imagem. Vai na URL (?v=...): o WhatsApp e cia. guardam a
 * prévia por endereço, então quando o autor troca a foto, uma capa ou o nome, a URL muda e eles
 * buscam a imagem nova. Também deixa a imagem em cache "pra sempre" sem ficar desatualizada.
 */
export function versaoPrevia(dados: DadosPrevia): string {
  const base = [dados.nome, dados.fotoUrl ?? "", dados.capas.join(","), String(dados.totalLivros)].join("|");
  return createHash("sha1").update(base).digest("hex").slice(0, 10);
}

export function urlPrevia(dados: DadosPrevia): string {
  return `/autor/${dados.slug}/previa?v=${versaoPrevia(dados)}`;
}
