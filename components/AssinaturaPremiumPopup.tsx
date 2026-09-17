"use client";

import { useState } from "react";
import { PLANOS_PAGOS, CICLO_MESES, valorCicloCentavos } from "@/lib/plans";

function brl(centavos: number) {
  return "R$ " + (centavos / 100).toFixed(2).replace(".", ",");
}

// Aparece toda vez que a página de planos é aberta ou recarregada — sem persistir
// "já visto" em lugar nenhum, o estado reseta sozinho a cada carregamento novo da página.
export default function AssinaturaPremiumPopup({ planoAtual }: { planoAtual: string }) {
  const [fechado, setFechado] = useState(false);

  const visivel = planoAtual !== "Autor Premium" && !fechado;

  function fechar() {
    setFechado(true);
  }

  if (!visivel) return null;

  const plano = PLANOS_PAGOS.premium;
  const semestralTotal = valorCicloCentavos(plano, "semestral");
  const semestralPorMes = Math.round(semestralTotal / CICLO_MESES.semestral);
  const anualTotal = valorCicloCentavos(plano, "anual");
  const anualPorMes = Math.round(anualTotal / CICLO_MESES.anual);

  return (
    <div
      onClick={fechar}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "white", borderRadius: "12px", padding: "36px", maxWidth: "480px", width: "100%", position: "relative", textAlign: "center" }}
      >
        <button
          onClick={fechar}
          aria-label="Fechar"
          style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "20px", color: "#999", width: "32px", height: "32px" }}
        >
          ✕
        </button>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🌟</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>
          Destaque-se com o Autor Premium
        </h2>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.6, marginBottom: "24px" }}>
          Assinando o Premium no ciclo semestral ou anual, você garante <strong>acesso antecipado a eventos, editais
          e oportunidades</strong> do coletivo — além de destaque nas páginas de Autores e Livros, selo de perfil
          verificado e comissão reduzida nas suas vendas.
        </p>
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <div style={{ flex: 1, background: "#F6F6F6", borderRadius: "8px", padding: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#666", marginBottom: "6px" }}>SEMESTRAL</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#002776" }}>
              {brl(semestralPorMes)}
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#666" }}>/mês</span>
            </div>
            <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>{brl(semestralTotal)} a cada 6 meses</div>
          </div>
          <div style={{ flex: 1, background: "#F1F8F4", border: "2px solid #009B3A", borderRadius: "8px", padding: "16px", position: "relative" }}>
            <div style={{ position: "absolute", top: "-10px", left: "50%", transform: "translateX(-50%)", background: "#009B3A", color: "white", fontSize: "10px", fontWeight: 700, padding: "2px 10px", borderRadius: "10px", whiteSpace: "nowrap" }}>
              MENOR PREÇO
            </div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#666", marginBottom: "6px" }}>ANUAL</div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#002776" }}>
              {brl(anualPorMes)}
              <span style={{ fontSize: "12px", fontWeight: 500, color: "#666" }}>/mês</span>
            </div>
            <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>{brl(anualTotal)} por ano</div>
          </div>
        </div>
        <button
          onClick={fechar}
          style={{ background: "#009B3A", color: "white", padding: "12px 32px", fontWeight: 700, borderRadius: "6px", border: "none", fontSize: "14px" }}
        >
          Ver plano Premium
        </button>
      </div>
    </div>
  );
}
