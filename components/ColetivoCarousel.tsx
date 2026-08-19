"use client";

import { useEffect, useState } from "react";

const IMAGENS = [
  "/coletivo-carrossel-1.webp",
  "/coletivo-carrossel-2.webp",
  "/coletivo-carrossel-3.webp",
  "/coletivo-carrossel-4.webp",
  "/coletivo-carrossel-5.webp",
  "/coletivo-carrossel-6.webp",
  "/coletivo-carrossel-7.webp",
  "/coletivo-carrossel-8.webp",
  "/coletivo-carrossel-9.webp",
];

const VISIVEIS = 3;

export default function ColetivoCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % IMAGENS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  function anterior() {
    setIndex((i) => (i - 1 + IMAGENS.length) % IMAGENS.length);
  }

  function proxima() {
    setIndex((i) => (i + 1) % IMAGENS.length);
  }

  const visiveis = Array.from({ length: VISIVEIS }, (_, offset) => IMAGENS[(index + offset) % IMAGENS.length]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={anterior}
          aria-label="Foto anterior"
          style={{
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#F6F6F6",
            border: "none",
            fontSize: "16px",
            color: "#002776",
            fontWeight: 700,
          }}
        >
          ‹
        </button>

        <div className="responsive-grid" style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {visiveis.map((src, i) => (
            <div
              key={`${src}-${i}`}
              style={{
                backgroundImage: `url(${src})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                aspectRatio: "1",
                borderRadius: "8px",
              }}
            />
          ))}
        </div>

        <button
          onClick={proxima}
          aria-label="Próxima foto"
          style={{
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "#F6F6F6",
            border: "none",
            fontSize: "16px",
            color: "#002776",
            fontWeight: 700,
          }}
        >
          ›
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
        {IMAGENS.map((src, i) => (
          <button
            key={src}
            onClick={() => setIndex(i)}
            aria-label={`Ir para foto ${i + 1}`}
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: i === index ? "#002776" : "#DDD",
              border: "none",
              padding: 0,
            }}
          />
        ))}
      </div>
    </div>
  );
}
