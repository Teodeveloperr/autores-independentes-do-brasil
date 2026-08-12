"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { removeReview } from "@/app/admin/actions";
import type { ReviewWithAuthor } from "./types";

export default function AdminAvaliacoesView({ avaliacoes }: { avaliacoes: ReviewWithAuthor[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onRemove(id: string) {
    const ok = window.confirm("Remover esta avaliação? Essa ação não pode ser desfeita.");
    if (!ok) return;
    startTransition(async () => {
      await removeReview(id);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Avaliações</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Avaliações deixadas por visitantes nos perfis públicos dos autores. Remover uma avaliação também recalcula a
        média exibida no perfil do autor.
      </p>
      <div style={{ background: "white", borderRadius: "10px", overflow: "hidden" }}>
        {avaliacoes.map((rv) => (
          <div key={rv.id} style={{ display: "flex", gap: "16px", alignItems: "flex-start", padding: "16px 20px", borderBottom: "1px solid #F0F0F0", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px", flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: "14px" }}>{rv.nome}</span>
                <span style={{ fontSize: "12px", color: "#999" }}>para {rv.author.nome}</span>
                <span style={{ fontSize: "12px", color: "#FFB800" }}>{"★".repeat(rv.estrelas)}{"☆".repeat(5 - rv.estrelas)}</span>
              </div>
              <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.5 }}>{rv.texto}</p>
              <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>{rv.createdAt.toLocaleDateString("pt-BR")}</div>
            </div>
            <button
              onClick={() => onRemove(rv.id)}
              disabled={pending}
              title="Remover avaliação"
              style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0, opacity: pending ? 0.6 : 1 }}
            >
              ✕
            </button>
          </div>
        ))}
        {avaliacoes.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>Nenhuma avaliação registrada ainda.</div>
        )}
      </div>
    </div>
  );
}
