"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOrderStatus } from "@/app/painel/actions";
import { brl } from "@/lib/format";
import type { AuthorWithRelations } from "./types";

const FILTERS = ["Todos", "Aguardando pagamento", "Pago", "Aguardando envio", "Enviado", "Entregue", "Cancelado"];
const STATUS_COLOR: Record<string, string> = {
  "Aguardando pagamento": "#C0392B",
  Pago: "#009B3A",
  "Aguardando envio": "#A87900",
  Enviado: "#002776",
  Entregue: "#6B4EAF",
  Cancelado: "#999999",
};

export default function PedidosView({ author }: { author: AuthorWithRelations }) {
  const [filter, setFilter] = useState("Todos");
  const [, startTransition] = useTransition();
  const [erro, setErro] = useState<{ id: string; mensagem: string } | null>(null);
  const router = useRouter();

  const pedidos = author.orders.filter((p) => filter === "Todos" || p.status === filter);

  function onStatusChange(id: string, status: string) {
    setErro(null);
    startTransition(async () => {
      try {
        await setOrderStatus(id, status);
        router.refresh();
      } catch (err) {
        setErro({ id, mensagem: err instanceof Error ? err.message : "Não foi possível atualizar o status." });
        router.refresh();
      }
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
          <div key={p.id} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #F0F0F0", flexWrap: "wrap" }}>
            <div style={{ width: "48px", height: "64px", background: "#E0E0E0", borderRadius: "4px", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>
                {p.livro} {p.quantidade > 1 ? `(x${p.quantidade})` : ""}
              </div>
              <div style={{ fontSize: "12px", color: "#666" }}>
                Pedido #{p.id.slice(-6)} • {p.createdAt.toLocaleDateString("pt-BR")} • Comprador: {p.comprador}
                {p.compradorEmail ? ` (${p.compradorEmail})` : ""}
                {p.compradorTelefone ? ` • ${p.compradorTelefone}` : ""}
              </div>
              {p.compradorRua && (
                <div style={{ fontSize: "12px", color: "#666" }}>
                  📦 {p.compradorRua}, {p.compradorNumero}
                  {p.compradorComplemento ? ` - ${p.compradorComplemento}` : ""} - {p.compradorBairro}, {p.compradorCidade}/{p.compradorUf} - CEP {p.compradorCep}
                </div>
              )}
              {p.freteCentavos != null && (
                <div style={{ fontSize: "12px", color: "#666" }}>
                  🚚 Frete: {brl(p.freteCentavos)}{p.freteServico ? ` (${p.freteServico})` : ""}
                </div>
              )}
              {erro?.id === p.id && (
                <div style={{ fontSize: "12px", color: "#C0392B", marginTop: "4px" }}>⚠️ {erro.mensagem}</div>
              )}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontWeight: 700, color: "#002776", fontSize: "14px" }}>{brl(p.valorCentavos + (p.freteCentavos ?? 0))}</div>
              {p.freteCentavos != null && <div style={{ fontSize: "11px", color: "#999" }}>+ {brl(p.freteCentavos)} frete</div>}
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <select
                value={p.status}
                onChange={(e) => onStatusChange(p.id, e.target.value)}
                disabled={p.status === "Entregue" || p.status === "Cancelado"}
                style={{ padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, border: "1px solid #DDD", color: STATUS_COLOR[p.status] ?? "#666" }}
              >
                <option>Aguardando pagamento</option>
                <option>Pago</option>
                <option>Aguardando envio</option>
                <option>Enviado</option>
                {p.status === "Entregue" && <option>Entregue</option>}
                {p.status === "Cancelado" && <option>Cancelado</option>}
              </select>
              {p.status === "Cancelado" && (
                <div style={{ fontSize: "11px", color: "#999", marginTop: "4px", maxWidth: "180px" }}>
                  Pedido cancelado automaticamente — o pagamento não foi concluído a tempo.
                </div>
              )}
              {p.confirmacaoEnviadaEm && p.repasseStatus !== "transferido" && p.repasseStatus !== "erro" && (
                <div style={{ fontSize: "11px", color: "#A87900", marginTop: "4px", maxWidth: "180px" }}>
                  ⏳ Aguardando confirmação do comprador (ou liberação em até 7 dias)
                </div>
              )}
              {!p.confirmacaoEnviadaEm && p.status !== "Aguardando pagamento" && p.status !== "Entregue" && p.status !== "Cancelado" && (
                <div style={{ fontSize: "11px", color: "#999", marginTop: "4px", maxWidth: "180px" }}>
                  Se não marcar como enviado, o comprador recebe um lembrete automático em até 3 dias após a compra.
                </div>
              )}
              {p.repasseStatus === "transferido" && (
                <div style={{ fontSize: "11px", color: "#009B3A", marginTop: "4px", maxWidth: "180px" }}>
                  ✅ Repasse enviado — {p.confirmadoEm ? "confirmado pelo comprador" : "liberado automaticamente"}
                </div>
              )}
              {p.repasseStatus === "erro" && (
                <div style={{ fontSize: "11px", color: "#C0392B", marginTop: "4px", maxWidth: "180px" }}>
                  ⚠️ Erro no repasse: {p.repasseErro}
                </div>
              )}
            </div>
          </div>
        ))}
        {pedidos.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>Nenhum pedido nesta categoria.</div>
        )}
      </div>
    </div>
  );
}
