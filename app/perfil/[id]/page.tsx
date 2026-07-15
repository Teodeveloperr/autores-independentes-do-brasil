import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PerfilTabs from "@/components/PerfilTabs";
import { prisma } from "@/lib/db";
import { brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const author = await prisma.author.findUnique({ where: { id } });
  return { title: author ? author.nome : "Perfil não encontrado" };
}

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const author = await prisma.author.findUnique({
    where: { id },
    include: {
      books: { orderBy: { createdAt: "desc" } },
      eventos: { orderBy: { createdAt: "desc" } },
      fotos: { orderBy: { createdAt: "desc" } },
      avaliacoes: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!author) notFound();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="autores" />
      <section style={{ background: "white", padding: "40px", flex: 1 }}>
        <div
          style={{
            height: "260px",
            borderRadius: "8px",
            marginBottom: "32px",
            position: "relative",
            maxWidth: "1200px",
            marginLeft: "auto",
            marginRight: "auto",
            background: author.bannerUrl ? `center / cover no-repeat url(${author.bannerUrl})` : "#E0E0E0",
          }}
        >
          {author.verificado && (
            <div style={{ position: "absolute", top: "16px", left: "16px", background: "white", padding: "8px 16px", borderRadius: "4px", fontSize: "14px", fontWeight: 600 }}>
              ✓ Autor verificado
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: "32px", marginBottom: "40px", maxWidth: "1200px", marginLeft: "auto", marginRight: "auto" }}>
          <div style={{ flex: "0 0 200px" }}>
            <div
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "8px",
                marginBottom: "16px",
                background: author.fotoUrl ? `center / cover no-repeat url(${author.fotoUrl})` : "#E0E0E0",
              }}
            />
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#262626", marginBottom: "8px" }}>{author.nome}</h1>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
              Escritor(a) • {author.genero} • {author.cidade}
            </p>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px", marginTop: "12px" }}>
              <a href="#" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", background: "#F6F6F6", borderRadius: "4px" }}>📷</a>
              <a href="#" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", background: "#F6F6F6", borderRadius: "4px" }}>🐦</a>
              <a href="#" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", background: "#F6F6F6", borderRadius: "4px" }}>🔗</a>
            </div>
            <button style={{ background: "white", border: "2px solid #262626", color: "#262626", padding: "10px", width: "100%", fontWeight: 600, borderRadius: "4px", marginBottom: "12px" }}>
              Compartilhar perfil
            </button>
            <button style={{ background: "#009B3A", color: "white", padding: "10px", width: "100%", fontWeight: 600, borderRadius: "4px" }}>
              💬 Enviar mensagem
            </button>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, marginBottom: "24px", maxWidth: "640px" }}>{author.bio}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px", marginBottom: "40px" }}>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#009B3A" }}>{author.avaliacaoMedia?.toFixed(1) ?? "—"}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>({author.avaliacoesQtd} avaliações)</div>
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#002776" }}>{author.books.length}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Livros</div>
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#002776" }}>Desde {author.anoEntrada}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>no coletivo</div>
              </div>
              <div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: "#002776" }}>{author.seguidores}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>seguidores</div>
              </div>
            </div>
            <PerfilTabs
              books={author.books.map((b) => ({ id: b.id, titulo: b.titulo, genero: b.genero, capaUrl: b.capaUrl, preco: brl(b.precoCentavos) }))}
              fotos={author.fotos.map((f) => ({ id: f.id, url: f.url, titulo: f.titulo }))}
              eventos={author.eventos.map((e) => ({ id: e.id, nome: e.nome, dia: e.dia, mes: e.mes, local: e.local, status: e.status }))}
              avaliacoes={author.avaliacoes.map((r) => ({ id: r.id, nome: r.nome, texto: r.texto }))}
            />
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
