"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { initials } from "@/lib/format";
import { extrairRegiao, extrairUf, type Regiao } from "@/lib/regioes";
import { temDestaque, PLANO_RANK } from "@/lib/plans";

const GENERO_FILTROS = ["Romance", "Poesia", "Fantasia", "Terror", "Ficção Científica"];
const REGIOES_ORDEM: Regiao[] = ["Nordeste", "Sudeste", "Norte", "Sul", "Centro-Oeste"];

type AuthorItem = {
  id: string;
  nome: string;
  generos: string[];
  fotoUrl: string | null;
  cidade: string | null;
  plano: string;
  profissoes: string | null;
  fraseApresentacao: string | null;
  numLivros: number;
  visualizacoes: number;
  anoEntrada: number;
  createdAt: string;
};

type Ordenacao = "padrao" | "acessados" | "novos" | "nome";

const ORDENACOES: { id: Ordenacao; label: string }[] = [
  { id: "padrao", label: "Padrão" },
  { id: "acessados", label: "Mais acessados" },
  { id: "novos", label: "Novos autores" },
  { id: "nome", label: "Nome (A-Z)" },
];

export default function AutoresGrid({ authors }: { authors: AuthorItem[] }) {
  const [generoAtivo, setGeneroAtivo] = useState<string | null>(null);
  const [regiaoAtiva, setRegiaoAtiva] = useState<Regiao | null>(null);
  const [estadoAtivo, setEstadoAtivo] = useState<string | null>(null);
  const [soEstreante, setSoEstreante] = useState(false);
  const [soDestaque, setSoDestaque] = useState(false);
  const [busca, setBusca] = useState("");
  const [ordenarPor, setOrdenarPor] = useState<Ordenacao>("padrao");

  const comLocalizacao = useMemo(
    () => authors.map((a) => ({ ...a, regiao: extrairRegiao(a.cidade), uf: extrairUf(a.cidade) })),
    [authors]
  );

  const contagemPorRegiao = useMemo(() => {
    const mapa = new Map<Regiao, number>();
    for (const a of comLocalizacao) {
      if (a.regiao) mapa.set(a.regiao, (mapa.get(a.regiao) ?? 0) + 1);
    }
    return mapa;
  }, [comLocalizacao]);

  const estadosDisponiveis = useMemo(() => {
    const ufs = new Set<string>();
    for (const a of comLocalizacao) {
      if (a.uf && (!regiaoAtiva || a.regiao === regiaoAtiva)) ufs.add(a.uf);
    }
    return [...ufs].sort();
  }, [comLocalizacao, regiaoAtiva]);

  function onSelecionarRegiao(regiao: Regiao) {
    setRegiaoAtiva((atual) => (atual === regiao ? null : regiao));
    setEstadoAtivo(null);
  }

  function onLimparFiltros() {
    setGeneroAtivo(null);
    setRegiaoAtiva(null);
    setEstadoAtivo(null);
    setSoEstreante(false);
    setSoDestaque(false);
    setBusca("");
  }

  const filtrados = comLocalizacao.filter((a) => {
    if (generoAtivo && !a.generos.includes(generoAtivo)) return false;
    if (regiaoAtiva && a.regiao !== regiaoAtiva) return false;
    if (estadoAtivo && a.uf !== estadoAtivo) return false;
    if (soEstreante && a.numLivros !== 1) return false;
    if (soDestaque && !temDestaque(a.plano)) return false;
    if (busca.trim() && !a.nome.toLowerCase().includes(busca.trim().toLowerCase())) return false;
    return true;
  });

  const ordenados = [...filtrados].sort((a, b) => {
    if (ordenarPor === "acessados") return b.visualizacoes - a.visualizacoes;
    if (ordenarPor === "novos") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (ordenarPor === "nome") return a.nome.localeCompare(b.nome);
    return (
      (PLANO_RANK[b.plano] ?? 0) - (PLANO_RANK[a.plano] ?? 0) ||
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  const chipStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#002776" : "white",
    color: active ? "white" : "#262626",
    border: active ? "none" : "1px solid #DDD",
    padding: "7px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  const toggleChipStyle = (active: boolean): React.CSSProperties => ({
    background: active ? "#009B3A" : "white",
    color: active ? "white" : "#262626",
    border: active ? "none" : "1px solid #DDD",
    padding: "7px 16px",
    borderRadius: "20px",
    fontSize: "13px",
    fontWeight: active ? 600 : 400,
    cursor: "pointer",
    whiteSpace: "nowrap",
  });

  return (
    <>
      <div style={{ marginBottom: "40px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#002776", marginBottom: "16px" }}>🗺️ Descubra autores do Brasil inteiro</h2>
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
          {REGIOES_ORDEM.map((regiao) => (
            <button
              key={regiao}
              onClick={() => onSelecionarRegiao(regiao)}
              style={{
                background: regiaoAtiva === regiao ? "#002776" : "#F6F6F6",
                color: regiaoAtiva === regiao ? "white" : "#262626",
                border: "none",
                borderRadius: "8px",
                padding: "20px 12px",
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>🗺️</div>
              <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "4px" }}>{regiao}</div>
              <div style={{ fontSize: "12px", opacity: 0.8 }}>{contagemPorRegiao.get(regiao) ?? 0} autor{(contagemPorRegiao.get(regiao) ?? 0) === 1 ? "" : "es"}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#999", marginRight: "4px" }}>GÊNERO</span>
          <button onClick={() => setGeneroAtivo(null)} style={chipStyle(generoAtivo === null)}>Todos</button>
          {GENERO_FILTROS.map((g) => (
            <button key={g} onClick={() => setGeneroAtivo(g)} style={chipStyle(generoAtivo === g)}>{g}</button>
          ))}
        </div>
        {estadosDisponiveis.length > 0 && (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#999", marginRight: "4px" }}>ESTADO</span>
            <button onClick={() => setEstadoAtivo(null)} style={chipStyle(estadoAtivo === null)}>Todos</button>
            {estadosDisponiveis.map((uf) => (
              <button key={uf} onClick={() => setEstadoAtivo(uf)} style={chipStyle(estadoAtivo === uf)}>{uf}</button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#999", marginRight: "4px" }}>MAIS</span>
          <button onClick={() => setSoDestaque((v) => !v)} style={toggleChipStyle(soDestaque)}>⭐ Em destaque</button>
          <button onClick={() => setSoEstreante((v) => !v)} style={toggleChipStyle(soEstreante)}>🆕 Estreante</button>
          {(generoAtivo || regiaoAtiva || estadoAtivo || soEstreante || soDestaque || busca) && (
            <button onClick={onLimparFiltros} style={{ background: "none", border: "none", color: "#009B3A", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "24px" }}>
        <input
          type="text"
          placeholder="Buscar autor..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ padding: "8px 16px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px", flex: "1 1 220px" }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <label htmlFor="ordenarPor" style={{ color: "#666" }}>Ordenar por:</label>
          <select
            id="ordenarPor"
            value={ordenarPor}
            onChange={(e) => setOrdenarPor(e.target.value as Ordenacao)}
            style={{ padding: "8px 12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}
          >
            {ORDENACOES.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {ordenados.length > 0 ? (
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
          {ordenados.map((a) => (
            <div key={a.id} style={{ background: "#F6F6F6", padding: "24px", borderRadius: "8px", textAlign: "center", position: "relative" }}>
              {temDestaque(a.plano) && (
                <div style={{ position: "absolute", top: "12px", right: "12px", background: "#FFDF00", color: "#002776", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "10px" }}>
                  ⭐ DESTAQUE
                </div>
              )}
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
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>{a.nome}</div>
              {a.cidade && <div style={{ fontSize: "13px", color: "#666", marginBottom: "4px" }}>{a.cidade}</div>}
              <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>
                Escritor{a.profissoes ? ` | ${a.profissoes}` : ""}
              </div>
              <div style={{ fontSize: "12px", color: "#999", marginBottom: "10px" }}>{a.generos.join(", ") || "—"}</div>
              {a.fraseApresentacao && (
                <p style={{ fontSize: "13px", color: "#002776", fontStyle: "italic", lineHeight: 1.5, marginBottom: "10px" }}>
                  &quot;{a.fraseApresentacao}&quot;
                </p>
              )}
              <div style={{ fontSize: "13px", fontWeight: 600, color: "#009B3A", marginBottom: "16px" }}>
                {a.numLivros} livro{a.numLivros === 1 ? "" : "s"}
              </div>
              <Link
                href={`/perfil/${a.id}`}
                style={{ display: "block", textAlign: "center", background: "#002776", color: "white", padding: "10px 20px", fontWeight: 600, width: "100%", borderRadius: "4px", textDecoration: "none" }}
              >
                CONHECER AUTOR
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>
            {authors.length === 0 ? "Ainda não há autores cadastrados no coletivo." : "Nenhum autor encontrado com esses filtros."}
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
