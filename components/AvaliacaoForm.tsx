"use client";

import { useActionState, useState } from "react";
import { criarAvaliacao, type AvaliacaoState } from "@/app/perfil/[id]/actions";

const inputStyle: React.CSSProperties = { padding: "10px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" };

export default function AvaliacaoForm({ authorId }: { authorId: string }) {
  const [state, formAction, pending] = useActionState<AvaliacaoState, FormData>(criarAvaliacao, undefined);
  const [estrelas, setEstrelas] = useState(5);
  const [hover, setHover] = useState(0);

  if (state?.success) {
    return (
      <div style={{ background: "#E9F5EE", border: "1px solid #BFE3CE", borderRadius: "8px", padding: "20px", textAlign: "center", marginBottom: "24px" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "#009B3A" }}>Avaliação enviada, obrigado!</p>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      style={{ background: "#F6F6F6", borderRadius: "8px", padding: "20px", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}
    >
      <div style={{ fontWeight: 700, fontSize: "14px" }}>Deixe sua avaliação</div>
      <input type="hidden" name="authorId" value={authorId} />
      <input type="hidden" name="estrelas" value={estrelas} />
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setEstrelas(n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
            style={{ background: "none", border: "none", fontSize: "22px", lineHeight: 1, color: (hover || estrelas) >= n ? "#FFB800" : "#DDD", cursor: "pointer", padding: 0 }}
          >
            ★
          </button>
        ))}
      </div>
      <input name="nome" type="text" required placeholder="Seu nome" style={inputStyle} />
      <textarea name="texto" required placeholder="Como foi sua experiência com este(a) autor(a)?" style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} />
      {state?.error && (
        <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>{state.error}</div>
      )}
      <button
        type="submit"
        disabled={pending}
        style={{ background: "#009B3A", color: "white", padding: "10px", fontWeight: 600, borderRadius: "4px", fontSize: "13px", opacity: pending ? 0.7 : 1, alignSelf: "flex-start" }}
      >
        {pending ? "Enviando..." : "Enviar avaliação"}
      </button>
    </form>
  );
}
