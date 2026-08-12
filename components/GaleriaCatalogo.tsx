"use client";

import { useState } from "react";
import GaleriaGrid from "./GaleriaGrid";

export type FotoCatalogo = { id: string; url: string; titulo: string; categoria: string };

const CATEGORIAS: { label: string; valor: string | null }[] = [
  { label: "📸 Todas as fotos", valor: null },
  { label: "📅 Bienais", valor: "Bienais e Feiras" },
  { label: "🎤 Lançamentos", valor: "Lançamentos de Livros" },
  { label: "🎓 Palestras", valor: "Palestras e Workshops" },
  { label: "👥 Encontros", valor: "Encontros de Autores" },
  { label: "🎬 Eventos", valor: "Eventos Culturais" },
  { label: "⭐ Outros", valor: "Outros" },
];

export default function GaleriaCatalogo({ fotos }: { fotos: FotoCatalogo[] }) {
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const termo = busca.trim().toLowerCase();
  const fotosFiltradas = fotos.filter((f) => {
    if (categoria && f.categoria !== categoria) return false;
    if (termo && !f.titulo.toLowerCase().includes(termo)) return false;
    return true;
  });

  return (
    <div>
      <div style={{ display: "flex", gap: "24px", marginBottom: "24px", borderBottom: "2px solid #DDD", paddingBottom: "16px", fontSize: "13px", flexWrap: "wrap" }}>
        {CATEGORIAS.map((c) => (
          <button
            key={c.label}
            onClick={() => setCategoria(c.valor)}
            style={{ background: "white", padding: 0, fontWeight: categoria === c.valor ? 600 : 400, color: categoria === c.valor ? "#009B3A" : "#666" }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ color: "#262626" }}>
          {fotosFiltradas.length} foto{fotosFiltradas.length === 1 ? "" : "s"} encontrada{fotosFiltradas.length === 1 ? "" : "s"}
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar fotos..."
            style={{ padding: "8px 16px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}
          />
          <select style={{ padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}>
            <option>Mais recentes</option>
          </select>
        </div>
      </div>
      {fotosFiltradas.length > 0 ? (
        <GaleriaGrid fotos={fotosFiltradas} />
      ) : (
        <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#666", fontSize: "14px" }}>
          Nenhuma foto encontrada com esses filtros.
        </div>
      )}
    </div>
  );
}
