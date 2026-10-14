"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import PrecoComDesconto from "./PrecoComDesconto";

type LivroRecente = {
  id: string;
  titulo: string;
  autorNome: string;
  capaUrl: string | null;
  precoCentavos: number;
  descontoPercentual: number | null;
};

const LARGURA_MIN_CARD_PX = 190;
const LARGURA_MIN_CARD_CELULAR_PX = 150;
const LARGURA_CELULAR_MAX_PX = 600;
const GAP_PX = 24;
const INTERVALO_MS = 5000;
const TRANSICAO_MS = 600;

function Card({ b, largura }: { b: LivroRecente; largura: number }) {
  return (
    <Link href="/livros" style={{ flex: `0 0 ${largura}px`, display: "block", color: "inherit", textDecoration: "none" }}>
      <div
        style={{
          backgroundColor: b.capaUrl ? "#F6F6F6" : "#E0E0E0",
          backgroundImage: b.capaUrl ? `url(${b.capaUrl})` : undefined,
          backgroundSize: "contain",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          aspectRatio: "3/4",
          borderRadius: "4px",
          marginBottom: "10px",
        }}
      />
      <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "2px" }}>{b.titulo}</div>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>{b.autorNome}</div>
      <PrecoComDesconto precoCentavos={b.precoCentavos} descontoPercentual={b.descontoPercentual} fontSize="13px" />
    </Link>
  );
}

// Mesma mecânica do carrossel de autores em destaque (AutoresDestaqueCarousel): faixa
// infinita que avança 1 livro a cada 5s, com setas pra navegar à mão. Os clones das pontas
// cobrem uma janela inteira de cards, e ao chegar neles a faixa salta sem transição pro
// trecho real correspondente. A quantidade de cards visíveis vem da largura real do
// container; no celular os cards são mais estreitos pra caberem 2 por vez.
export default function LivrosRecentesCarousel({ livros }: { livros: LivroRecente[] }) {
  const total = livros.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const travadoRef = useRef(false);
  const visiveisRef = useRef(1);
  const [cardWidth, setCardWidth] = useState(LARGURA_MIN_CARD_PX);
  const [visiveis, setVisiveis] = useState(1);
  const [index, setIndex] = useState(total > 1 ? 1 : 0);
  const [comTransicao, setComTransicao] = useState(true);
  const [travando, setTravando] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function recalcular() {
      const largura = el!.clientWidth;
      if (largura <= 0) return;
      const minimo = largura < LARGURA_CELULAR_MAX_PX ? LARGURA_MIN_CARD_CELULAR_PX : LARGURA_MIN_CARD_PX;
      const cabemNaTela = Math.floor((largura + GAP_PX) / (minimo + GAP_PX));
      const v = Math.max(1, Math.min(total || 1, cabemNaTela));
      setCardWidth((largura - (v - 1) * GAP_PX) / v);
      const delta = v - visiveisRef.current;
      visiveisRef.current = v;
      setVisiveis(v);
      if (delta !== 0 && total > 1) {
        setIndex((i) => i + delta);
      }
    }
    recalcular();
    const observer = new ResizeObserver(recalcular);
    observer.observe(el);
    return () => observer.disconnect();
  }, [total]);

  // Ignora o pedido se o passo anterior ainda não terminou de deslizar — evita que cliques
  // rápidos, ou um clique na hora do autoplay, empurrem o índice além dos clones das pontas.
  function passo(delta: number) {
    if (travadoRef.current) return;
    travadoRef.current = true;
    setTravando(true);
    setIndex((i) => i + delta);
  }

  function liberar() {
    travadoRef.current = false;
    setTravando(false);
  }

  useEffect(() => {
    if (total <= 1) return;
    const intervalo = setInterval(() => passo(1), INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [total, index]);

  const offsetInicio = total > 1 ? visiveis : 0;

  // Sempre TRANSICAO_MS depois de qualquer passo: se caiu num clone da ponta, salta sem
  // transição pro trecho real; de qualquer forma libera o próximo passo. Não depende do
  // evento "transitionend", pouco confiável em aba em segundo plano.
  useEffect(() => {
    if (total <= 1 || !comTransicao) return;
    const t = setTimeout(() => {
      if (index === offsetInicio + total) {
        setComTransicao(false);
        setIndex(offsetInicio);
      } else if (index === offsetInicio - 1) {
        setComTransicao(false);
        setIndex(offsetInicio + total - 1);
      }
      liberar();
    }, TRANSICAO_MS);
    return () => clearTimeout(t);
  }, [index, total, comTransicao, offsetInicio]);

  useEffect(() => {
    if (!comTransicao) {
      const t = setTimeout(() => setComTransicao(true), 50);
      return () => clearTimeout(t);
    }
  }, [comTransicao]);

  if (total === 0) return null;

  const cloneInicio = total > 1 ? livros.slice(total - visiveis) : [];
  const cloneFim = total > 1 ? livros.slice(0, visiveis) : [];
  const estendido = total > 1 ? [...cloneInicio, ...livros, ...cloneFim] : livros;
  const passoPx = cardWidth + GAP_PX;

  return (
    <div>
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
          {estendido.map((b, i) => (
            <Card key={`${b.id}-${i}`} b={b} largura={cardWidth} />
          ))}
        </div>
      </div>
      {total > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "20px" }}>
          <button
            onClick={() => passo(-1)}
            disabled={travando}
            aria-label="Livro anterior"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "36px", height: "36px", flexShrink: 0, fontSize: "16px", color: "#002776", opacity: travando ? 0.5 : 1 }}
          >
            ‹
          </button>
          <button
            onClick={() => passo(1)}
            disabled={travando}
            aria-label="Próximo livro"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "36px", height: "36px", flexShrink: 0, fontSize: "16px", color: "#002776", opacity: travando ? 0.5 : 1 }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
