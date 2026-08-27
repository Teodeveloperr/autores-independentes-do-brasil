"use client";

import { useState } from "react";
import type { OrderWithAuthor } from "./types";

const FILTERS = ["Todos", "Aguardando pagamento", "Pago", "Aguardando envio", "Enviado", "Entregue"];
const STATUS_COLOR: Record<string, string> = {
  "Aguardando pagamento": "#C0392B",
  Pago: "#009B3A",
  "Aguardando envio": "#A87900",
  Enviado: "#002776",
  Entregue: "#6B4EAF",
};
const AGUARDANDO_ENVIO = new Set(["Pago", "Aguardando envio"]);

function diasDesde(data: Date): number {
  return Math.floor((Date.now() - data.getTime()) / (1000 * 60 * 60 * 24));
}

export default function AdminPedidosView({ pedidos }: { pedidos: OrderWithAuthor[] }) {
  const [filter, setFilter] = useState("Todos");

  const pedidosFiltrados = pedidos.filter((p) => filter === "Todos" || p.status === filter);

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Pedidos</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Todos os pedidos da plataforma, de todos os autores — só visualização, quem altera o status é o próprio autor.
      </p>
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
        {FILTERS.map((label) => (
          <button
            key={label}
            onClick={() => setFilter(label)}
            style={{
              background: filter === label ? "#002776" : "white",
              color: filter === label ? "white" : "#262626",
              border: filter === label ? "none" : "1px solid #DDD",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div style={{ background: "white", borderRadius: "10px", overflow: "hidden" }}>
        {pedidosFiltrados.map((p) => (
          <div key={p.id} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #F0F0F0", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>
                {p.livro} {p.quantidade > 1 ? `(x${p.quantidade})` : ""}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Pedido #{p.id.slice(-6)} • {p.createdAt.toLocaleDateString("pt-BR")} • Autor: {p.author.nome} • Comprador: {p.comprador}
              </div>
              {AGUARDANDO_ENVIO.has(p.status) && (
                <div style={{ fontSize: "12px", color: "#A87900", marginTop: "2px" }}>
                  ⏳ há {diasDesde(p.createdAt)} dia{diasDesde(p.createdAt) === 1 ? "" : "s"} aguardando envio
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: "12px",
                background: "#F6F6F6",
                color: STATUS_COLOR[p.status] ?? "#666",
                flexShrink: 0,
              }}
            >
              {p.status}
            </span>
          </div>
        ))}
        {pedidosFiltrados.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>Nenhum pedido nesta categoria.</div>
        )}
      </div>
    </div>
  );
}
