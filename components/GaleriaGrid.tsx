"use client";

import { useState } from "react";
import Lightbox from "./Lightbox";

type Foto = { id: string; url: string; titulo: string };

export default function GaleriaGrid({ fotos }: { fotos: Foto[] }) {
  const [index, setIndex] = useState<number | null>(null);

  return (
    <>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "16px" }}>
        {fotos.map((f, i) => (
          <div
            key={f.id}
            title={f.titulo}
            onClick={() => setIndex(i)}
            style={{ aspectRatio: "1", borderRadius: "4px", background: `center / cover no-repeat url(${f.url})`, cursor: "pointer" }}
          />
        ))}
      </div>
      {index !== null && (
        <Lightbox
          fotos={fotos.map((f) => ({ url: f.url, titulo: f.titulo }))}
          index={index}
          onClose={() => setIndex(null)}
          onNavigate={setIndex}
        />
      )}
    </>
  );
}
