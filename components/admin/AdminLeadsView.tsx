"use client";

import { useState } from "react";
import { baixarCsv } from "@/lib/csv";
import type { LeadEbookRow } from "./types";

const card: React.CSSProperties = { background: "white", borderRadius: "10px", padding: "20px" };
const sp = { timeZone: "America/Sao_Paulo" } as const;

function dataHora(d: Date): string {
  return new Date(d).toLocaleString("pt-BR", { ...sp, dateStyle: "short", timeStyle: "short" });
}

/** Link do WhatsApp para número brasileiro (com ou sem 55), ou null se não der para montar. */
function linkWhatsapp(numero: string): string | null {
  let d = numero.replace(/\D/g, "");
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  return /^55\d{10,11}$/.test(d) ? `https://wa.me/${d}` : null;
}

// Quem baixou o e-book gratuito pelo pop-up do blog (app/blog/ebook-actions.ts).
// Uma linha por pessoa: pedir de novo atualiza os dados e soma em "Downloads".
export default function AdminLeadsView({ leads }: { leads: LeadEbookRow[] }) {
  const [busca, setBusca] = useState("");

  const hoje = new Date().toLocaleDateString("pt-BR", sp);
  const hojeQtd = leads.filter((l) => new Date(l.createdAt).toLocaleDateString("pt-BR", sp) === hoje).length;
  const totalDownloads = leads.reduce((s, l) => s + l.downloads, 0);

  const termo = busca.trim().toLowerCase();
  const lista = leads.filter((l) => !termo || [l.nome, l.email, l.whatsapp].some((t) => t.toLowerCase().includes(termo)));

  function exportar() {
    baixarCsv(
      "leads-ebook.csv",
      ["Nº", "Cadastro", "Nome", "E-mail", "WhatsApp", "Origem", "Downloads", "Último pedido"],
      lista.map((l) => [l.numero, dataHora(l.createdAt), l.nome, l.email, l.whatsapp, l.origem ?? "", l.downloads, dataHora(l.ultimoPedidoEm)])
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: "26px", fontWeight: 700, color: "#002776", marginBottom: "6px" }}>Leads do e-book</h1>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Pessoas que preencheram o pop-up do blog para baixar o <b>Guia do Autor Independente</b>. Todas aceitaram receber contato por e-mail e WhatsApp.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
        {[
          ["Pessoas cadastradas", leads.length],
          ["Hoje", hojeQtd],
          ["Downloads no total", totalDownloads],
        ].map(([rotulo, valor]) => (
          <div key={rotulo} style={card}>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>{valor}</div>
            <div style={{ fontSize: "13px", color: "#666" }}>{rotulo}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "16px", alignItems: "center" }}>
          <input
            type="search"
            value={busca}
            onChange={(ev) => setBusca(ev.target.value)}
            placeholder="Buscar por nome, e-mail ou WhatsApp"
            style={{ flex: "1 1 240px", padding: "10px 12px", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "14px" }}
          />
          <button onClick={exportar} disabled={lista.length === 0} style={{ background: "#009B3A", color: "white", border: "none", padding: "10px 18px", borderRadius: "6px", fontWeight: 600, fontSize: "14px" }}>
            Exportar CSV ({lista.length})
          </button>
        </div>

        {lista.length === 0 ? (
          <p style={{ color: "#666", fontSize: "14px" }}>{leads.length === 0 ? "Ninguém baixou o e-book ainda." : "Nenhum lead com essa busca."}</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#666" }}>
                  {["Nº", "Cadastro", "Nome", "E-mail", "WhatsApp", "Origem", "Downloads"].map((h) => (
                    <th key={h} style={{ padding: "8px 10px", borderBottom: "2px solid #EEE" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((l) => {
                  const wa = linkWhatsapp(l.whatsapp);
                  return (
                    <tr key={l.id} style={{ verticalAlign: "top" }}>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE" }}>{l.numero}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE", whiteSpace: "nowrap" }}>{dataHora(l.createdAt)}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE" }}><b>{l.nome}</b></td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE" }}>{l.email}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE", whiteSpace: "nowrap" }}>
                        {wa ? (
                          <a href={wa} target="_blank" rel="noopener noreferrer" style={{ color: "#009B3A", fontWeight: 600 }}>{l.whatsapp}</a>
                        ) : (
                          l.whatsapp
                        )}
                      </td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE", color: "#666" }}>{l.origem ?? "-"}</td>
                      <td style={{ padding: "8px 10px", borderBottom: "1px solid #EEE" }}>{l.downloads}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
