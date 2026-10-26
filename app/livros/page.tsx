import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import LivrosCatalogo from "@/components/LivrosCatalogo";
import { prisma } from "@/lib/db";
import { PLANO_RANK } from "@/lib/plans";
import { GENEROS } from "@/lib/genres";
import { LIVRO_VENDAVEL_WHERE } from "@/lib/ebook";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Livros" };

export default async function LivrosPage({ searchParams }: { searchParams: Promise<{ genero?: string }> }) {
  const { genero } = await searchParams;
  // Aceita /livros?genero=Terror (usado, por exemplo, pela faixa de Halloween da home).
  const generoInicial = genero && GENEROS.includes(genero) ? genero : "";
  const booksPool = await prisma.book.findMany({
    where: { author: { status: "ativo" }, ...LIVRO_VENDAVEL_WHERE },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });
  // Livros de autores Premium aparecem primeiro (destaque do plano); dentro do mesmo plano, mais recentes primeiro.
  const books = [...booksPool].sort(
    (a, b) => (PLANO_RANK[b.author.plano] ?? 0) - (PLANO_RANK[a.author.plano] ?? 0) || b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="livros" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Todos os livros</h1>
        <p style={{ fontSize: "16px", marginBottom: "40px" }}>
          Descubra obras incríveis de autores independentes de todos o Brasil.
        </p>
        <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px" }}>
          <LivrosCatalogo books={books} generoInicial={generoInicial} />
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
