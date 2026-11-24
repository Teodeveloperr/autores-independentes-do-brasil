import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import BlogCatalogo from "@/components/BlogCatalogo";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Blog" };

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
          {artigos.length > 0 ? (
            <BlogCatalogo artigos={artigos} />
          ) : (
            <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Nenhum artigo publicado ainda. Volte em breve!
            </div>
          )}
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
