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
// girando sem parar) e desliza suavemente até a próxima posição — mais as setas pra
// navegar manualmente pra frente/trás. Como vários cards ficam visíveis ao mesmo tempo, o
// clone no início/fim da faixa precisa cobrir uma janela INTEIRA de cards (não só 1),
// senão sobra espaço em branco quando o clone da ponta chega na borda com menos autores
// "de verdade" depois dele do que cabem na tela. Por isso clona os últimos N autores no
// início e os primeiros N no final (N = quantos cards cabem por vez); ao alcançar qualquer
// um desses clones, a faixa salta pro trecho real correspondente sem transição — como o
// clone e o real são iguais, o salto é imperceptível e o carrossel parece continuar pra
// sempre nos dois sentidos, sem nenhuma célula vazia. A largura/quantidade de cards
// visíveis é recalculada a partir da largura real do container (ResizeObserver), ajustando
// o índice pra continuar mostrando o mesmo autor se isso mudar. Não pausa no hover, mesmo
// padrão dos outros carrosséis do site.
export default function AutoresDestaqueCarousel({ autores }: { autores: AutorDestaque[] }) {
  const total = autores.length;
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
      const cabemNaTela = Math.floor((largura + GAP_PX) / (LARGURA_MIN_CARD_PX + GAP_PX));
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

  // Avança/retrocede 1 passo, ignorando o pedido se o passo anterior ainda não terminou de
  // deslizar — evita que cliques rápidos ou um clique bem na hora do autoplay empurrem o
  // índice pra além dos clones de cada ponta.
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
  // transição pro trecho real correspondente; de qualquer forma, libera o próximo passo.
  // Não depende do evento "transitionend" (pouco confiável em aba em segundo plano/inativa
  // — o passo tem que liberar de qualquer jeito, nem que a transição não tenha "terminado"
  // de verdade pro navegador).
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

  const cloneInicio = total > 1 ? autores.slice(total - visiveis) : [];
  const cloneFim = total > 1 ? autores.slice(0, visiveis) : [];
  const estendido = total > 1 ? [...cloneInicio, ...autores, ...cloneFim] : autores;
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
          {estendido.map((a, i) => (
            <Card key={`${a.id}-${i}`} a={a} largura={cardWidth} />
          ))}
        </div>
      </div>
      {total > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "20px" }}>
          <button
            onClick={() => passo(-1)}
            disabled={travando}
            aria-label="Autor anterior"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "36px", height: "36px", flexShrink: 0, fontSize: "16px", color: "#002776", opacity: travando ? 0.5 : 1 }}
          >
            ‹
          </button>
          <button
            onClick={() => passo(1)}
            disabled={travando}
            aria-label="Próximo autor"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "36px", height: "36px", flexShrink: 0, fontSize: "16px", color: "#002776", opacity: travando ? 0.5 : 1 }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
