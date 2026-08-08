"use client";

import { useState } from "react";
import Link from "next/link";
import { initials } from "@/lib/format";

const GENERO_FILTROS = ["Romance", "Poesia", "Fantasia", "Terror", "Ficção Científica"];

type AuthorItem = {
  id: string;
  nome: string;
  generos: string[];
  fotoUrl: string | null;
};

export default function AutoresGrid({ authors }: { authors: AuthorItem[] }) {
  const [generoAtivo, setGeneroAtivo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const filtrados = authors.filter((a) => {
    const passaGenero = !generoAtivo || a.generos.includes(generoAtivo);
    const passaBusca = !busca.trim() || a.nome.toLowerCase().includes(busca.trim().toLowerCase());
    return passaGenero && passaBusca;
  });

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#002776" : "white",
    color: active ? "white" : "#262626",
    border: active ? "none" : "1px solid #DDD",
    padding: "8px 20px",
    borderRadius: "4px",
    fontSize: "14px",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
  });

  return (
    <>
      <div style={{ display: "flex", gap: "24px", marginBottom: "40px", flexWrap: "wrap" }}>
        <button onClick={() => setGeneroAtivo(null)} style={btnStyle(generoAtivo === null)}>
          Todos
        </button>
        {GENERO_FILTROS.map((g) => (
          <button key={g} onClick={() => setGeneroAtivo(g)} style={btnStyle(generoAtivo === g)}>
            {g}
          </button>
        ))}
        <input
          type="text"
          placeholder="Buscar autor..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            if (e.target.value.trim()) setGeneroAtivo(null);
          }}
          style={{ marginLeft: "auto", padding: "8px 16px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }}
        />
      </div>
      {filtrados.length > 0 ? (
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
          {filtrados.map((a) => (
            <div key={a.id} style={{ background: "#F6F6F6", padding: "24px", borderRadius: "8px", textAlign: "center" }}>
              <div
                style={{
                  width: "120px",
                  height: "120px",
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
              <div style={{ fontWeight: 700, marginBottom: "8px" }}>{a.nome}</div>
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
      ) : (
        <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>
            {authors.length === 0 ? "Ainda não há autores cadastrados no coletivo." : "Nenhum autor encontrado com esse filtro."}
          </p>
          {authors.length === 0 && (
            <Link href="/cadastro" style={{ display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
              Seja o primeiro a se cadastrar →
            </Link>
          )}
        </div>
      )}
    </>
  );
}
