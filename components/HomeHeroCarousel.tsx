"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const AUTOPLAY_INTERVALO_MS = 8000;
const TOTAL = 2;

const botaoPrincipal: React.CSSProperties = { background: "#009B3A", color: "white", padding: "12px 32px", fontWeight: 600, borderRadius: "4px", display: "inline-block" };
const botaoSecundario: React.CSSProperties = { background: "white", border: "2px solid #009B3A", color: "#009B3A", padding: "10px 32px", fontWeight: 600, borderRadius: "4px", display: "inline-block" };

// Hero da home em carrossel: 1) a apresentação do coletivo; 2) o 1º Prêmio Autores do Brasil de
// Literatura 2027. Os slides ficam empilhados na mesma célula da grade (só um visível), para a
// altura do hero não mudar a cada troca. Troca sozinho; os pontos permitem escolher.
export default function HomeHeroCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % TOTAL), AUTOPLAY_INTERVALO_MS);
    return () => clearTimeout(t);
  }, [index]);

  const slide = (i: number): React.CSSProperties => ({
    gridArea: "1 / 1",
    visibility: index === i ? "visible" : "hidden",
    opacity: index === i ? 1 : 0,
    transition: "opacity 600ms ease, visibility 600ms",
  });

  return (
    <div style={{ background: "white", padding: "0 0 24px" }}>
      <div style={{ display: "grid" }}>
        <section style={slide(0)} aria-hidden={index !== 0}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start", padding: "24px 40px 36px" }} className="responsive-grid section-pad-lg">
            <div>
              <h1 style={{ fontSize: "42px", fontWeight: 700, color: "#002776", lineHeight: 1.3, marginBottom: "24px" }}>
                Literatura
                <br />independente
                <br /><span style={{ color: "#009B3A" }}>conectando</span>
                <br /><span style={{ color: "#FFDF00" }}>autores e leitores</span>
              </h1>
              <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.6, marginBottom: "32px" }}>
                Somos um coletivo de escritores que acredita no poder das palavras para transformar o mundo.
              </p>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Link href="/livros" tabIndex={index === 0 ? 0 : -1} style={botaoPrincipal}>NOSSOS LIVROS</Link>
                <Link href="/coletivo" tabIndex={index === 0 ? 0 : -1} style={botaoSecundario}>O COLETIVO</Link>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Image src="/hero-logo.webp" alt="Logo do coletivo Autores Independentes do Brasil" width={1189} height={1263} priority style={{ width: "60%", maxWidth: "60%", height: "auto" }} />
            </div>
          </div>
        </section>

        <section style={slide(1)} aria-hidden={index !== 1} aria-label="1º Prêmio Autores do Brasil de Literatura 2027">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center", padding: "24px 40px 36px" }} className="responsive-grid section-pad-lg">
            <div>
              <p style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "1px", color: "#009B3A", marginBottom: "10px" }}>INSCRIÇÕES ABERTAS ATÉ 24 DE JANEIRO DE 2027</p>
              <h2 style={{ fontSize: "36px", fontWeight: 700, color: "#002776", lineHeight: 1.25, marginBottom: "20px" }}>
                1º Prêmio <span style={{ color: "#009B3A" }}>Autores do Brasil</span> de Literatura 2027
              </h2>
              <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.7, marginBottom: "28px" }}>
                Dez categorias, R$ 3.000,00 para cada vencedor e uma cerimônia de premiação na Bienal Internacional do Livro do Rio de Janeiro. Um reconhecimento à literatura brasileira, de novos talentos a nomes consagrados: a sua obra pode estar entre as premiadas.
              </p>
              <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                <Link href="/premio" tabIndex={index === 1 ? 0 : -1} style={botaoPrincipal}>PARTICIPAR</Link>
                <a href="/edital-1-premio-literario-autores-do-brasil-2027.pdf" target="_blank" rel="noopener" tabIndex={index === 1 ? 0 : -1} style={botaoSecundario}>LER O EDITAL</a>
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <Image src="/premio-hero.webp" alt="Selo do 1º Prêmio Autores do Brasil de Literatura 2027" width={900} height={900} style={{ width: "80%", maxWidth: "420px", height: "auto", borderRadius: "16px" }} />
            </div>
          </div>
        </section>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "10px" }} role="group" aria-label="Escolher slide">
        {Array.from({ length: TOTAL }, (_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ir para o slide ${i + 1}`}
            aria-current={index === i}
            style={{ width: "12px", height: "12px", borderRadius: "50%", border: "none", padding: 0, cursor: "pointer", background: index === i ? "#002776" : "#C8CDD8" }}
          />
        ))}
      </div>
    </div>
  );
}
