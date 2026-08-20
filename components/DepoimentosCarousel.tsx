"use client";

import { useEffect, useState } from "react";

type Depoimento = {
  nome: string;
  papel: string;
  texto: string;
};

const DEPOIMENTOS: Depoimento[] = [
  {
    nome: "Monique Evelyn",
    papel: "Leitora",
    texto: "O coletivo é um espaço de troca, aprendizado e crescimento para todos os escritores que fazem parte disso.",
  },
  {
    nome: "Gerailson José",
    papel: "Autor",
    texto:
      "Quem escreve sabe o peso da caminhada solo. O Coletivo Autores Independentes do Brasil me deu mais do que vitrine: me deu pertencimento. É bom demais olhar para o lado e ver tanta gente apaixonada pelo livro seguindo na mesma direção.",
  },
];

export default function DepoimentosCarousel() {
  const [index, setIndex] = useState(0);

  const prev = () => setIndex((i) => (i - 1 + DEPOIMENTOS.length) % DEPOIMENTOS.length);
  const next = () => setIndex((i) => (i + 1) % DEPOIMENTOS.length);
  const depoimento = DEPOIMENTOS[index];

  useEffect(() => {
    if (DEPOIMENTOS.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % DEPOIMENTOS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {DEPOIMENTOS.length > 1 && (
          <button
            onClick={prev}
            aria-label="Depoimento anterior"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "36px", height: "36px", flexShrink: 0, fontSize: "16px", color: "#002776" }}
          >
            ‹
          </button>
        )}
        <div style={{ flex: 1, background: "#F6F6F6", padding: "24px", borderRadius: "8px" }}>
          <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
            <div style={{ width: "40px", height: "40px", background: "#E0E0E0", borderRadius: "50%", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: "14px" }}>{depoimento.nome}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>{depoimento.papel}</div>
            </div>
          </div>
          <p style={{ fontSize: "14px", color: "#262626", lineHeight: 1.6 }}>{depoimento.texto}</p>
        </div>
        {DEPOIMENTOS.length > 1 && (
          <button
            onClick={next}
            aria-label="Próximo depoimento"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "36px", height: "36px", flexShrink: 0, fontSize: "16px", color: "#002776" }}
          >
            ›
          </button>
        )}
      </div>
      {DEPOIMENTOS.length > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "16px" }}>
          {DEPOIMENTOS.map((d, i) => (
            <button
              key={d.nome}
              onClick={() => setIndex(i)}
              aria-label={`Ir para o depoimento de ${d.nome}`}
              style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === index ? "#002776" : "#DDD", padding: 0 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
