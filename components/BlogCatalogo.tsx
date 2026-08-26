"use client";

import { useState } from "react";
import Link from "next/link";

export type ArtigoResumo = {
  id: string;
  titulo: string;
  resumo: string;
  categoria: string;
  autorNome: string;
  capaUrl: string | null;
  createdAt: Date;
};

const CATEGORIAS: { label: string; emoji: string }[] = [
  { label: "Para Autores", emoji: "✍️" },
  { label: "Mercado Literário", emoji: "📈" },
  { label: "Para Leitores", emoji: "📚" },
  { label: "Histórias", emoji: "📖" },
];

function formatArticleDate(date: Date) {
  return date.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
}

export default function BlogCatalogo({ artigos }: { artigos: ArtigoResumo[] }) {
  const [categoria, setCategoria] = useState<string | null>(null);

  const contagemPorCategoria = CATEGORIAS.map((c) => ({
    ...c,
    total: artigos.filter((a) => a.categoria === c.label).length,
  }));

  const artigosFiltrados = categoria ? artigos.filter((a) => a.categoria === categoria) : artigos;

  const tabStyle = (ativo: boolean): React.CSSProperties => ({
    background: "white",
    padding: 0,
    fontWeight: ativo ? 600 : 400,
    color: ativo ? "#002776" : "#666",
  });

  return (
    <>
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px", borderBottom: "2px solid #DDD", paddingBottom: "16px", fontSize: "13px", flexWrap: "wrap" }}>
        <button onClick={() => setCategoria(null)} style={tabStyle(categoria === null)}>📝 Todos os posts</button>
        {CATEGORIAS.map((c) => (
          <button key={c.label} onClick={() => setCategoria(c.label)} style={tabStyle(categoria === c.label)}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px" }}>
        {artigosFiltrados.length > 0 ? (
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px", alignContent: "start" }}>
            {artigosFiltrados.map((a) => (
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
            Nenhum artigo encontrado nessa categoria.
          </div>
        )}
        <div>
          <div style={{ fontWeight: 700, marginBottom: "16px" }}>Categorias</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
            {contagemPorCategoria.map((c) => (
              <button
                key={c.label}
                onClick={() => setCategoria(categoria === c.label ? null : c.label)}
                style={{ background: "white", padding: 0, textAlign: "left", color: categoria === c.label ? "#002776" : "#262626", fontWeight: categoria === c.label ? 700 : 400 }}
              >
                {c.label} <span style={{ float: "right", color: "#999" }}>{c.total}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
