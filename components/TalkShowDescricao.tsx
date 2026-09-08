"use client";

import { useEffect, useRef, useState } from "react";

const LINHAS_FECHADO = 3;

export default function TalkShowDescricao({ texto }: { texto: string }) {
  const [expandido, setExpandido] = useState(false);
  const [truncavel, setTruncavel] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (ref.current) {
      setTruncavel(ref.current.scrollHeight > ref.current.clientHeight + 1);
    }
  }, [texto]);

  return (
    <div>
      <p
        ref={ref}
        style={{
          fontSize: "13px",
          color: "#666",
          lineHeight: 1.6,
          margin: 0,
          whiteSpace: "pre-line",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: expandido ? "unset" : LINHAS_FECHADO,
          overflow: expandido ? "visible" : "hidden",
        }}
      >
        {texto}
      </p>
      {(truncavel || expandido) && (
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          style={{ background: "none", border: "none", padding: 0, marginTop: "6px", color: "#002776", fontWeight: 600, fontSize: "12px", cursor: "pointer" }}
        >
          {expandido ? "Mostrar menos" : "...mais"}
        </button>
      )}
    </div>
  );
}
