"use client";

import { useMemo, useState } from "react";
import { brl } from "@/lib/format";
import { COMISSAO_PERCENTUAL } from "@/lib/plans";
import type { OrderComReceita, SubscriptionPaymentRow } from "./types";

function mesChave(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function mesLabel(chave: string) {
  const [ano, mes] = chave.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

export default function AdminReceitaView({ pedidos, assinaturaPagamentos }: { pedidos: OrderComReceita[]; assinaturaPagamentos: SubscriptionPaymentRow[] }) {
  const meses = useMemo(() => {
    const chaves = new Set<string>();
    pedidos.forEach((p) => chaves.add(mesChave(p.createdAt)));
    assinaturaPagamentos.forEach((s) => chaves.add(mesChave(s.createdAt)));
    chaves.add(mesChave(new Date()));
    return Array.from(chaves).sort().reverse();
  }, [pedidos, assinaturaPagamentos]);

  const [mes, setMes] = useState(meses[0]);

  const dados = useMemo(() => {
    const pedidosDoMes = pedidos.filter((p) => mesChave(p.createdAt) === mes);
    const assinaturasDoMes = assinaturaPagamentos.filter((s) => mesChave(s.createdAt) === mes);

    let comissaoLivrosCentavos = 0;
    let repasseLivrosCentavos = 0;
    let vendaLivrosCentavos = 0;
    for (const p of pedidosDoMes) {
      const comissaoPct = COMISSAO_PERCENTUAL[p.author.plano] ?? 100;
      const comissao = Math.round(p.valorCentavos * (comissaoPct / 100));
      comissaoLivrosCentavos += comissao;
      repasseLivrosCentavos += p.valorCentavos - comissao + (p.freteCentavos ?? 0);
      vendaLivrosCentavos += p.valorCentavos + (p.freteCentavos ?? 0);
    }

    const assinaturasCentavos = assinaturasDoMes.reduce((sum, s) => sum + s.valorCentavos, 0);

    return {
      pedidosCount: pedidosDoMes.length,
      assinaturasCount: assinaturasDoMes.length,
      vendaLivrosCentavos,
      comissaoLivrosCentavos,
      repasseLivrosCentavos,
      assinaturasCentavos,
      totalReceitaCentavos: comissaoLivrosCentavos + assinaturasCentavos,
    };
  }, [pedidos, assinaturaPagamentos, mes]);

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Receita</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Receita da plataforma: comissão sobre vendas de livro + assinaturas de autores, por mês.
      </p>

      <select
        value={mes}
        onChange={(e) => setMes(e.target.value)}
        style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #DDD", fontSize: "13px", fontWeight: 600, marginBottom: "24px", textTransform: "capitalize" }}
      >
        {meses.map((m) => (
          <option key={m} value={m} style={{ textTransform: "capitalize" }}>
            {mesLabel(m)}
          </option>
        ))}
      </select>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "28px" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>💰 Receita total (comissão + assinaturas)</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#009B3A" }}>{brl(dados.totalReceitaCentavos)}</div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>📚 Comissão sobre vendas ({dados.pedidosCount} pedido{dados.pedidosCount === 1 ? "" : "s"})</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{brl(dados.comissaoLivrosCentavos)}</div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>✍️ Assinaturas ({dados.assinaturasCount} pagamento{dados.assinaturasCount === 1 ? "" : "s"})</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{brl(dados.assinaturasCentavos)}</div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
        <div style={{ fontWeight: 700, color: "#002776", marginBottom: "16px" }}>Detalhamento de vendas de livro</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Total vendido (livros + frete)</span>
            <span style={{ fontWeight: 600 }}>{brl(dados.vendaLivrosCentavos)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Repassado aos autores</span>
            <span style={{ fontWeight: 600 }}>{brl(dados.repasseLivrosCentavos)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #F0F0F0", paddingTop: "10px" }}>
            <span style={{ color: "#666" }}>Comissão da plataforma</span>
            <span style={{ fontWeight: 700, color: "#002776" }}>{brl(dados.comissaoLivrosCentavos)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
