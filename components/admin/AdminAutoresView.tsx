"use client";

import Link from "next/link";
import { initials } from "@/lib/format";
import type { AuthorWithCount } from "./types";

export default function AdminAutoresView({ autores }: { autores: AuthorWithCount[] }) {
  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Autores do Coletivo</h2>
      <div style={{ background: "white", borderRadius: "10px", overflow: "hidden" }}>
        {autores.map((a) => (
          <div key={a.id} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #F0F0F0" }}>
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "#002776",
                fontSize: "13px",
                flexShrink: 0,
                background: a.fotoUrl ? `center / cover no-repeat url(${a.fotoUrl})` : "#E0E0E0",
              }}
            >
              {!a.fotoUrl && initials(a.nome)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "14px" }}>{a.nome}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>{a.genero} • {a.cidade}</div>
            </div>
            <div style={{ fontSize: "12px", color: "#666", textAlign: "center", flexShrink: 0, width: "90px" }}>📚 {a._count.books} livros</div>
            <div style={{ fontSize: "12px", fontWeight: 700, textAlign: "center", flexShrink: 0, width: "130px", color: "#009B3A" }}>{a.plano}</div>
            <Link href={`/perfil/${a.id}`} style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "#002776", flexShrink: 0 }}>
              Ver perfil
            </Link>
          </div>
        ))}
        {autores.length === 0 && (
          <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>Nenhum autor cadastrado ainda.</div>
        )}
      </div>
    </div>
  );
}
