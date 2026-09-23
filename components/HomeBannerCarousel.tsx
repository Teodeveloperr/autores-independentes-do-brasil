"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const AUTOPLAY_INTERVALO_MS = 6000;

type Banner = {
  id: string;
  emoji: string;
  titulo: string;
  texto: string;
  cta: string;
  href: string;
  background: string;
  color: string;
  ctaBackground: string;
  ctaColor: string;
};

const BANNERS: Banner[] = [
  {
    id: "premium-plus",
    emoji: "🏆",
    titulo: "Vire um Autor Premium+ e suba ao palco da Bienal 2027",
    texto: "Destaque nas páginas do coletivo, card exclusivo no Instagram e 2 horas suas numa Bienal do Livro — no plano anual.",
    cta: "QUERO SER PREMIUM+",
    href: "/assinatura",
    background: "#FFDF00",
    color: "#002776",
    ctaBackground: "#002776",
    ctaColor: "white",
  },
  {
    id: "bienal-rj-2027",
    emoji: "📚",
    titulo: "Autores do Brasil na Bienal do Livro do Rio de Janeiro 2027",
    texto: "De 03 a 12 de setembro de 2027 — autores Premium+ garantem presença no nosso estande.",
    cta: "SAIBA COMO PARTICIPAR",
    href: "/assinatura",
    background: "#002776",
    color: "white",
    ctaBackground: "#FFDF00",
    ctaColor: "#002776",
  },
];

// Troca de banner sozinho a cada alguns segundos, com fade-in/fade-out (ver
// .home-banner-fade em globals.css) — não pausa ao passar o mouse, mesmo padrão
// já usado no carrossel do blog (BlogCarousel).
export default function HomeBannerCarousel() {
  const [index, setIndex] = useState(0);
  const total = BANNERS.length;

  useEffect(() => {
    if (total <= 1) return;
    const intervalo = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, AUTOPLAY_INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, [total, index]);

  const banner = BANNERS[index];

  return (
    <div style={{ margin: "20px 40px 0" }}>
      <div
        key={banner.id}
        className="home-banner-fade responsive-flex-row section-pad-md"
        style={{
          background: banner.background,
          color: banner.color,
          padding: "32px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: "8px",
          gap: "16px",
          minHeight: "88px",
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "6px" }}>
            {banner.emoji} {banner.titulo}
          </div>
          <div style={{ fontSize: "14px" }}>{banner.texto}</div>
        </div>
        <Link
          href={banner.href}
          style={{
            flexShrink: 0,
            background: banner.ctaBackground,
            color: banner.ctaColor,
            padding: "12px 32px",
            fontWeight: 700,
            borderRadius: "4px",
            whiteSpace: "nowrap",
          }}
        >
          {banner.cta}
        </Link>
      </div>
      {total > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {BANNERS.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setIndex(i)}
              aria-label={`Ir para o banner ${i + 1}`}
              style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === index ? "#002776" : "#DDD", padding: 0 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
