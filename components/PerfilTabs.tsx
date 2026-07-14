"use client";

import { useState } from "react";
import Link from "next/link";

type Tab = "livros" | "galeria" | "eventos" | "avaliacoes";

export default function PerfilTabs({
  books,
  fotos,
  eventos,
  avaliacoes,
}: {
  books: { id: string; titulo: string; genero: string; capaUrl: string | null; preco: string }[];
  fotos: { id: string; url: string; titulo: string }[];
  eventos: { id: string; nome: string; dia: number; mes: string; local: string; status: string }[];
  avaliacoes: { id: string; nome: string; texto: string }[];
}) {
  const [tab, setTab] = useState<Tab>("livros");

  const tabStyle = (active: boolean): React.CSSProperties => ({
    background: "white",
    padding: 0,
    fontWeight: active ? 600 : 500,
    color: active ? "#009B3A" : "#666",
    fontSize: "14px",
  });

  return (
    <>
      <div style={{ display: "flex", gap: "24px", borderBottom: "2px solid #DDD", paddingBottom: "16px", marginBottom: "24px" }}>
        <button onClick={() => setTab("livros")} style={tabStyle(tab === "livros")}>📚 Livros</button>
        <button onClick={() => setTab("galeria")} style={tabStyle(tab === "galeria")}>🖼️ Galeria</button>
        <button onClick={() => setTab("eventos")} style={tabStyle(tab === "eventos")}>🎤 Agenda</button>
        <button onClick={() => setTab("avaliacoes")} style={tabStyle(tab === "avaliacoes")}>⭐ Avaliações</button>
      </div>

      {tab === "livros" &&
        (books.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
            {books.map((b) => (
              <div key={b.id} style={{ background: "#F6F6F6", padding: "12px", borderRadius: "4px", textAlign: "center" }}>
                <div
                  style={{
                    aspectRatio: "3/4",
                    marginBottom: "8px",
                    borderRadius: "4px",
                    background: b.capaUrl ? `center / cover no-repeat url(${b.capaUrl})` : "#E0E0E0",
                  }}
                />
                <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>{b.titulo}</div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>{b.genero}</div>
                <div style={{ color: "#009B3A", fontWeight: 700, marginBottom: "10px" }}>{b.preco}</div>
                <Link href="/livros" style={{ display: "block", background: "#002776", color: "white", padding: "8px", fontSize: "12px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
                  Ver detalhes
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não colocou livros à venda.</p>
        ))}

      {tab === "galeria" &&
        (fotos.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            {fotos.map((f) => (
              <div key={f.id} title={f.titulo} style={{ background: `center / cover no-repeat url(${f.url})`, aspectRatio: "1", borderRadius: "4px" }} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não adicionou fotos à galeria.</p>
        ))}

      {tab === "eventos" &&
        (eventos.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {eventos.map((ev) => (
              <div key={ev.id} style={{ display: "flex", gap: "16px", alignItems: "center", background: "#F6F6F6", borderRadius: "8px", padding: "16px" }}>
                <div style={{ background: "white", border: "1px solid #E0E0E0", borderRadius: "6px", padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#C0392B" }}>{ev.dia}</div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>{ev.mes}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{ev.nome}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>📍 {ev.local}</div>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 700, padding: "4px 10px", borderRadius: "12px", background: "#E3F4E9", color: "#009B3A" }}>{ev.status}</span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não tem eventos agendados.</p>
        ))}

      {tab === "avaliacoes" &&
        (avaliacoes.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {avaliacoes.map((rv) => (
              <div key={rv.id} style={{ borderBottom: "1px solid #E0E0E0", paddingBottom: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "6px" }}>
                  <div style={{ width: "36px", height: "36px", background: "#E0E0E0", borderRadius: "50%" }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>{rv.nome}</div>
                    <div style={{ fontSize: "12px", color: "#FFB800" }}>★★★★★</div>
                  </div>
                </div>
                <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6 }}>{rv.texto}</p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não recebeu avaliações.</p>
        ))}
    </>
  );
}
