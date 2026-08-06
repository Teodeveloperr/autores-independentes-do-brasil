import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatArticleDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const artigo = await prisma.article.findUnique({ where: { id } });
  return { title: artigo ? artigo.titulo : "Artigo não encontrado" };
}

export default async function ArtigoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artigo = await prisma.article.findUnique({ where: { id } });

  if (!artigo) notFound();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="blog" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
        <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          <Link href="/blog" style={{ color: "white", fontSize: "13px", fontWeight: 600, display: "inline-block", marginBottom: "24px" }}>
            ← Voltar ao blog
          </Link>
          <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "40px", borderRadius: "8px", maxWidth: "820px", margin: "0 auto" }}>
            {artigo.capaUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- exibida na proporção original, sem corte (imagens de capa têm proporções variadas)
              <img
                src={artigo.capaUrl}
                alt={artigo.titulo}
                style={{ width: "100%", height: "auto", display: "block", borderRadius: "8px", marginBottom: "24px" }}
              />
            )}
            <div style={{ display: "inline-block", background: "#002776", color: "white", padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, marginBottom: "16px" }}>
              {artigo.categoria}
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "12px" }}>{artigo.titulo}</h1>
            <div style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#999", marginBottom: "24px" }}>
              <span>{artigo.autorNome}</span>
              <span>•</span>
              <span>{formatArticleDate(artigo.createdAt)}</span>
            </div>
            <p style={{ fontSize: "15px", color: "#444", lineHeight: 1.6, marginBottom: "24px", fontWeight: 600 }}>{artigo.resumo}</p>
            <div style={{ fontSize: "15px", color: "#262626", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{artigo.conteudo}</div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
