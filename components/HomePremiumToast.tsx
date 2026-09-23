"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DELAY_MS = 9000;
const SESSION_KEY = "premiumPlusToastShown";

// Reforço discreto do Premium+ na home: aparece uma vez, depois de alguns segundos de
// navegação, e não volta a aparecer na mesma aba/sessão (sessionStorage). Ao contrário do
// popup de /assinatura, não é modal — não bloqueia a página nem exige fechamento.
export default function HomePremiumToast() {
  const [visivel, setVisivel] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return;
    } catch {
      // sessionStorage indisponível (ex: navegação privada) — mostra normalmente, sem persistir
    }
    const timer = setTimeout(() => {
      setVisivel(true);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        // ignora — pior caso é reaparecer numa próxima visita
      }
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visivel) return null;

  return (
    <div
      role="status"
      className="home-toast home-toast-slide-in"
      style={{
        background: "white",
        borderRadius: "10px",
        boxShadow: "0 12px 32px rgba(0,0,0,0.2)",
        padding: "18px",
        borderLeft: "4px solid #FFDF00",
      }}
    >
      <button
        onClick={() => setVisivel(false)}
        aria-label="Fechar"
        style={{ position: "absolute", top: "6px", right: "8px", background: "transparent", color: "#999", fontSize: "18px", lineHeight: 1, padding: "6px" }}
      >
        ×
      </button>
      <div style={{ fontWeight: 700, fontSize: "14px", color: "#002776", marginBottom: "6px", paddingRight: "20px" }}>
        🏆 Vire um Autor Premium+
      </div>
      <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "12px" }}>
        Destaque, card no Instagram e 2 horas suas numa Bienal do Livro de 2027.
      </p>
      <Link
        href="/assinatura"
        style={{ display: "inline-block", background: "#002776", color: "white", fontSize: "13px", fontWeight: 600, padding: "8px 16px", borderRadius: "4px" }}
      >
        Saiba mais →
      </Link>
    </div>
  );
}
