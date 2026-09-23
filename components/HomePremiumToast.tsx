"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const DELAY_INICIAL_MS = 5000;
const REEXIBIR_INTERVALO_MS = 5 * 60 * 1000;

// Reforço discreto do Premium+ na home: aparece 5s depois de cada carregamento da
// página (sem persistir "já visto" — reaparece sempre que a pessoa entrar na home de
// novo). Se for fechado, volta a aparecer a cada 5 minutos enquanto ela continuar na
// página. Ao contrário do popup de /assinatura, não é modal — não bloqueia a página.
export default function HomePremiumToast() {
  const [visivel, setVisivel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisivel(true), DELAY_INICIAL_MS);
    return () => clearTimeout(timerRef.current);
  }, []);

  function fechar() {
    setVisivel(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisivel(true), REEXIBIR_INTERVALO_MS);
  }

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
        onClick={fechar}
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
