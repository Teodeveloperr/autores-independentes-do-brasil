"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { initials } from "@/lib/format";

type AutorDestaque = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  generos: string[];
};

const LARGURA_MIN_CARD_PX = 180;
const GAP_PX = 24;
const INTERVALO_MS = 5000;
const TRANSICAO_MS = 600;

function Card({ a, largura }: { a: AutorDestaque; largura: number }) {
  return (
    <div style={{ flex: `0 0 ${largura}px`, background: "#F6F6F6", padding: "24px", borderRadius: "8px", textAlign: "center" }}>
      <div
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          margin: "0 auto 16px",
          background: a.fotoUrl ? `center / cover no-repeat url(${a.fotoUrl})` : "#E0E0E0",
          display: a.fotoUrl ? undefined : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          color: "#002776",
        }}
      >
        {!a.fotoUrl && initials(a.nome)}
      </div>
      <div style={{ fontWeight: 600, marginBottom: "8px", color: "#262626" }}>{a.nome}</div>
      <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>{a.generos.join(", ") || "—"}</div>
      <Link
        href={`/perfil/${a.id}`}
        style={{ display: "block", textAlign: "center", background: "#002776", color: "white", padding: "10px 20px", fontWeight: 600, width: "100%", borderRadius: "4px", textDecoration: "none" }}
      >
        VER PERFIL
      </Link>
    </div>
  );
}

// Faixa infinita que avança 1 autor por vez a cada 5s (pausa entre os passos, não fica
// girando sem parar) e desliza suavemente até a próxima posição. A lista é duplicada uma
// vez; ao alcançar a cópia (visualmente idêntica ao início), volta pro índice 0 sem
// transição — como as duas metades são iguais, esse "salto" é imperceptível e o carrossel
// parece continuar pra sempre, sem nenhuma célula vazia (cada card é sempre um autor de
// verdade). A largura de cada card é recalculada a partir da largura real do container
// (ResizeObserver) pra sempre caber um número inteiro de cards, sem cortar o próximo card
// na borda — se ajusta sozinho em qualquer tamanho de tela, sem depender de breakpoints
// fixos. Não pausa no hover, mesmo padrão dos outros carrosséis do site.
export default function AutoresDestaqueCarousel({ autores }: { autores: AutorDestaque[] }) {
  const total = autores.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(LARGURA_MIN_CARD_PX);
  const [index, setIndex] = useState(0);
  const [comTransicao, setComTransicao] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function recalcular() {
      const largura = el!.clientWidth;
      if (largura <= 0) return;
      const visiveis = Math.max(1, Math.floor((largura + GAP_PX) / (LARGURA_MIN_CARD_PX + GAP_PX)));
      setCardWidth((largura - (visiveis - 1) * GAP_PX) / visiveis);
    }
    recalcular();
    const observer = new ResizeObserver(recalcular);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (total <= 1) return;
    const intervalo = setInterval(() => setIndex((i) => i + 1), INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [total]);

  useEffect(() => {
    if (index === total) {
      const t = setTimeout(() => {
        setComTransicao(false);
        setIndex(0);
      }, TRANSICAO_MS);
      return () => clearTimeout(t);
    }
    if (!comTransicao) {
      const frame = requestAnimationFrame(() => setComTransicao(true));
      return () => cancelAnimationFrame(frame);
    }
  }, [index, total, comTransicao]);

  if (total === 0) return null;

  const duplicado = [...autores, ...autores];
  const passoPx = cardWidth + GAP_PX;

  return (
    <div ref={containerRef} style={{ overflow: "hidden" }}>
      <div
        style={{
          display: "flex",
          gap: `${GAP_PX}px`,
          width: "max-content",
          transform: `translateX(-${index * passoPx}px)`,
          transition: comTransicao ? `transform ${TRANSICAO_MS}ms ease` : "none",
        }}
      >
        {duplicado.map((a, i) => (
          <Card key={`${a.id}-${i}`} a={a} largura={cardWidth} />
        ))}
      </div>
    </div>
  );
}
