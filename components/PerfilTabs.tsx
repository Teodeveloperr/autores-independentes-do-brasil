"use client";

import { useState } from "react";
import Link from "next/link";
import AddToCartButton from "./AddToCartButton";
import { podeVenderLivros, podeUsarRecursosExtras } from "@/lib/plans";
import { formatEventoDia } from "@/lib/format";

type Tab = "livros" | "galeria" | "eventos" | "avaliacoes";

type BookItem = {
  id: string;
  titulo: string;
  genero: string;
  capaUrl: string | null;
  preco: string;
  precoCentavos: number;
  descricao: string | null;
  authorId: string;
  autorNome: string;
};

export default function PerfilTabs({
  books,
  fotos,
  eventos,
  avaliacoes,
  autorPlano,
  isOwner,
}: {
  books: BookItem[];
  fotos: { id: string; url: string; titulo: string }[];
  eventos: { id: string; nome: string; diaInicio: number; diaFim: number | null; mes: string; ano: number; local: string; status: string }[];
  avaliacoes: { id: string; nome: string; texto: string }[];
  autorPlano: string;
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<Tab>("livros");
  const [sinopseBook, setSinopseBook] = useState<BookItem | null>(null);
  const podeVender = podeVenderLivros(autorPlano);
  const podeExtras = podeUsarRecursosExtras(autorPlano);

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
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
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
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => setSinopseBook(b)}
                    style={{ flex: 1, background: "white", border: "1px solid #002776", color: "#002776", padding: "8px", fontSize: "12px", fontWeight: 600, borderRadius: "4px" }}
                  >
                    Sinopse
                  </button>
                  {podeVender && (
                    <AddToCartButton
                      book={{
                        bookId: b.id,
                        authorId: b.authorId,
                        titulo: b.titulo,
                        autorNome: b.autorNome,
                        precoCentavos: b.precoCentavos,
                        capaUrl: b.capaUrl,
                      }}
                      style={{ flex: 1, width: "auto", padding: "8px", fontSize: "12px" }}
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não colocou livros à venda.</p>
        ))}

      {tab === "galeria" &&
        (!podeExtras ? (
          isOwner ? (
            <UpgradeNotice recurso="galeria de fotos" />
          ) : (
            <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não adicionou fotos à galeria.</p>
          )
        ) : fotos.length > 0 ? (
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            {fotos.map((f) => (
              <div key={f.id} title={f.titulo} style={{ background: `center / cover no-repeat url(${f.url})`, aspectRatio: "1", borderRadius: "4px" }} />
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não adicionou fotos à galeria.</p>
        ))}

      {tab === "eventos" &&
        (!podeExtras ? (
          isOwner ? (
            <UpgradeNotice recurso="agenda de eventos" />
          ) : (
            <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não tem eventos agendados.</p>
          )
        ) : eventos.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {eventos.map((ev) => (
              <div key={ev.id} style={{ display: "flex", gap: "16px", alignItems: "center", background: "#F6F6F6", borderRadius: "8px", padding: "16px" }}>
                <div style={{ background: "white", border: "1px solid #E0E0E0", borderRadius: "6px", padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#C0392B" }}>{formatEventoDia(ev.diaInicio, ev.diaFim)}</div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>{ev.mes} {ev.ano}</div>
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
        (!podeExtras ? (
          isOwner ? (
            <UpgradeNotice recurso="avaliações" />
          ) : (
            <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não recebeu avaliações.</p>
          )
        ) : avaliacoes.length > 0 ? (
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

      {sinopseBook && (
        <div
          onClick={() => setSinopseBook(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", borderRadius: "8px", padding: "28px", maxWidth: "480px", width: "100%", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#002776" }}>{sinopseBook.titulo}</h3>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>{sinopseBook.genero}</div>
              </div>
              <button
                onClick={() => setSinopseBook(null)}
                aria-label="Fechar"
                style={{ background: "#F6F6F6", border: "none", borderRadius: "50%", width: "28px", height: "28px", fontSize: "14px", color: "#666", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7 }}>
              {sinopseBook.descricao || "Este livro ainda não tem uma sinopse cadastrada."}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function UpgradeNotice({ recurso }: { recurso: string }) {
  return (
    <div style={{ textAlign: "center", background: "#F6F6F6", borderRadius: "8px", padding: "40px 24px" }}>
      <div style={{ fontSize: "28px", marginBottom: "12px" }}>✨</div>
      <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.6, maxWidth: "380px", margin: "0 auto 20px" }}>
        A {recurso} é um recurso premium. Faça upgrade do seu plano e desbloqueie todo o potencial do seu perfil.
      </p>
      <Link
        href="/assinatura"
        style={{ display: "inline-block", background: "#009B3A", color: "white", padding: "10px 24px", borderRadius: "6px", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}
      >
        Fazer upgrade do plano
      </Link>
    </div>
  );
}
