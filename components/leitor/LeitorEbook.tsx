"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type PaginaInfo = { numero: number; largura: number; altura: number };

const ZOOMS = [1, 1.25, 1.5, 2];
const LARGURA_BASE = 900; // largura máxima da página (px) no zoom 1, em telas grandes

// ---------------------------------------------------------------------------------------------
// Uma página: só baixa a imagem quando chega perto da tela e solta a memória quando se afasta.
// A imagem vem de /api/ler/<livro>/<n>, que confere o acesso e grava a marca d'água do leitor.
// ---------------------------------------------------------------------------------------------
function Pagina({ livroId, info, perto, onSessaoExpirada }: { livroId: string; info: PaginaInfo; perto: boolean; onSessaoExpirada: () => void }) {
  const [src, setSrc] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const urlAtual = useRef<string | null>(null);

  useEffect(() => {
    if (!perto) {
      if (urlAtual.current) {
        URL.revokeObjectURL(urlAtual.current);
        urlAtual.current = null;
        setSrc(null);
      }
      return;
    }
    if (urlAtual.current) return;

    let cancelado = false;
    (async () => {
      try {
        const res = await fetch(`/api/ler/${livroId}/${info.numero}`, { credentials: "same-origin", cache: "no-store" });
        if (res.status === 401) {
          if (!cancelado) onSessaoExpirada();
          return;
        }
        if (!res.ok) throw new Error(res.status === 429 ? "Muitas páginas em pouco tempo. Aguarde um instante." : "Não foi possível carregar a página.");
        const url = URL.createObjectURL(await res.blob());
        if (cancelado) {
          URL.revokeObjectURL(url);
          return;
        }
        urlAtual.current = url;
        setErro(null);
        setSrc(url);
      } catch (e) {
        if (!cancelado) setErro(e instanceof Error ? e.message : "Não foi possível carregar a página.");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [perto, livroId, info.numero, tentativa, onSessaoExpirada]);

  useEffect(
    () => () => {
      if (urlAtual.current) URL.revokeObjectURL(urlAtual.current);
    },
    []
  );

  return (
    <div
      data-pagina={info.numero}
      style={{ position: "relative", width: "100%", aspectRatio: `${info.largura} / ${info.altura}`, background: "#fff", boxShadow: "0 2px 14px rgba(0,0,0,.45)", marginBottom: "14px" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Página ${info.numero}`} draggable={false} style={{ display: "block", width: "100%", height: "100%", userSelect: "none", WebkitTouchCallout: "none" }} />
      ) : (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", color: "#999", fontSize: "13px" }}>
          {erro ? (
            <>
              <span style={{ maxWidth: "80%", textAlign: "center" }}>{erro}</span>
              <button type="button" onClick={() => { setErro(null); setTentativa((t) => t + 1); }} style={{ background: "#002776", color: "white", padding: "6px 14px", borderRadius: "4px", fontSize: "12px", fontWeight: 600 }}>
                Tentar de novo
              </button>
            </>
          ) : (
            <span>Página {info.numero}</span>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------
// Leitor: rolagem vertical contínua, zoom, ir para a página, tela cheia e lembrança de onde parou
// (neste aparelho).
// ---------------------------------------------------------------------------------------------
export default function LeitorEbook({ livroId, titulo, autor, paginas }: { livroId: string; titulo: string; autor: string; paginas: PaginaInfo[] }) {
  const total = paginas.length;
  const chaveProgresso = `leitura-${livroId}`;
  const [atual, setAtual] = useState(1);
  const [vizinhas, setVizinhas] = useState<Set<number>>(() => new Set([1, 2, 3]));
  const [zoomIdx, setZoomIdx] = useState(0);
  const [expirada, setExpirada] = useState(false);
  const [irPara, setIrPara] = useState("");
  const raiz = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLDivElement>(null);
  const ultimoSalvo = useRef(0);
  const sessaoExpirada = useCallback(() => setExpirada(true), []);

  // Quais páginas estão perto da tela (carrega) e qual está no meio (página atual).
  useEffect(() => {
    const container = lista.current;
    if (!container) return;
    const elementos = Array.from(container.querySelectorAll<HTMLElement>("[data-pagina]"));

    const proximas = new IntersectionObserver(
      (entradas) => {
        setVizinhas((prev) => {
          const novo = new Set(prev);
          for (const e of entradas) {
            const n = Number((e.target as HTMLElement).dataset.pagina);
            if (e.isIntersecting) novo.add(n);
            else novo.delete(n);
          }
          return novo;
        });
      },
      { rootMargin: "1400px 0px 1400px 0px" }
    );
    const meio = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) if (e.isIntersecting) setAtual(Number((e.target as HTMLElement).dataset.pagina));
      },
      { rootMargin: "-45% 0px -45% 0px" }
    );
    elementos.forEach((el) => {
      proximas.observe(el);
      meio.observe(el);
    });
    return () => {
      proximas.disconnect();
      meio.disconnect();
    };
  }, [paginas, zoomIdx]);

  // Volta para onde parou (guardado só neste aparelho). Só depois disso o progresso passa a ser
  // gravado: senão a página 1, que aparece primeiro, sobrescreveria o que estava guardado.
  const podeGravar = useRef(false);
  useEffect(() => {
    let salvo = 0;
    try {
      salvo = Number(window.localStorage.getItem(chaveProgresso));
    } catch {
      // sem armazenamento: começa da primeira página
    }
    const retomar = Number.isInteger(salvo) && salvo > 1 && salvo <= total;
    let quadro = 0;
    let liberar: ReturnType<typeof setTimeout> | undefined;
    if (retomar) {
      quadro = requestAnimationFrame(() => {
        lista.current?.querySelector(`[data-pagina="${salvo}"]`)?.scrollIntoView({ block: "start" });
      });
      liberar = setTimeout(() => {
        podeGravar.current = true;
      }, 900);
    } else {
      podeGravar.current = true;
    }
    return () => {
      cancelAnimationFrame(quadro);
      if (liberar) clearTimeout(liberar);
    };
  }, [chaveProgresso, total]);

  useEffect(() => {
    if (!podeGravar.current) return;
    const agora = Date.now();
    if (agora - ultimoSalvo.current < 800) return;
    ultimoSalvo.current = agora;
    try {
      window.localStorage.setItem(chaveProgresso, String(atual));
    } catch {
      // ignora
    }
  }, [atual, chaveProgresso]);

  function irParaPagina(n: number) {
    const alvo = Math.min(total, Math.max(1, n));
    lista.current?.querySelector(`[data-pagina="${alvo}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  function telaCheia() {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void raiz.current?.requestFullscreen?.();
  }

  const zoom = ZOOMS[zoomIdx];
  const botao: React.CSSProperties = { background: "#2a2a2a", color: "#eee", border: "1px solid #444", padding: "7px 12px", borderRadius: "6px", fontSize: "13px", fontWeight: 600 };

  return (
    <div ref={raiz} className="leitor-raiz" style={{ minHeight: "100vh", background: "#1a1a1a", color: "#eee", userSelect: "none", WebkitUserSelect: "none" }} onContextMenu={(e) => e.preventDefault()}>
      <style>{`@media print { .leitor-raiz { display: none !important; } }`}</style>

      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(20,20,20,.96)", borderBottom: "1px solid #333", padding: "10px 16px", display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <a href="/estante" style={{ ...botao, textDecoration: "none", color: "#eee" }}>← Estante</a>
        <div style={{ flex: "1 1 160px", minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: "14px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{titulo}</div>
          <div style={{ fontSize: "12px", color: "#aaa", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{autor}</div>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = parseInt(irPara, 10);
            if (Number.isFinite(n)) irParaPagina(n);
            setIrPara("");
          }}
          style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
        >
          <input
            value={irPara}
            onChange={(e) => setIrPara(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder={String(atual)}
            aria-label="Ir para a página"
            style={{ width: "54px", padding: "6px", borderRadius: "6px", border: "1px solid #444", background: "#2a2a2a", color: "#eee", textAlign: "center", userSelect: "text" }}
          />
          <span style={{ color: "#aaa" }}>/ {total}</span>
        </form>
        <button type="button" style={botao} aria-label="Diminuir o zoom" onClick={() => setZoomIdx((i) => Math.max(0, i - 1))} disabled={zoomIdx === 0}>−</button>
        <span style={{ fontSize: "12px", color: "#aaa", minWidth: "38px", textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
        <button type="button" style={botao} aria-label="Aumentar o zoom" onClick={() => setZoomIdx((i) => Math.min(ZOOMS.length - 1, i + 1))} disabled={zoomIdx === ZOOMS.length - 1}>+</button>
        <button type="button" style={botao} onClick={telaCheia}>Tela cheia</button>
      </div>

      {expirada && (
        <div role="alert" style={{ background: "#7a1f1f", color: "white", padding: "12px 16px", fontSize: "14px", textAlign: "center" }}>
          Sua sessão terminou (ou você entrou em outro aparelho além do limite). <a href="/entrar" style={{ color: "white", fontWeight: 700 }}>Entrar de novo</a>
        </div>
      )}

      <div style={{ overflowX: zoom > 1 ? "auto" : "hidden", padding: "18px 12px 60px" }}>
        <div ref={lista} style={{ width: `${zoom * 100}%`, maxWidth: `${LARGURA_BASE * zoom}px`, margin: "0 auto" }}>
          {paginas.map((p) => (
            <Pagina key={p.numero} livroId={livroId} info={p} perto={vizinhas.has(p.numero)} onSessaoExpirada={sessaoExpirada} />
          ))}
        </div>
      </div>
    </div>
  );
}
