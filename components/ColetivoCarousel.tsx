"use client";

import { useEffect, useState } from "react";

const IMAGENS = [
  "/coletivo-carrossel-1.webp",
  "/coletivo-carrossel-2.webp",
  "/coletivo-carrossel-3.webp",
  "/coletivo-carrossel-4.webp",
];

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

  return (
    <div>
      <div style={{ position: "relative", borderRadius: "8px", overflow: "hidden", aspectRatio: "16/9" }}>
        {IMAGENS.map((src, i) => (
          <div
            key={src}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `url(${src})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: i === index ? 1 : 0,
              transition: "opacity 0.5s ease",
            }}
          />
        ))}

        <button
          onClick={anterior}
          aria-label="Foto anterior"
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.85)",
            border: "none",
            fontSize: "16px",
            color: "#002776",
            fontWeight: 700,
          }}
        >
          ‹
        </button>
        <button
          onClick={proxima}
          aria-label="Próxima foto"
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(255,255,255,0.85)",
            border: "none",
            fontSize: "16px",
            color: "#002776",
            fontWeight: 700,
          }}
        >
          ›
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
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
