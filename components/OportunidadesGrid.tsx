"use client";

import { useState } from "react";
import { REGIOES_OPORTUNIDADES } from "@/lib/regioes";

const CATEGORIAS = [
  "Editais",
  "Bienais",
  "Feiras",
  "Antologias",
  "Concursos",
  "Prêmios",
  "Cursos",
  "Chamadas abertas",
  "Residências",
  "Financiamento cultural",
];

export type OportunidadeItem = {
  id: string;
  nome: string;
  categoria: string;
  prazoFinal: string;
  regiao: string;
  estado: string;
  valor: string | null;
  link: string;
};

// prazoFinal chega como data pura ("YYYY-MM-DD"). Compara dia com dia, sem horário: o último
// dia de inscrição dá 0, não "encerrado".
function diasRestantes(prazoFinal: string): number {
  const [ano, mes, dia] = prazoFinal.split("-").map(Number);
  const hoje = new Date();
  return Math.round((Date.UTC(ano, mes - 1, dia) - Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) / 86400000);
}

function urgencia(dias: number): { emoji: string; cor: string } {
  if (dias <= 7) return { emoji: "🔴", cor: "#C0392B" };
  if (dias <= 30) return { emoji: "🟡", cor: "#A87900" };
  return { emoji: "🟢", cor: "#009B3A" };
}

export default function OportunidadesGrid({ oportunidades }: { oportunidades: OportunidadeItem[] }) {
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [regiaoAtiva, setRegiaoAtiva] = useState<string | null>(null);

  // Uma oportunidade "Nacional" vale pra todo mundo, então aparece também quando a pessoa
  // filtra por uma região específica — só some se ela escolher só "Nacional" de outra região.
  const filtradas = oportunidades.filter(
    (o) =>
      (!categoriaAtiva || o.categoria === categoriaAtiva) &&
      (!regiaoAtiva || o.regiao === regiaoAtiva || (o.regiao === "Nacional" && regiaoAtiva !== "Nacional"))
  );

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#002776" : "white",
    color: active ? "white" : "#262626",
    border: active ? "none" : "1px solid #DDD",
    padding: "8px 16px",
    borderRadius: "4px",
    fontSize: "13px",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <>
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button onClick={() => setCategoriaAtiva(null)} style={btnStyle(categoriaAtiva === null)}>
          Todas
        </button>
        {CATEGORIAS.map((c) => (
          <button key={c} onClick={() => setCategoriaAtiva(c)} style={btnStyle(categoriaAtiva === c)}>
            {c}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: "10px", marginBottom: "32px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "13px", color: "#666", fontWeight: 600 }}>📍 Região:</span>
        <button onClick={() => setRegiaoAtiva(null)} style={btnStyle(regiaoAtiva === null)}>
          Todas
        </button>
        {REGIOES_OPORTUNIDADES.map((r) => (
          <button key={r} onClick={() => setRegiaoAtiva(r)} style={btnStyle(regiaoAtiva === r)}>
            {r}
          </button>
        ))}
      </div>

      {filtradas.length > 0 ? (
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
          {filtradas.map((o) => {
            const dias = diasRestantes(o.prazoFinal);
            const { emoji, cor } = urgencia(dias);
            return (
              <div key={o.id} style={{ background: "#F6F6F6", padding: "20px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px", color: "#262626" }}>{o.nome}</div>
                <div style={{ fontSize: "13px", color: cor, fontWeight: 600 }}>
                  {emoji} Prazo final: {dias === 0 ? "hoje (último dia)" : dias > 0 ? `${dias} dia${dias === 1 ? "" : "s"}` : "encerrado"}
                </div>
                <div style={{ fontSize: "13px", color: "#666" }}>Categoria: {o.categoria}</div>
                <div style={{ fontSize: "13px", color: "#666" }}>
                  Região: {o.regiao}
                  {o.estado ? ` — ${o.estado}` : ""}
                </div>
                {o.valor && <div style={{ fontSize: "13px", color: "#666" }}>Valor: {o.valor}</div>}
                <a
                  href={o.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: "block", textAlign: "center", background: "#009B3A", color: "white", padding: "10px 20px", fontWeight: 700, borderRadius: "4px", textDecoration: "none", marginTop: "8px" }}
                >
                  VER OPORTUNIDADE
                </a>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "16px", color: "#666" }}>
            {oportunidades.length === 0
              ? "Nenhuma oportunidade em aberto no momento. Volte em breve!"
              : "Nenhuma oportunidade em aberto no momento com esses filtros."}
          </p>
        </div>
      )}
    </>
  );
}
