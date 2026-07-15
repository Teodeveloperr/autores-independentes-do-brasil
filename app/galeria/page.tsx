import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Galeria" };

export default async function GaleriaPage() {
  const fotos = await prisma.collectiveGalleryPhoto.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="galeria" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Galeria</h1>
        <p style={{ fontSize: "16px", marginBottom: "40px" }}>
          Momentos que celebram a literatura, os autores independentes e o poder das palavras.
        </p>
        <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px" }}>
          <div style={{ display: "flex", gap: "24px", marginBottom: "24px", borderBottom: "2px solid #DDD", paddingBottom: "16px", fontSize: "13px", flexWrap: "wrap" }}>
            <button style={{ background: "white", padding: 0, fontWeight: 600, color: "#009B3A" }}>📸 Todas as fotos</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>📅 Bienais</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>🎤 Lançamentos</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>🎓 Palestras</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>👥 Encontros</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>🎬 Eventos</button>
            <button style={{ background: "white", padding: 0, color: "#666" }}>⭐ Outros</button>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
            <div style={{ color: "#262626" }}>{fotos.length} foto{fotos.length === 1 ? "" : "s"} encontrada{fotos.length === 1 ? "" : "s"}</div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <input type="text" placeholder="Buscar fotos..." style={{ padding: "8px 16px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }} />
              <select style={{ padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}>
                <option>Mais recentes</option>
              </select>
              <button style={{ background: "#262626", color: "white", padding: "8px 16px", borderRadius: "4px", fontWeight: 600 }}>🔍 Filtros</button>
            </div>
          </div>
          {fotos.length > 0 ? (
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
              {fotos.map((f) => (
                <div
                  key={f.id}
                  title={f.titulo}
                  style={{ aspectRatio: "1", borderRadius: "4px", background: `center / cover no-repeat url(${f.url})` }}
                />
              ))}
            </div>
          ) : (
            <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Nenhuma foto cadastrada ainda. Volte em breve!
            </div>
          )}
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
