"use client";

import { useState } from "react";
import Link from "next/link";
import { initials } from "@/lib/format";

type AutorDestaque = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  generos: string[];
};

const POR_PAGINA = 3;

function agruparEmPaginas(autores: AutorDestaque[]): AutorDestaque[][] {
  const paginas: AutorDestaque[][] = [];
  for (let i = 0; i < autores.length; i += POR_PAGINA) {
    paginas.push(autores.slice(i, i + POR_PAGINA));
  }
  return paginas;
}

export default function AutoresDestaqueCarousel({ autores }: { autores: AutorDestaque[] }) {
  const [index, setIndex] = useState(0);
  const paginas = agruparEmPaginas(autores);

  const prev = () => setIndex((i) => (i - 1 + paginas.length) % paginas.length);
  const next = () => setIndex((i) => (i + 1) % paginas.length);

  return (
    <div>
      <div className="autores-destaque-grid">
        {paginas.map((pagina, i) => (
          <div key={i} className={`autores-destaque-pagina${i === index ? " autores-destaque-ativa" : ""}`}>
            {pagina.map((a) => (
              <div key={a.id} style={{ background: "#F6F6F6", padding: "24px", borderRadius: "8px", textAlign: "center" }}>
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
            ))}
          </div>
        ))}
      </div>
      {paginas.length > 1 && (
        <div className="autores-destaque-nav" style={{ alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "20px" }}>
          <button
            onClick={prev}
            aria-label="Autores anteriores"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "36px", height: "36px", flexShrink: 0, fontSize: "16px", color: "#002776" }}
          >
            ‹
          </button>
          <div style={{ display: "flex", gap: "8px" }}>
            {paginas.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`Ir para o grupo ${i + 1} de autores`}
                style={{ width: "8px", height: "8px", borderRadius: "50%", background: i === index ? "#002776" : "#DDD", padding: 0 }}
              />
            ))}
          </div>
          <button
            onClick={next}
            aria-label="Próximos autores"
            style={{ background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "36px", height: "36px", flexShrink: 0, fontSize: "16px", color: "#002776" }}
          >
            ›
          </button>
        </div>
      )}
    </div>
  );
}
