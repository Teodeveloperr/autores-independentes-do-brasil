"use client";

import { useState } from "react";
import Image from "next/image";
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
            style={{ position: "relative", aspectRatio: "1", borderRadius: "4px", overflow: "hidden", cursor: "pointer" }}
          >
            <Image src={f.url} alt={f.titulo} fill sizes="(max-width: 768px) 33vw, 20vw" style={{ objectFit: "cover" }} />
            {f.titulo && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  padding: "20px 10px 8px",
                  background: "linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0))",
                  color: "white",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {f.titulo}
              </div>
            )}
          </div>
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
