"use client";

import { useState } from "react";
import Link from "next/link";

type Artigo = {
  id: string;
  titulo: string;
  resumo: string;
  categoria: string;
  autorNome: string;
  capaUrl: string | null;
};

export default function BlogCarousel({ artigos }: { artigos: Artigo[] }) {
  const [index, setIndex] = useState(0);

  if (artigos.length === 0) {
    return (
      <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ fontSize: "16px", color: "#666" }}>Ainda não há artigos publicados no blog.</p>
      </div>
    );
  }

  const prev = () => setIndex((i) => (i - 1 + artigos.length) % artigos.length);
  const next = () => setIndex((i) => (i + 1) % artigos.length);
  const artigo = artigos[index];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {artigos.length > 1 && (
          <button
            onClick={prev}
            aria-label="Artigo anterior"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "40px", height: "40px", flexShrink: 0, fontSize: "18px", color: "#002776" }}
          >
            ‹
          </button>
        )}
        <Link
          href={`/blog/${artigo.id}`}
          className="responsive-flex-row"
          style={{ flex: 1, display: "flex", gap: "32px", alignItems: "center", background: "#F6F6F6", borderRadius: "8px", padding: "24px", color: "inherit" }}
        >
          <div
            className="flex-fixed-basis"
            style={{
              flex: "0 0 280px",
              aspectRatio: "1",
              borderRadius: "8px",
              background: artigo.capaUrl ? `center / cover no-repeat url(${artigo.capaUrl})` : "#E0E0E0",
            }}
          />
          <div>
            <div style={{ display: "inline-block", background: "#002776", color: "white", padding: "4px 12px", borderRadius: "4px", fontSize: "11px", fontWeight: 600, marginBottom: "12px" }}>
              {artigo.categoria}
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: "12px", fontSize: "20px", color: "#262626" }}>{artigo.titulo}</h3>
            <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "16px" }}>{artigo.resumo}</p>
            <div style={{ fontSize: "13px", color: "#999" }}>{artigo.autorNome}</div>
          </div>
        </Link>
        {artigos.length > 1 && (
          <button
            onClick={next}
            aria-label="Próximo artigo"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "40px", height: "40px", flexShrink: 0, fontSize: "18px", color: "#002776" }}
          >
            ›
          </button>
        )}
      </div>
      {artigos.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "20px" }}>
          {artigos.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setIndex(i)}
              aria-label={`Ir para o artigo ${i + 1}`}
              style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === index ? "#002776" : "#DDD", padding: 0 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
