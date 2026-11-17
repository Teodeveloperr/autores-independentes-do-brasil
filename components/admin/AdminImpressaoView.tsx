"use client";

import { useState, useTransition } from "react";
import { atualizarStatusPedidoImpressao, gerarLinkGraficaPedidoImpressao, reenviarEmailPedidoImpressao } from "@/app/admin/actions";
import { STATUS_IMPRESSAO, isbnLegivel, numeroDoPedidoImpressao, tamanhoLegivel } from "@/lib/impressao";
import { KITS, kitPorId, rotuloStatusKit, valorKit, valorParceiroKitCentavos } from "@/lib/kits";
import type { PedidoImpressaoAdminRow, PedidoKitAdminRow } from "./types";

const card: React.CSSProperties = { background: "white", borderRadius: "10px", padding: "20px" };
const badge = (cor: string, fundo: string): React.CSSProperties => ({ fontSize: "12px", fontWeight: 700, padding: "5px 12px", borderRadius: "12px", background: fundo, color: cor, whiteSpace: "nowrap" });

const COR_STATUS_IMPRESSAO: Record<string, string> = {
  enviado: "#C0392B",
  em_conferencia: "#A87900",
  prova_disponivel: "#002776",
  aprovado: "#6B4EAF",
  em_producao: "#A87900",
  concluido: "#009B3A",
  cancelado: "#999999",
};
const COR_STATUS_KIT: Record<string, string> = { aguardando_pagamento: "#C0392B", pago: "#009B3A", cancelado: "#999999" };

function data(d: Date): string {
  return new Date(d).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function Chips({ opcoes, valor, onChange }: { opcoes: Array<[string, string]>; valor: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
      {opcoes.map(([chave, rotulo]) => (
        <button
          key={chave}
          onClick={() => onChange(chave)}
          style={{
            background: valor === chave ? "#002776" : "white",
            color: valor === chave ? "white" : "#262626",
            border: valor === chave ? "none" : "1px solid #DDD",
            padding: "8px 16px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: 600,
          }}
        >
          {rotulo}
        </button>
      ))}
    </div>
  );
}

// ── Pedidos de impressão ──────────────────────────────────────────────────────────────────────────
function PedidoImpressaoCard({ p }: { p: PedidoImpressaoAdminRow }) {
  const [pendente, iniciar] = useTransition();
  const [erro, setErro] = useState("");
  const semConta = !p.authorId;
  const nome = p.author?.nome ?? p.contatoNome ?? "—";
  const email = p.author?.email ?? p.contatoEmail ?? "";

  function mudar(status: string) {
    setErro("");
    iniciar(async () => {
      const r = await atualizarStatusPedidoImpressao(p.id, status);
      if (r.error) setErro(r.error);
    });
  }

  const [pendenteLink, iniciarLink] = useTransition();
  const [links, setLinks] = useState<{ capa: string; miolo: string } | null>(null);
  const [aviso, setAviso] = useState<{ ok: boolean; texto: string } | null>(null);
  const [copiado, setCopiado] = useState("");

  function gerarLink() {
    if (!window.confirm("Gerar um novo link invalida o link anterior (inclusive o do e-mail e qualquer um que você já tenha mandado à gráfica). Continuar?")) return;
    setAviso(null);
    iniciarLink(async () => {
      const r = await gerarLinkGraficaPedidoImpressao(p.id);
      if (r.error || !r.capa || !r.miolo) setAviso({ ok: false, texto: r.error ?? "Não foi possível gerar o link." });
      else {
        setLinks({ capa: r.capa, miolo: r.miolo });
        setAviso({ ok: true, texto: "Link gerado. Copie e envie à gráfica; o link anterior não vale mais." });
      }
    });
  }

  function reenviarEmail() {
    if (!window.confirm("Reenviar o e-mail do pedido para contato@ com links novos? Os links anteriores deixam de funcionar.")) return;
    setAviso(null);
    setLinks(null);
    iniciarLink(async () => {
      const r = await reenviarEmailPedidoImpressao(p.id);
      setAviso(r.error ? { ok: false, texto: r.error } : { ok: true, texto: "E-mail reenviado para contato@ com os links novos." });
    });
  }

  async function copiar(rotuloLink: string, url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(rotuloLink);
      setTimeout(() => setCopiado(""), 2000);
    } catch {
      setAviso({ ok: false, texto: "Não foi possível copiar automaticamente. Selecione o link e copie." });
    }
  }

  const linhas: Array<[string, string]> = [
    ["Formato", p.formato],
    ["Páginas do miolo", String(p.paginas)],
    ["Tiragem", `${p.tiragem} exemplares`],
    ["ISBN", p.temIsbn ? (p.isbn ? isbnLegivel(p.isbn) : "Tem, número não informado") : "O livro não tem ISBN"],
    ["Miolo", `${p.mioloCor}, ${p.mioloPapel}`],
    ["Encadernação", p.encadernacao],
    ["Capa", `${p.capaPapel}, ${p.capaCor}, laminação ${p.laminacao.toLowerCase()}${p.orelhas ? ", com orelhas" : ""}`],
  ];

  return (
    <div style={{ ...card, padding: "16px 20px", display: "flex", flexDirection: "column", gap: "10px" }}>
      <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "240px" }}>
          <div style={{ fontWeight: 700, fontSize: "14px" }}>
            <span style={{ color: "#002776" }}>{numeroDoPedidoImpressao(p.numero)}</span> · {p.titulo}
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
            {data(p.createdAt)} · {p.tiragem} un. · {p.formato} ·{" "}
            <span style={{ fontWeight: 600 }}>{nome}</span>
            {p.pedidoKit && (
              <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: 700, padding: "1px 8px", borderRadius: "10px", background: "#E8F5EC", color: "#0B5D2A" }}>
                {(kitPorId(p.pedidoKit.kit)?.nome ?? "KIT").toUpperCase()} (kit #{p.pedidoKit.numero})
              </span>
            )}
            {semConta && <span style={{ marginLeft: "6px", fontSize: "11px", fontWeight: 700, padding: "1px 8px", borderRadius: "10px", background: "#FFF6CC", color: "#5c4800" }}>SEM CADASTRO</span>}
            {email && (
              <>
                {" "}· <a href={`mailto:${email}`} style={{ color: "#002776" }}>{email}</a>
              </>
            )}
            {p.contatoTelefone && <> · {p.contatoTelefone}</>}
          </div>
        </div>
        <label style={{ display: "flex", gap: "8px", alignItems: "center", fontSize: "12px", color: "#666" }}>
          Situação
          <select
            value={p.status}
            disabled={pendente}
            onChange={(e) => mudar(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #CFCFCF", fontWeight: 700, fontSize: "13px", color: COR_STATUS_IMPRESSAO[p.status] ?? "#262626", background: "white" }}
          >
            {Object.entries(STATUS_IMPRESSAO).map(([chave, rotulo]) => (
              <option key={chave} value={chave}>
                {rotulo}
              </option>
            ))}
          </select>
        </label>
      </div>
      {erro && <div role="alert" style={{ fontSize: "12px", color: "#A93226" }}>{erro}</div>}
      <details>
        <summary style={{ cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#002776" }}>Ver especificações e arquivos</summary>
        <dl style={{ margin: "12px 0", display: "grid", gridTemplateColumns: "auto 1fr", gap: "6px 16px", fontSize: "13px" }}>
          {linhas.map(([rotulo, valor]) => (
            <div key={rotulo} style={{ display: "contents" }}>
              <dt style={{ color: "#666" }}>{rotulo}</dt>
              <dd style={{ margin: 0, fontWeight: 500 }}>{valor}</dd>
            </div>
          ))}
        </dl>
        {p.observacoes && (
          <p style={{ margin: "0 0 12px", whiteSpace: "pre-wrap", background: "#F6F6F6", padding: "10px 12px", borderRadius: "8px", fontSize: "13px" }}>
            <b>Observações:</b> {p.observacoes}
          </p>
        )}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <a href={`/api/admin/impressao/${p.id}/capa`} style={{ background: "#002776", color: "white", padding: "9px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600 }}>
            Baixar capa ({tamanhoLegivel(p.capaBytes)})
          </a>
          <a href={`/api/admin/impressao/${p.id}/miolo`} style={{ background: "#002776", color: "white", padding: "9px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600 }}>
            Baixar miolo ({tamanhoLegivel(p.mioloBytes)})
          </a>
        </div>

        <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid #EEE", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "12px", color: "#666", lineHeight: 1.5 }}>
            Para a gráfica: gere um link de download (sem login) ou reenvie o e-mail do pedido para contato@. Em ambos os casos o link anterior deixa de funcionar.
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              disabled={pendenteLink}
              onClick={gerarLink}
              style={{ background: "white", border: "2px solid #002776", color: "#002776", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, opacity: pendenteLink ? 0.6 : 1 }}
            >
              {pendenteLink ? "Gerando..." : "Gerar link para a gráfica"}
            </button>
            <button
              type="button"
              disabled={pendenteLink}
              onClick={reenviarEmail}
              style={{ background: "white", border: "2px solid #002776", color: "#002776", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, opacity: pendenteLink ? 0.6 : 1 }}
            >
              Reenviar e-mail com os links
            </button>
          </div>
          {aviso && (
            <div role="status" style={{ fontSize: "13px", color: aviso.ok ? "#0B5D2A" : "#A93226", background: aviso.ok ? "#E8F5EC" : "#FDEDEC", padding: "8px 12px", borderRadius: "6px" }}>
              {aviso.texto}
            </div>
          )}
          {links && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {([["Capa", links.capa], ["Miolo", links.miolo]] as const).map(([rotuloLink, url]) => (
                <div key={rotuloLink} style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "12px", fontWeight: 700, width: "48px" }}>{rotuloLink}</span>
                  <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} style={{ flex: "1 1 280px", minWidth: 0, padding: "8px 10px", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "12px", fontFamily: "monospace" }} />
                  <button type="button" onClick={() => copiar(rotuloLink, url)} style={{ background: "#002776", color: "white", padding: "8px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 700 }}>
                    {copiado === rotuloLink ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </div>
  );
}

function PedidosImpressao({ pedidos }: { pedidos: PedidoImpressaoAdminRow[] }) {
  const [filtro, setFiltro] = useState("todos");
  const lista = pedidos.filter((p) => filtro === "todos" || p.status === filtro);
  const opcoes: Array<[string, string]> = [["todos", `Todos (${pedidos.length})`], ...Object.entries(STATUS_IMPRESSAO).map(([k, r]): [string, string] => [k, r])];

  return (
    <div>
      <Chips opcoes={opcoes} valor={filtro} onChange={setFiltro} />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {lista.map((p) => (
          <PedidoImpressaoCard key={p.id} p={p} />
        ))}
        {lista.length === 0 && <div style={{ ...card, textAlign: "center", color: "#666", fontSize: "14px", padding: "32px" }}>Nenhum pedido de impressão nesta categoria.</div>}
      </div>
    </div>
  );
}

// ── Kits da Bienal ────────────────────────────────────────────────────────────────────────────────
type ResumoRepasse = { transferido: number; pendente: number; erros: string[] };

function resumoDoRepasse(p: PedidoKitAdminRow): ResumoRepasse {
  const r: ResumoRepasse = { transferido: 0, pendente: 0, erros: [] };
  for (const pg of p.pagamentos) {
    if (pg.repasseStatus === "transferido") r.transferido += pg.repasseValorCentavos;
    else if (pg.repasseStatus !== "cancelado") r.pendente += pg.repasseValorCentavos;
    if (pg.repasseErro) r.erros.push(pg.repasseErro);
  }
  return r;
}

function PedidosKit({ pedidos }: { pedidos: PedidoKitAdminRow[] }) {
  const [filtro, setFiltro] = useState("todos");
  const lista = pedidos.filter((p) => filtro === "todos" || p.status === filtro);

  const pagos = pedidos.filter((p) => p.status === "pago");
  const recebido = pedidos.reduce((s, p) => s + p.pagamentos.filter((pg) => pg.repasseStatus !== "cancelado").reduce((t, pg) => t + pg.valorCentavos, 0), 0);
  const parceiroTotal = pedidos.reduce((s, p) => s + p.pagamentos.filter((pg) => pg.repasseStatus !== "cancelado").reduce((t, pg) => t + pg.repasseValorCentavos, 0), 0);
  const transferido = pedidos.reduce((s, p) => s + resumoDoRepasse(p).transferido, 0);

  const resumo: Array<[string, string, string]> = [
    ["Kits pagos", String(pagos.length), `${pedidos.length} pedido${pedidos.length === 1 ? "" : "s"} no total`],
    ["Recebido", valorKit(recebido), "soma dos pagamentos confirmados"],
    ["Parceiro (90%)", valorKit(parceiroTotal), `${valorKit(transferido)} já transferido`],
    ["Plataforma (10%)", valorKit(recebido - parceiroTotal), "fica na plataforma"],
  ];

  return (
    <div>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
        {resumo.map(([titulo, valor, sub]) => (
          <div key={titulo} style={card}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>{titulo}</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#002776" }}>{valor}</div>
            <div style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}>{sub}</div>
          </div>
        ))}
      </div>
      <Chips
        opcoes={[["todos", `Todos (${pedidos.length})`], ["pago", "Pagos"], ["aguardando_pagamento", "Aguardando pagamento"], ["cancelado", "Cancelados"]]}
        valor={filtro}
        onChange={setFiltro}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {lista.map((p) => {
          const kit = kitPorId(p.kit);
          const repasse = resumoDoRepasse(p);
          return (
            <div key={p.id} style={{ ...card, padding: "16px 20px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "240px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>
                    <span style={{ color: "#002776" }}>#{p.numero}</span> · {kit?.nome ?? p.kit} · {valorKit(p.valorCentavos)}{" "}
                    <span style={{ fontWeight: 500, color: "#666" }}>({p.parcelas > 1 ? `${p.parcelas}x de ${valorKit(p.valorCentavos / p.parcelas)} no cartão` : "à vista"})</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#666", marginTop: "2px" }}>
                    {data(p.createdAt)} · <span style={{ fontWeight: 600 }}>{p.nome}</span> · <a href={`mailto:${p.email}`} style={{ color: "#002776" }}>{p.email}</a> · {p.telefone}
                  </div>
                </div>
                <span style={badge(COR_STATUS_KIT[p.status] ?? "#666", "#F6F6F6")}>{rotuloStatusKit(p.status)}</span>
              </div>
              {p.pagamentos.length > 0 && (
                <div style={{ fontSize: "12px", color: "#444", lineHeight: 1.6 }}>
                  Pagamentos recebidos: {p.pagamentos.length} de {p.parcelas} · Parceiro: <b>{valorKit(repasse.transferido)}</b> transferido
                  {repasse.pendente > 0 && <> · <b>{valorKit(repasse.pendente)}</b> a transferir</>}
                  {" "}· Plataforma: {valorKit(p.pagamentos.filter((pg) => pg.repasseStatus !== "cancelado").reduce((t, pg) => t + pg.valorCentavos - pg.repasseValorCentavos, 0))}
                </div>
              )}
              {p.status === "pago" && (
                <div style={{ fontSize: "12px", color: p.impressao ? "#0B5D2A" : "#A87900", lineHeight: 1.6 }}>
                  {p.impressao
                    ? `Livro enviado: ${numeroDoPedidoImpressao(p.impressao.numero)} (${STATUS_IMPRESSAO[p.impressao.status] ?? p.impressao.status}). Veja na aba Pedidos de impressão.`
                    : "Ainda não enviou o livro para impressão (o cliente recebeu o link por e-mail)."}
                </div>
              )}
              {repasse.erros.map((e, i) => (
                <div key={i} role="alert" style={{ fontSize: "12px", color: "#A93226", background: "#FDEDEC", padding: "8px 12px", borderRadius: "6px" }}>
                  Repasse: {e}
                </div>
              ))}
              {p.pagamentos.some((pg) => pg.repasseStatus === "erro") && (
                <div style={{ fontSize: "11px", color: "#999" }}>Repasses com erro são tentados de novo automaticamente pela rotina diária.</div>
              )}
            </div>
          );
        })}
        {lista.length === 0 && <div style={{ ...card, textAlign: "center", color: "#666", fontSize: "14px", padding: "32px" }}>Nenhum kit nesta categoria.</div>}
      </div>
      <p style={{ fontSize: "11px", color: "#999", marginTop: "16px" }}>
        Kits: {Object.values(KITS).map((k) => `${k.nome} ${valorKit(k.valorCentavos)} (parceiro ${valorKit(valorParceiroKitCentavos(k.valorCentavos))})`).join(" · ")}.
      </p>
    </div>
  );
}

export default function AdminImpressaoView({ pedidosImpressao, pedidosKit }: { pedidosImpressao: PedidoImpressaoAdminRow[]; pedidosKit: PedidoKitAdminRow[] }) {
  const [aba, setAba] = useState<"impressao" | "kits">("impressao");

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Impressão e kits</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Pedidos de impressão de livros (do painel e da página pública) e os kits Prata e Ouro da Bienal. A situação do pedido de impressão que você escolhe aqui aparece para o autor.
      </p>
      <div role="tablist" style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "2px solid #E0E0E0" }}>
        {([["impressao", `🖨️ Pedidos de impressão (${pedidosImpressao.length})`], ["kits", `🎁 Kits da Bienal (${pedidosKit.length})`]] as const).map(([chave, rotulo]) => (
          <button
            key={chave}
            role="tab"
            aria-selected={aba === chave}
            onClick={() => setAba(chave)}
            style={{ padding: "10px 18px", fontSize: "14px", fontWeight: 700, background: "none", color: aba === chave ? "#002776" : "#777", borderBottom: aba === chave ? "3px solid #009B3A" : "3px solid transparent", marginBottom: "-2px" }}
          >
            {rotulo}
          </button>
        ))}
      </div>
      {aba === "impressao" ? <PedidosImpressao pedidos={pedidosImpressao} /> : <PedidosKit pedidos={pedidosKit} />}
    </div>
  );
}
