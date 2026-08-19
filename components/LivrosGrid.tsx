"use client";

import { useState } from "react";
import AddToCartButton from "./AddToCartButton";

export type LivroItem = {
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

export default function LivrosGrid({ books, podeVender }: { books: LivroItem[]; podeVender: boolean }) {
  const [sinopseBook, setSinopseBook] = useState<LivroItem | null>(null);

  if (books.length === 0) {
    return <p style={{ fontSize: "14px", color: "#666" }}>Este(a) autor(a) ainda não colocou livros à venda.</p>;
  }

  return (
    <>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
        {books.map((b) => (
          <div key={b.id} style={{ background: "#F6F6F6", padding: "12px", borderRadius: "4px", textAlign: "center" }}>
            <div
              style={{
                aspectRatio: "3/4",
                marginBottom: "8px",
                borderRadius: "4px",
                backgroundColor: b.capaUrl ? "#F6F6F6" : "#E0E0E0",
                backgroundImage: b.capaUrl ? `url(${b.capaUrl})` : undefined,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
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
