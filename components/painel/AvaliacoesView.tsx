import type { AuthorWithRelations } from "./types";

export default function AvaliacoesView({ author }: { author: AuthorWithRelations }) {
  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Avaliações</h2>

      <div style={{ background: "white", borderRadius: "10px", padding: "20px", display: "flex", gap: "14px", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#6B4EAF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>⭐</div>
        <div>
          <div style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>
            {author.avaliacaoMedia?.toFixed(1) ?? "—"} <span style={{ color: "#FFB800", fontSize: "15px" }}>★★★★★</span>
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>Baseado em {author.avaliacoesQtd} avaliações</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {author.avaliacoes.map((rv) => (
          <div key={rv.id} style={{ background: "white", borderRadius: "10px", padding: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{rv.nome}</div>
                <div style={{ fontSize: "13px", color: "#FFB800" }}>{"★".repeat(rv.estrelas)}{"☆".repeat(5 - rv.estrelas)}</div>
              </div>
              <span style={{ fontSize: "12px", color: "#999", flexShrink: 0 }}>{rv.createdAt.toLocaleDateString("pt-BR")}</span>
            </div>
            <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6 }}>{rv.texto}</p>
          </div>
        ))}
        {author.avaliacoes.length === 0 && (
          <div style={{ background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
            Você ainda não recebeu avaliações.
          </div>
        )}
      </div>
    </div>
  );
}
