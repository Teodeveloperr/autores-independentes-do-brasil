"use client";

import { useMemo, useState } from "react";
import { brl } from "@/lib/format";
import type { AuthorWithRelations } from "./types";

const PAGO_STATUSES = ["Pago", "Aguardando envio", "Enviado", "Entregue"];
const PERIODOS = ["Este mês", "Últimos 3 meses", "Este ano", "Tudo"] as const;
const MESES_ABREV = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function inicioPeriodo(periodo: (typeof PERIODOS)[number]): Date | null {
  const now = new Date();
  if (periodo === "Este mês") return new Date(now.getFullYear(), now.getMonth(), 1);
  if (periodo === "Últimos 3 meses") return new Date(now.getFullYear(), now.getMonth() - 2, 1);
  if (periodo === "Este ano") return new Date(now.getFullYear(), 0, 1);
  return null;
}

export default function VendasView({ author }: { author: AuthorWithRelations }) {
  const [periodo, setPeriodo] = useState<(typeof PERIODOS)[number]>("Últimos 3 meses");

  const vendas = useMemo(() => {
    const desde = inicioPeriodo(periodo);
    return author.orders.filter((o) => PAGO_STATUSES.includes(o.status) && (!desde || o.createdAt >= desde));
  }, [author.orders, periodo]);

  const receitaTotal = vendas.reduce((sum, o) => sum + o.valorCentavos, 0);
  const itensVendidos = vendas.reduce((sum, o) => sum + o.quantidade, 0);
  const ticketMedio = vendas.length > 0 ? receitaTotal / vendas.length : 0;

  const receitaPorMes = useMemo(() => {
    const now = new Date();
    const meses: { label: string; centavos: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const centavos = author.orders
        .filter((o) => PAGO_STATUSES.includes(o.status) && o.createdAt.getFullYear() === ref.getFullYear() && o.createdAt.getMonth() === ref.getMonth())
        .reduce((sum, o) => sum + o.valorCentavos, 0);
      meses.push({ label: `${MESES_ABREV[ref.getMonth()]}/${String(ref.getFullYear()).slice(-2)}`, centavos });
    }
    return meses;
  }, [author.orders]);

  const maxMes = Math.max(1, ...receitaPorMes.map((m) => m.centavos));

  const topLivros = useMemo(() => {
    const porLivro = new Map<string, { livro: string; receita: number; quantidade: number }>();
    for (const o of vendas) {
      const atual = porLivro.get(o.livro) ?? { livro: o.livro, receita: 0, quantidade: 0 };
      atual.receita += o.valorCentavos;
      atual.quantidade += o.quantidade;
      porLivro.set(o.livro, atual);
    }
    return [...porLivro.values()].sort((a, b) => b.receita - a.receita).slice(0, 5);
  }, [vendas]);

  const maxLivro = Math.max(1, ...topLivros.map((l) => l.receita));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>Vendas e Relatórios</h2>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value as (typeof PERIODOS)[number])}
          style={{ padding: "8px 12px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
        >
          {PERIODOS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "24px" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#009B3A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>💰</div>
          <div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Receita no período</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>{brl(receitaTotal)}</div>
          </div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#FFDF00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>📦</div>
          <div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Livros vendidos</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>{itensVendidos}</div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{vendas.length} pedidos pagos</div>
          </div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#6B4EAF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🎟️</div>
          <div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Ticket médio</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>{brl(ticketMedio)}</div>
          </div>
        </div>
      </div>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "20px" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Receita nos últimos 6 meses</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "16px", height: "180px" }}>
            {receitaPorMes.map((m) => (
              <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", height: "100%", justifyContent: "flex-end" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#002776" }}>{m.centavos > 0 ? brl(m.centavos) : ""}</div>
                <div style={{ width: "100%", maxWidth: "36px", height: `${Math.max(4, (m.centavos / maxMes) * 130)}px`, background: "#009B3A", borderRadius: "4px 4px 0 0" }} />
                <div style={{ fontSize: "11px", color: "#666" }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "16px" }}>Livros mais vendidos</div>
          {topLivros.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {topLivros.map((l) => (
                <div key={l.livro}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "6px", gap: "8px" }}>
                    <span style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.livro}</span>
                    <span style={{ color: "#666", flexShrink: 0 }}>{brl(l.receita)}</span>
                  </div>
                  <div style={{ background: "#F0F0F0", borderRadius: "4px", height: "8px" }}>
                    <div style={{ width: `${(l.receita / maxLivro) * 100}%`, background: "#009B3A", height: "100%", borderRadius: "4px" }} />
                  </div>
                  <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{l.quantidade} unidade{l.quantidade > 1 ? "s" : ""}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "13px", color: "#666" }}>Nenhuma venda paga neste período.</p>
          )}
        </div>
      </div>
    </div>
  );
}
