"use client";

import { useState } from "react";
import Link from "next/link";
import Lightbox from "./Lightbox";
import AvaliacaoForm from "./AvaliacaoForm";
import { podeUsarRecursosExtras } from "@/lib/plans";
import { formatEventoDia } from "@/lib/format";

type Tab = "livros" | "galeria" | "eventos" | "avaliacoes";

const CATEGORIAS_GALERIA = ["Bienais e Feiras", "Lançamentos", "Palestras e Workshops", "Encontros de Autores", "Eventos Culturais", "Outros"];

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
  authorId,
  books,
  fotos,
  eventos,
  avaliacoes,
  autorPlano,
  isOwner,
}: {
  authorId: string;
  books: BookItem[];
  fotos: { id: string; url: string; titulo: string; categoria: string }[];
  eventos: { id: string; nome: string; diaInicio: number; diaFim: number | null; mes: string; ano: number; local: string; status: string }[];
  avaliacoes: { id: string; nome: string; texto: string; estrelas: number }[];
  autorPlano: string;
  isOwner: boolean;
}) {
  const [tab, setTab] = useState<Tab>("livros");
  const [galeriaIndex, setGaleriaIndex] = useState<number | null>(null);
  const [fotoCategoria, setFotoCategoria] = useState<string | null>(null);
  const podeExtras = podeUsarRecursosExtras(autorPlano);

  const fotosFiltradas = fotoCategoria ? fotos.filter((f) => f.categoria === fotoCategoria) : fotos;

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
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
              {books.slice(0, 4).map((b) => (
                <div
                  key={b.id}
                  style={{
                    aspectRatio: "3/4",
                    borderRadius: "4px",
                    backgroundColor: b.capaUrl ? "#F6F6F6" : "#E0E0E0",
                    backgroundImage: b.capaUrl ? `url(${b.capaUrl})` : undefined,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />
              ))}
            </div>
            <Link
              href={`/loja/${authorId}`}
              style={{ display: "inline-block", alignSelf: "flex-start", background: "#009B3A", color: "white", padding: "12px 24px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", textDecoration: "none" }}
            >
              Ver loja completa ({books.length} {books.length === 1 ? "livro" : "livros"}) →
            </Link>
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
          <>
            <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap", fontSize: "13px" }}>
              <button onClick={() => setFotoCategoria(null)} style={tabStyle(fotoCategoria === null)}>Todas</button>
              {CATEGORIAS_GALERIA.filter((c) => fotos.some((f) => f.categoria === c)).map((c) => (
                <button key={c} onClick={() => setFotoCategoria(c)} style={tabStyle(fotoCategoria === c)}>
                  {c}
                </button>
              ))}
            </div>
            {fotosFiltradas.length > 0 ? (
              <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
                {fotosFiltradas.map((f, i) => (
                  <div
                    key={f.id}
                    title={f.titulo}
                    onClick={() => setGaleriaIndex(i)}
                    style={{ position: "relative", background: `center / cover no-repeat url(${f.url})`, aspectRatio: "1", borderRadius: "4px", cursor: "pointer", overflow: "hidden" }}
                  >
                    {f.titulo && (
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: 0,
                          padding: "20px 10px 8px",
                          background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))",
                          color: "white",
                          fontSize: "12px",
                          fontWeight: 600,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {f.titulo}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "14px", color: "#666" }}>Nenhuma foto nessa categoria.</p>
            )}
          </>
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
        ) : (
          <>
            {!isOwner && <AvaliacaoForm authorId={authorId} />}
            {avaliacoes.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {avaliacoes.map((rv) => (
                  <div key={rv.id} style={{ borderBottom: "1px solid #E0E0E0", paddingBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "6px" }}>
                      <div style={{ width: "36px", height: "36px", background: "#E0E0E0", borderRadius: "50%" }} />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "13px" }}>{rv.nome}</div>
                        <div style={{ fontSize: "12px", color: "#FFB800" }}>{"★".repeat(rv.estrelas)}{"☆".repeat(5 - rv.estrelas)}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6 }}>{rv.texto}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não recebeu avaliações.</p>
            )}
          </>
        ))}

      {galeriaIndex !== null && (
        <Lightbox
          fotos={fotosFiltradas.map((f) => ({ url: f.url, titulo: f.titulo }))}
          index={galeriaIndex}
          onClose={() => setGaleriaIndex(null)}
          onNavigate={setGaleriaIndex}
        />
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
