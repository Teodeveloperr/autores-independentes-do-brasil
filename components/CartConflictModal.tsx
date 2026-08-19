"use client";

import { useCart } from "./CartContext";

export default function CartConflictModal() {
  const { conflitoAutor, confirmarTrocaAutor, cancelarTrocaAutor } = useCart();

  if (!conflitoAutor) return null;

  return (
    <div
      onClick={cancelarTrocaAutor}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "white", borderRadius: "10px", padding: "28px", maxWidth: "420px", width: "100%" }}
      >
        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>
          Seu carrinho tem livros de outro autor
        </h3>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.6, marginBottom: "24px" }}>
          Cada compra só pode ter livros de um autor por vez, porque o pagamento vai direto pra conta de cada um. Seu
          carrinho atual tem livros de <strong>{conflitoAutor.autorAtual}</strong>. Deseja esvaziá-lo e adicionar este
          livro de <strong>{conflitoAutor.item.autorNome}</strong> no lugar?
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={cancelarTrocaAutor}
            style={{ flex: 1, background: "white", border: "1px solid #DDD", color: "#262626", padding: "12px", fontWeight: 600, borderRadius: "6px", fontSize: "14px" }}
          >
            Cancelar
          </button>
          <button
            onClick={confirmarTrocaAutor}
            style={{ flex: 1, background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", border: "none" }}
          >
            Esvaziar e adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
