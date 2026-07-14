"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrderStatus } from "@/app/painel/actions";
import { brl } from "@/lib/format";
import type { AuthorWithRelations } from "./types";

const FILTERS = ["Todos", "Pago", "Aguardando envio", "Enviado", "Entregue"];
const STATUS_COLOR: Record<string, string> = {
  Pago: "#009B3A",
  "Aguardando envio": "#A87900",
  Enviado: "#002776",
  Entregue: "#6B4EAF",
};

export default function PedidosView({ author }: { author: AuthorWithRelations }) {
  const [filter, setFilter] = useState("Todos");
  const [, startTransition] = useTransition();
  const router = useRouter();

  const pedidos = author.orders.filter((p) => filter === "Todos" || p.status === filter);

  function onStatusChange(id: string, status: string) {
    startTransition(async () => {
      await setOrderStatus(id, status);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Pedidos</h2>
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
        {pedidos.map((p) => (
          <div key={p.id} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #F0F0F0" }}>
            <div style={{ width: "48px", height: "64px", background: "#E0E0E0", borderRadius: "4px", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>{p.livro}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Pedido #{p.id.slice(-6)} • {p.createdAt.toLocaleDateString("pt-BR")} • Comprador: {p.comprador}
              </div>
            </div>
            <div style={{ fontWeight: 700, color: "#002776", fontSize: "14px", flexShrink: 0 }}>{brl(p.valorCentavos)}</div>
            <select
              defaultValue={p.status}
              onChange={(e) => onStatusChange(p.id, e.target.value)}
              style={{ padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, border: "1px solid #DDD", color: STATUS_COLOR[p.status] ?? "#666" }}
            >
              <option>Pago</option>
              <option>Aguardando envio</option>
              <option>Enviado</option>
              <option>Entregue</option>
            </select>
          </div>
        ))}
        {pedidos.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>Nenhum pedido nesta categoria.</div>
        )}
      </div>
    </div>
  );
}
