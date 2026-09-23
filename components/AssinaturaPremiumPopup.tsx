"use client";

import { useState } from "react";
import Link from "next/link";
import { PLANOS_PAGOS, valorCicloCentavos } from "@/lib/plans";

function brl(centavos: number) {
  return "R$ " + (centavos / 100).toFixed(2).replace(".", ",");
}

// Aparece toda vez que a página de planos é aberta ou recarregada — sem persistir
// "já visto" em lugar nenhum, o estado reseta sozinho a cada carregamento novo da página.
export default function AssinaturaPremiumPopup({
  planoAtual,
  isLoggedIn,
}: {
  planoAtual: string;
  isLoggedIn: boolean;
}) {
  const [fechado, setFechado] = useState(false);

  const visivel = planoAtual !== "Autor Premium+" && !fechado;

  function fechar() {
    setFechado(true);
  }

  function verCard() {
    fechar();
    document.getElementById("premium-plus-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  if (!visivel) return null;

  const plano = PLANOS_PAGOS.premiumPlus;
  const anualTotal = valorCicloCentavos(plano, "anual");
  const anualPorMes = Math.round(anualTotal / 12);

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
          style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "20px", color: "#999", width: "32px", height: "32px", cursor: "pointer" }}
        >
          ✕
        </button>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🌟</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px", lineHeight: 1.3 }}>
          Premium+ Anual: sua presença em todo lugar que importa
        </h2>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.6, marginBottom: "20px" }}>
          Um plano pensado pra transformar sua participação no coletivo numa experiência contínua de
          visibilidade, relacionamento e oportunidades reais.
        </p>
        <div style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px", background: "#F6F6F6", borderRadius: "8px", padding: "16px 18px" }}>
          <div style={{ fontSize: "13px", color: "#262626", display: "flex", gap: "8px" }}>
            <span>✅</span><span>Card exclusivo seu no Instagram do Autores do Brasil, com minibio e suas obras</span>
          </div>
          <div style={{ fontSize: "13px", color: "#262626", display: "flex", gap: "8px" }}>
            <span>✅</span><span>2 horas de participação em uma Bienal do Livro de 2027 — lançamento, bate-papo ou autógrafos</span>
          </div>
          <div style={{ fontSize: "13px", color: "#262626", display: "flex", gap: "8px" }}>
            <span>✅</span><span>Acesso ao Grupo Premium, com prioridade em oportunidades e networking</span>
          </div>
          <div style={{ fontSize: "13px", color: "#262626", display: "flex", gap: "8px" }}>
            <span>✅</span><span>Acesso exclusivo a editais, concursos e chamadas literárias de todo o Brasil</span>
          </div>
          <div style={{ fontSize: "13px", color: "#262626", display: "flex", gap: "8px" }}>
            <span>✅</span><span>Até 20% de desconto em pacotes de Bienal</span>
          </div>
          <div style={{ fontSize: "13px", color: "#262626", display: "flex", gap: "8px" }}>
            <span>✅</span><span>Tudo do Autor Essencial, com destaque total nas páginas do coletivo</span>
          </div>
        </div>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>
            {brl(anualPorMes)}
            <span style={{ fontSize: "13px", fontWeight: 500, color: "#666" }}>/mês</span>
          </div>
          <div style={{ fontSize: "12px", color: "#999" }}>{brl(anualTotal)} por ano · só no ciclo anual</div>
        </div>
        {isLoggedIn ? (
          <button
            onClick={verCard}
            style={{ display: "block", width: "100%", textAlign: "center", background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", border: "none", fontSize: "14px", cursor: "pointer" }}
          >
            Quero ser Premium+ Anual
          </button>
        ) : (
          <Link
            href="/cadastro?plano=premiumPlus&ciclo=anual"
            style={{ display: "block", textAlign: "center", background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", textDecoration: "none", fontSize: "14px" }}
          >
            Quero ser Premium+ Anual
          </Link>
        )}
        <button
          onClick={fechar}
          style={{ display: "block", width: "100%", marginTop: "12px", background: "none", border: "none", color: "#002776", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
        >
          Ver todos os planos
        </button>
      </div>
    </div>
  );
}
