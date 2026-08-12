"use client";

import { useState } from "react";
import AddToCartButton from "@/components/AddToCartButton";
import { brl } from "@/lib/format";
import { podeVenderLivros } from "@/lib/plans";
import { GENEROS } from "@/lib/genres";

export type LivroCatalogo = {
  id: string;
  titulo: string;
  genero: string;
  precoCentavos: number;
  capaUrl: string | null;
  authorId: string;
  author: { nome: string; plano: string };
};

const FILTROS_VAZIOS = { busca: "", genero: "", autor: "", precoMin: "", precoMax: "" };

export default function LivrosCatalogo({ books }: { books: LivroCatalogo[] }) {
  const autores = Array.from(new Set(books.map((b) => b.author.nome))).sort((a, b) => a.localeCompare(b));

  const [busca, setBusca] = useState("");
  const [genero, setGenero] = useState("");
  const [autor, setAutor] = useState("");
  const [precoMin, setPrecoMin] = useState("");
  const [precoMax, setPrecoMax] = useState("");
  const [filtros, setFiltros] = useState(FILTROS_VAZIOS);

  function aplicarFiltros() {
    setFiltros({ busca, genero, autor, precoMin, precoMax });
  }

  function limparFiltros() {
    setBusca("");
    setGenero("");
    setAutor("");
    setPrecoMin("");
    setPrecoMax("");
    setFiltros(FILTROS_VAZIOS);
  }

  const min = parseFloat(filtros.precoMin);
  const max = parseFloat(filtros.precoMax);
  const termo = filtros.busca.trim().toLowerCase();

  const livrosFiltrados = books.filter((b) => {
    if (filtros.genero && b.genero !== filtros.genero) return false;
    if (filtros.autor && b.author.nome !== filtros.autor) return false;
    if (!Number.isNaN(min) && b.precoCentavos / 100 < min) return false;
    if (!Number.isNaN(max) && b.precoCentavos / 100 > max) return false;
    if (termo && !b.titulo.toLowerCase().includes(termo) && !b.author.nome.toLowerCase().includes(termo)) return false;
    return true;
  });

  return (
    <div className="responsive-flex-row" style={{ display: "flex", gap: "24px" }}>
      <div className="flex-fixed-basis" style={{ flex: "0 0 200px" }}>
        <div style={{ fontWeight: 700, marginBottom: "16px" }}>Filtros</div>
        <div onClick={limparFiltros} style={{ color: "#009B3A", fontSize: "14px", marginBottom: "24px", cursor: "pointer" }}>
          Limpar filtros
        </div>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontWeight: 600, marginBottom: "12px" }}>Buscar livro</div>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Título, autor ou palavra-chave..."
            style={{ width: "100%", padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}
          />
        </div>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontWeight: 600, marginBottom: "12px" }}>Gênero literário</div>
          <select
            value={genero}
            onChange={(e) => setGenero(e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}
          >
            <option value="">Selecionar gênero</option>
            {GENEROS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontWeight: 600, marginBottom: "12px" }}>Formato</div>
          <label style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px" }}>
            <input type="checkbox" defaultChecked disabled /> Físico
          </label>
          <label style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px" }}>
            <input type="checkbox" disabled /> E-book
          </label>
          <label style={{ display: "flex", gap: "8px", fontSize: "14px" }}>
            <input type="checkbox" disabled /> Áudio livro
          </label>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontWeight: 600, marginBottom: "12px" }}>Faixa de preço</div>
          <div style={{ display: "flex", gap: "8px", fontSize: "12px", marginBottom: "8px" }}>
            <input
              type="number"
              min={0}
              value={precoMin}
              onChange={(e) => setPrecoMin(e.target.value)}
              placeholder="R$ 0,00"
              style={{ flex: 1, padding: "8px", border: "1px solid #DDD", borderRadius: "4px" }}
            />
            <input
              type="number"
              min={0}
              value={precoMax}
              onChange={(e) => setPrecoMax(e.target.value)}
              placeholder="R$ 200,00"
              style={{ flex: 1, padding: "8px", border: "1px solid #DDD", borderRadius: "4px" }}
            />
          </div>
        </div>
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontWeight: 600, marginBottom: "12px" }}>Autor</div>
          <select
            value={autor}
            onChange={(e) => setAutor(e.target.value)}
            style={{ width: "100%", padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}
          >
            <option value="">Selecionar autor</option>
            {autores.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={aplicarFiltros}
          style={{ background: "#002776", color: "white", padding: "10px", width: "100%", fontWeight: 600, borderRadius: "4px" }}
        >
          Aplicar filtros
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ color: "#262626" }}>
            {livrosFiltrados.length} livro{livrosFiltrados.length === 1 ? "" : "s"} encontrado{livrosFiltrados.length === 1 ? "" : "s"}
          </div>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <select style={{ padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}>
              <option>Mais recentes</option>
            </select>
            <button style={{ background: "#002776", color: "white", padding: "8px 16px", borderRadius: "4px" }}>⊞⊞</button>
            <button style={{ background: "white", border: "1px solid #DDD", padding: "8px 16px", borderRadius: "4px" }}>≡</button>
          </div>
        </div>
        {livrosFiltrados.length > 0 ? (
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
            {livrosFiltrados.map((b) => (
              <div key={b.id} style={{ textAlign: "center" }}>
                <div
                  style={{
                    backgroundColor: b.capaUrl ? "#F6F6F6" : "#E0E0E0",
                    backgroundImage: b.capaUrl ? `url(${b.capaUrl})` : undefined,
                    backgroundSize: "contain",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    aspectRatio: "3/4",
                    borderRadius: "4px",
                    marginBottom: "12px",
                  }}
                />
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>{b.titulo}</div>
                <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>{b.author.nome}</div>
                <div style={{ color: "#009B3A", fontWeight: 700, marginBottom: "12px" }}>{brl(b.precoCentavos)}</div>
                {podeVenderLivros(b.author.plano) ? (
                  <AddToCartButton
                    book={{
                      bookId: b.id,
                      authorId: b.authorId,
                      titulo: b.titulo,
                      autorNome: b.author.nome,
                      precoCentavos: b.precoCentavos,
                      capaUrl: b.capaUrl,
                    }}
                  />
                ) : (
                  <div style={{ background: "#F0F0F0", color: "#999", padding: "8px", fontSize: "13px", fontWeight: 600, width: "100%", borderRadius: "4px" }}>
                    Venda indisponível
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px 40px", textAlign: "center", color: "#666", fontSize: "14px" }}>
            {books.length === 0 ? "Nenhum livro publicado ainda. Volte em breve!" : "Nenhum livro encontrado com esses filtros."}
          </div>
        )}
      </div>
    </div>
  );
}
