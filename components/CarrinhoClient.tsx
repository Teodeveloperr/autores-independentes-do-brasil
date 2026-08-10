"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { brl } from "@/lib/format";

export default function CarrinhoClient() {
  const { items, removeItem, updateQuantidade, totalCentavos } = useCart();

  if (items.length === 0) {
    return (
      <div className="section-pad-md" style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>Seu carrinho está vazio.</p>
        <Link href="/livros" style={{ display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px" }}>
          Ver livros disponíveis →
        </Link>
      </div>
    );
  }

  return (
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "40px", alignItems: "start" }}>
      <div style={{ background: "white", color: "#262626", borderRadius: "8px", overflow: "hidden" }}>
        {items.map((item) => (
          <div key={item.bookId} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "20px", borderBottom: "1px solid #F0F0F0", flexWrap: "wrap" }}>
            <div
              style={{
                width: "64px",
                height: "86px",
                borderRadius: "4px",
                flexShrink: 0,
                backgroundColor: item.capaUrl ? "#F6F6F6" : "#E0E0E0",
                backgroundImage: item.capaUrl ? `url(${item.capaUrl})` : undefined,
                backgroundSize: "contain",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            />
            <div style={{ flex: 1, minWidth: "160px" }}>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>{item.titulo}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>{item.autorNome}</div>
              <div style={{ color: "#009B3A", fontWeight: 700, marginTop: "4px" }}>{brl(item.precoCentavos)}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              <button
                onClick={() => updateQuantidade(item.bookId, item.quantidade - 1)}
                style={{ background: "#F6F6F6", border: "1px solid #DDD", borderRadius: "4px", width: "28px", height: "28px", fontSize: "14px" }}
              >
                −
              </button>
              <span style={{ minWidth: "20px", textAlign: "center", fontWeight: 600 }}>{item.quantidade}</span>
              <button
                onClick={() => updateQuantidade(item.bookId, item.quantidade + 1)}
                style={{ background: "#F6F6F6", border: "1px solid #DDD", borderRadius: "4px", width: "28px", height: "28px", fontSize: "14px" }}
              >
                +
              </button>
            </div>
            <div style={{ fontWeight: 700, color: "#002776", flexShrink: 0, width: "90px", textAlign: "right" }}>
              {brl(item.precoCentavos * item.quantidade)}
            </div>
            <button
              onClick={() => removeItem(item.bookId)}
              title="Remover"
              style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0 }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
      <div style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "24px" }}>
        <div style={{ fontWeight: 700, marginBottom: "16px" }}>Resumo do pedido</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", marginBottom: "12px" }}>
          <span>Subtotal</span>
          <span>{brl(totalCentavos)}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "16px", borderTop: "1px solid #E0E0E0", paddingTop: "12px", marginBottom: "20px" }}>
          <span>Total</span>
          <span style={{ color: "#002776" }}>{brl(totalCentavos)}</span>
        </div>
        <Link
          href="/checkout"
          style={{ display: "block", textAlign: "center", background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "4px" }}
        >
          Finalizar compra
        </Link>
        <Link href="/livros" style={{ display: "block", textAlign: "center", color: "#002776", fontSize: "13px", fontWeight: 600, marginTop: "16px" }}>
          ← Continuar comprando
        </Link>
      </div>
    </div>
  );
}
