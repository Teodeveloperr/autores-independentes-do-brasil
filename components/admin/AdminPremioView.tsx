"use client";

import { useMemo, useState } from "react";
import { baixarCsv } from "@/lib/csv";
import { PREMIO_CATEGORIAS } from "@/lib/premio";
import type { InscricaoPremioRow } from "./types";

const card: React.CSSProperties = { background: "white", borderRadius: "10px", padding: "20px" };

function dataHora(d: Date): string {
  return new Date(d).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
}

// Inscrições do 1º Prêmio Autores do Brasil de Literatura 2027 (formulário público em /premio).
// Os arquivos de cada inscrição chegam por e-mail à organização, com links de download.
export default function AdminPremioView({ inscricoes }: { inscricoes: InscricaoPremioRow[] }) {
  const [categoria, setCategoria] = useState("");
  const [busca, setBusca] = useState("");

  const porCategoria = useMemo(() => {
    const m = new Map<string, number>(PREMIO_CATEGORIAS.map((c) => [c, 0]));
    for (const i of inscricoes) m.set(i.categoria, (m.get(i.categoria) ?? 0) + 1);
    return [...m.entries()];
  }, [inscricoes]);

  const hoje = new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const hojeQtd = inscricoes.filter((i) => new Date(i.createdAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) === hoje).length;
  const autoresUnicos = new Set(inscricoes.map((i) => i.email.toLowerCase())).size;

  const termo = busca.trim().toLowerCase();
  const lista = inscricoes.filter(
    (i) =>
      (!categoria || i.categoria === categoria) &&
      (!termo || [i.nome, i.nomeArtistico, i.email, i.titulo].some((t) => t.toLowerCase().includes(termo)))
  );

  function exportar() {
    baixarCsv(
      "inscricoes-premio.csv",
      ["Nº", "Data", "Nome completo", "Nome artístico", "Telefone", "E-mail", "Título do livro", "Categoria"],
      lista.map((i) => [i.numero, dataHora(i.createdAt), i.nome, i.nomeArtistico, i.telefone, i.email, i.titulo, i.categoria])
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Prêmio literário 2027</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {[
          ["Inscrições recebidas", inscricoes.length],
          ["Hoje", hojeQtd],
          ["Autores diferentes", autoresUnicos],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} style={card}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>{valor}</div>
            <div style={{ fontSize: "13px", color: "#666" }}>{rotulo}</div>
          </div>
        ))}
      </div>

      <div style={{ ...card, marginBottom: "20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Por categoria</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px 24px" }}>
          {porCategoria.map(([nome, qtd]) => (
            <div key={nome} style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", borderBottom: "1px solid #EEE", padding: "6px 0" }}>
              <span>{nome}</span>
              <b>{qtd}</b>
            </div>
          ))}
        </div>
        <p style={{ fontSize: "12px", color: "#666", margin: "12px 0 0" }}>
          Conta as inscrições feitas no site a partir de 23/11/2026; o pagamento da taxa é conferido pela organização.
        </p>
      </div>

      <div style={card}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
          <input
            type="search"
            value={busca}
            onChange={(ev) => setBusca(ev.target.value)}
            placeholder="Buscar por nome, e-mail ou título"
            style={{ flex: "1 1 240px", padding: "10px 12px", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "14px" }}
          />
          <select value={categoria} onChange={(ev) => setCategoria(ev.target.value)} style={{ padding: "10px 12px", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "14px" }}>
            <option value="">Todas as categorias</option>
            {PREMIO_CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button onClick={exportar} disabled={lista.length === 0} style={{ background: "#009B3A", color: "white", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: 600, fontSize: "14px" }}>
            Exportar CSV ({lista.length})
          </button>
        </div>

        {lista.length === 0 ? (
          <p style={{ color: "#666", fontSize: "14px" }}>{inscricoes.length === 0 ? "Nenhuma inscrição recebida ainda." : "Nenhuma inscrição com esse filtro."}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#666" }}>
                  {["Nº", "Data", "Autor(a)", "Contato", "Livro", "Categoria"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", borderBottom: "2px solid #EEE" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((i) => (
                  <tr key={i.id} style={{ verticalAlign: "top" }}>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE" }}>{i.numero}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE", whiteSpace: "nowrap" }}>{dataHora(i.createdAt)}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE" }}>
                      <b>{i.nome}</b>
                      <br />
                      <span style={{ color: "#666" }}>{i.nomeArtistico}</span>
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE" }}>
                      {i.email}
                      <br />
                      <span style={{ color: "#666" }}>{i.telefone}</span>
                    </td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE" }}>{i.titulo}</td>
                    <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE" }}>{i.categoria}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
