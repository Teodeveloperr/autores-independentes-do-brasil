"use client";

import { useState } from "react";
import { marcarAgradecimentoGrupoVisto } from "@/app/painel/actions";

const LINK_GRUPO_PREMIUM = "https://chat.whatsapp.com/BrJufmpdatC0r1bl4HNZb9?mode=gi_t";
const LINK_GRUPO_PREMIUM_PLUS = "https://chat.whatsapp.com/Gx9FZBM9Fny97CpumWDYBl?mode=gi_t";

export default function AgradecimentoGrupoPopup({ mostrar, plano }: { mostrar: boolean; plano: string }) {
  const [fechado, setFechado] = useState(false);

  if (!mostrar || fechado) return null;

  const linkGrupo = plano === "Autor Premium+" ? LINK_GRUPO_PREMIUM_PLUS : LINK_GRUPO_PREMIUM;

  function fechar() {
    setFechado(true);
    marcarAgradecimentoGrupoVisto().catch((err) => console.error("[painel] Falha ao marcar popup como visto:", err));
  }

  return (
    <div
      onClick={fechar}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "white", borderRadius: "12px", padding: "36px", maxWidth: "440px", width: "100%", position: "relative", textAlign: "center" }}
      >
        <button
          onClick={fechar}
          aria-label="Fechar"
          style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "20px", color: "#999", width: "32px", height: "32px" }}
        >
          ✕
        </button>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>
          Obrigado por fazer parte do {plano}!
        </h2>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.6, marginBottom: "24px" }}>
          Você é um dos autores que já confiam no coletivo — e queremos te convidar pra entrar no nosso{" "}
          <strong>grupo exclusivo de autores no WhatsApp</strong>, onde compartilhamos oportunidades, editais,
          novidades e trocamos experiências entre autores.
        </p>
        <a
          href={linkGrupo}
          target="_blank"
          rel="noopener noreferrer"
          onClick={fechar}
          style={{ display: "block", background: "#25D366", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", textDecoration: "none", marginBottom: "10px" }}
        >
          💬 Entrar no grupo do WhatsApp
        </a>
        <button
          onClick={fechar}
          style={{ background: "white", border: "1px solid #DDD", color: "#666", padding: "10px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", width: "100%" }}
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
