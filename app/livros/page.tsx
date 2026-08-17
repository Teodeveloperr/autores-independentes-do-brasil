import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import LivrosCatalogo from "@/components/LivrosCatalogo";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Livros" };

export default async function LivrosPage() {
  const books = await prisma.book.findMany({
    where: { author: { status: "ativo" } },
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });

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
          <LivrosCatalogo books={books} />
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
