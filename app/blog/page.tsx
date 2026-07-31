import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Blog" };

function formatArticleDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function BlogPage() {
  const artigos = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="blog" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Blog</h1>
        <p style={{ fontSize: "16px", marginBottom: "40px" }}>
          Conteúdos, reflexões e histórias que inspiram a literatura independente.
        </p>
        <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px" }}>
          <div style={{ display: "flex", gap: "24px", marginBottom: "24px", borderBottom: "2px solid #DDD", paddingBottom: "16px", fontSize: "13px", flexWrap: "wrap" }}>
            <button style={{ background: "white", padding: 0, fontWeight: 600, color: "#002776" }}>📝 Todos os posts</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>✏️ Artigos</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>📖 Entrevistas</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>💡 Dicas</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>🎓 Mercado</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>👑 Autores</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>📰 Notícias</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>🎯 Eventos</button>
          </div>
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px" }}>
            {artigos.length > 0 ? (
              <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", alignContent: "start" }}>
                {artigos.map((a) => (
                  <Link key={a.id} href={`/blog/${a.id}`} style={{ background: "#F6F6F6", borderRadius: "8px", overflow: "hidden", color: "inherit", display: "block" }}>
                    <div style={{ background: a.capaUrl ? `center / cover no-repeat url(${a.capaUrl})` : "#E0E0E0", aspectRatio: "1", marginBottom: "16px" }} />
                    <div style={{ padding: "16px" }}>
                      <div style={{ display: "inline-block", background: "#002776", color: "white", padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, marginBottom: "12px" }}>
                        {a.categoria}
                      </div>
                      <h3 style={{ fontWeight: 700, marginBottom: "8px", fontSize: "14px" }}>{a.titulo}</h3>
                      <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "12px" }}>{a.resumo}</p>
                      <div style={{ display: "flex", gap: "8px", fontSize: "12px", color: "#999" }}>
                        <span>{a.autorNome}</span>
                        <span>{formatArticleDate(a.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                Nenhum artigo publicado ainda. Volte em breve!
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, marginBottom: "16px" }}>Categorias</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                <a href="#" style={{ color: "#262626" }}>Artigos <span style={{ float: "right", color: "#999" }}>34</span></a>
                <a href="#" style={{ color: "#262626" }}>Entrevistas <span style={{ float: "right", color: "#999" }}>19</span></a>
                <a href="#" style={{ color: "#262626" }}>Dicas de Escrita <span style={{ float: "right", color: "#999" }}>16</span></a>
                <a href="#" style={{ color: "#262626" }}>Mercado Editorial <span style={{ float: "right", color: "#999" }}>14</span></a>
                <a href="#" style={{ color: "#262626" }}>Histórias de Autores <span style={{ float: "right", color: "#999" }}>23</span></a>
                <a href="#" style={{ color: "#262626" }}>Notícias <span style={{ float: "right", color: "#999" }}>20</span></a>
                <a href="#" style={{ color: "#262626" }}>Eventos <span style={{ float: "right", color: "#999" }}>12</span></a>
                <a href="#">Ver todas as categorias →</a>
              </div>
              <div style={{ marginTop: "32px" }}>
                <div style={{ fontWeight: 700, marginBottom: "16px" }}>Receba novidades do blog</div>
                <input type="email" placeholder="Seu e-mail" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "4px", marginBottom: "12px", fontSize: "14px" }} />
                <button style={{ background: "#002776", color: "white", padding: "10px", width: "100%", fontWeight: 600, borderRadius: "4px" }}>Assinar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
