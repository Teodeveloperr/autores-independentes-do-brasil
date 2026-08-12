"use client";

import { useState } from "react";

const MESES_ABREV = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const MESES_NOME = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

const CATEGORIAS: { label: string; valor: string | null }[] = [
  { label: "📋 Todos os eventos", valor: null },
  { label: "🎓 Palestras", valor: "Palestras e Workshops" },
  { label: "🎪 Bienais", valor: "Bienais e Feiras" },
  { label: "👥 Encontros", valor: "Encontros de Autores" },
  { label: "📚 Lançamentos", valor: "Lançamentos" },
  { label: "💻 Online", valor: "Eventos Online" },
];

export type EventoCalendario = {
  id: string;
  nome: string;
  dia: number;
  mes: string;
  categoria: string;
  local: string;
  periodo: string | null;
};

export default function EventosCalendario({ eventos }: { eventos: EventoCalendario[] }) {
  const hoje = new Date();
  const [mesAtual, setMesAtual] = useState(hoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(hoje.getFullYear());
  const [categoria, setCategoria] = useState<string | null>(null);

  function mesAnterior() {
    if (mesAtual === 0) {
      setMesAtual(11);
      setAnoAtual((a) => a - 1);
    } else {
      setMesAtual((m) => m - 1);
    }
  }

  function mesSeguinte() {
    if (mesAtual === 11) {
      setMesAtual(0);
      setAnoAtual((a) => a + 1);
    } else {
      setMesAtual((m) => m + 1);
    }
  }

  const eventosFiltrados = categoria ? eventos.filter((e) => e.categoria === categoria) : eventos;

  const diasComEvento = new Set(eventos.filter((e) => e.mes === MESES_ABREV[mesAtual]).map((e) => e.dia));

  const primeiroDiaSemana = new Date(anoAtual, mesAtual, 1).getDay();
  const diasNoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();
  const diasMesAnterior = new Date(anoAtual, mesAtual, 0).getDate();

  const celulas: { dia: number; atual: boolean }[] = [];
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) celulas.push({ dia: diasMesAnterior - i, atual: false });
  for (let d = 1; d <= diasNoMes; d++) celulas.push({ dia: d, atual: true });
  let diaSeguinte = 1;
  while (celulas.length % 7 !== 0) celulas.push({ dia: diaSeguinte++, atual: false });

  const ehHoje = (dia: number, atual: boolean) =>
    atual && dia === hoje.getDate() && mesAtual === hoje.getMonth() && anoAtual === hoje.getFullYear();

  return (
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
      <div>
        <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "2px solid #DDD", paddingBottom: "16px", fontSize: "13px", flexWrap: "wrap" }}>
          {CATEGORIAS.map((c) => (
            <button
              key={c.label}
              onClick={() => setCategoria(c.valor)}
              style={{ background: "white", padding: 0, fontWeight: categoria === c.valor ? 600 : 500, color: categoria === c.valor ? "#002776" : "#666" }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div style={{ fontWeight: 600 }}>
            {MESES_NOME[mesAtual]} {anoAtual}
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={mesAnterior} style={{ background: "white", border: "1px solid #DDD", padding: "4px 12px" }}>
              ←
            </button>
            <button onClick={mesSeguinte} style={{ background: "white", border: "1px solid #DDD", padding: "4px 12px" }}>
              →
            </button>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
          {["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"].map((d) => (
            <div key={d} style={{ textAlign: "center", fontWeight: 600, fontSize: "12px", padding: "8px", color: "#666" }}>
              {d}
            </div>
          ))}
          {celulas.map((c, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "8px",
                borderRadius: "4px",
                color: c.atual ? "#262626" : "#999",
                background: ehHoje(c.dia, c.atual) ? "#002776" : c.atual && diasComEvento.has(c.dia) ? "#F6F6F6" : undefined,
                fontWeight: c.atual && diasComEvento.has(c.dia) ? 700 : 400,
                ...(ehHoje(c.dia, c.atual) ? { color: "white" } : {}),
              }}
            >
              {c.dia}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={{ fontWeight: 700, marginBottom: "16px" }}>Próximos eventos</div>
        {eventosFiltrados.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {eventosFiltrados.map((ev) => (
              <div key={ev.id} style={{ display: "flex", gap: "16px", padding: "16px", background: "#F6F6F6", borderRadius: "8px" }}>
                <div
                  style={{
                    background: "white",
                    border: "1px solid #E0E0E0",
                    borderRadius: "6px",
                    padding: "8px 14px",
                    textAlign: "center",
                    flexShrink: 0,
                    height: "56px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#C0392B" }}>{ev.dia}</div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>{ev.mes}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{ev.nome}</div>
                  <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>{ev.periodo}</div>
                  <div style={{ fontSize: "13px", color: "#666" }}>📍 {ev.local}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#666", fontSize: "14px" }}>
            Nenhum evento nessa categoria no momento.
          </div>
        )}
      </div>
    </div>
  );
}
