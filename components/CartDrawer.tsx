"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { brl } from "@/lib/format";

export default function CartDrawer() {
  const { drawerOpen, closeDrawer, lastAdded, totalItens, totalCentavos } = useCart();

  if (!drawerOpen || !lastAdded) return null;

  return (
    <div
      onClick={closeDrawer}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 200,
        display: "flex",
        justifyContent: "flex-end",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          width: "100%",
          maxWidth: "380px",
          height: "100%",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-4px 0 20px rgba(0,0,0,0.15)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div style={{ fontWeight: 700, fontSize: "16px", color: "#009B3A" }}>✓ Adicionado ao carrinho</div>
          <button
            onClick={closeDrawer}
            aria-label="Fechar"
            style={{ background: "#F6F6F6", border: "none", borderRadius: "50%", width: "28px", height: "28px", fontSize: "14px", color: "#666" }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", gap: "12px", background: "#F6F6F6", borderRadius: "8px", padding: "12px", marginBottom: "20px" }}>
          <div
            style={{
              width: "56px",
              height: "74px",
              borderRadius: "4px",
              flexShrink: 0,
              background: lastAdded.capaUrl ? `center / cover no-repeat url(${lastAdded.capaUrl})` : "#E0E0E0",
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "2px" }}>{lastAdded.titulo}</div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>{lastAdded.autorNome}</div>
            <div style={{ fontWeight: 700, color: "#009B3A", fontSize: "13px" }}>{brl(lastAdded.precoCentavos)}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#666", marginBottom: "24px", borderTop: "1px solid #F0F0F0", paddingTop: "16px" }}>
          <span>{totalItens} {totalItens === 1 ? "item" : "itens"} no carrinho</span>
          <span style={{ fontWeight: 700, color: "#262626" }}>{brl(totalCentavos)}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "auto" }}>
          <Link
            href="/carrinho"
            onClick={closeDrawer}
            style={{ display: "block", textAlign: "center", background: "#009B3A", color: "white", padding: "14px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", textDecoration: "none" }}
          >
            Ir para o carrinho
          </Link>
          <button
            onClick={closeDrawer}
            style={{ background: "white", border: "2px solid #002776", color: "#002776", padding: "12px", fontWeight: 600, borderRadius: "6px", fontSize: "14px" }}
          >
            Continuar comprando
          </button>
        </div>
      </div>
    </div>
  );
}
