import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import LivrosGrid from "@/components/LivrosGrid";
import { prisma } from "@/lib/db";
import { brl } from "@/lib/format";
import { podeVenderLivros } from "@/lib/plans";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const author = await prisma.author.findUnique({ where: { id } });
  return { title: author ? `Loja de ${author.nome}` : "Loja não encontrada" };
}

export default async function LojaAutorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await prisma.author.findUnique({
    where: { id },
    include: { books: { orderBy: { createdAt: "desc" } } },
  });

  if (!author || author.status === "suspenso") notFound();

  const podeVender = podeVenderLivros(author.plano);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="livros" />
      <section className="section-pad-lg" style={{ background: "white", padding: "40px", flex: 1 }}>
        <div style={{ maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }}>
          <div
            style={{
              height: "180px",
              borderRadius: "16px",
              marginBottom: "24px",
              backgroundColor: "#E0E0E0",
              backgroundImage: author.bannerUrl ? `url(${author.bannerUrl})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: `${author.bannerPositionX}% ${author.bannerPositionY}%`,
              backgroundRepeat: "no-repeat",
            }}
          />
          <div style={{ display: "flex", gap: "20px", alignItems: "center", marginBottom: "32px", flexWrap: "wrap" }}>
            <div
              style={{
                width: "88px",
                height: "88px",
                borderRadius: "50%",
                flexShrink: 0,
                background: author.fotoUrl ? `center / cover no-repeat url(${author.fotoUrl})` : "#E0E0E0",
                border: "3px solid white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#009B3A", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>
                Loja de
              </div>
              <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#262626" }}>{author.nome}</h1>
              <p style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                {author.generos.join(", ")} • {author.cidade}
              </p>
            </div>
            <Link
              href={`/perfil/${author.id}`}
              style={{ border: "1px solid #DDD", padding: "10px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "#002776", textDecoration: "none", flexShrink: 0 }}
            >
              Ver perfil completo →
            </Link>
          </div>

          {!podeVender ? (
            <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não colocou livros à venda.</p>
          ) : (
            <LivrosGrid
              books={author.books.map((b) => ({
                id: b.id,
                titulo: b.titulo,
                genero: b.genero,
                capaUrl: b.capaUrl,
                preco: brl(b.precoCentavos),
                precoCentavos: b.precoCentavos,
                descontoPercentual: b.descontoPercentual,
                descricao: b.descricao,
                authorId: author.id,
                autorNome: author.nome,
              }))}
              podeVender={podeVender}
            />
          )}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
