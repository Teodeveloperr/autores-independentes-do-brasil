"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { removerAssinaturaContratada, salvarAssinaturaContratada } from "@/app/admin/actions";
import SignaturePad from "@/components/contrato/SignaturePad";
import { baixarCsv, reais } from "@/lib/csv";
import { brl } from "@/lib/format";
import {
  DIAS_BIENAL,
  ESPACOS,
  PACOTES,
  PACOTES_CONTRATO,
  formatarNumeroContrato,
  type PacoteContrato,
  type TipoEspaco,
} from "@/lib/contrato/config";
import type { ContratoAdminRow } from "./types";

const card: React.CSSProperties = { background: "white", borderRadius: "10px", padding: "22px" };
const titulo: React.CSSProperties = { fontWeight: 700, color: "#002776", marginBottom: "12px" };
const th: React.CSSProperties = { textAlign: "left", padding: "8px 10px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em", color: "#666", borderBottom: "1px solid #E0E0E0", whiteSpace: "nowrap" };
const td: React.CSSProperties = { padding: "8px 10px", fontSize: "13px", borderBottom: "1px solid #F0F0F0", verticalAlign: "top" };
const campo: React.CSSProperties = { padding: "8px 10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" };

const ROTULO_STATUS: Record<string, { texto: string; fundo: string; cor: string }> = {
  assinado: { texto: "Aguardando pagamento", fundo: "#FFF6CC", cor: "#6b5400" },
  pago: { texto: "Pago", fundo: "#E3F4EA", cor: "#0a6130" },
  rascunho: { texto: "Não assinado", fundo: "#ECECF1", cor: "#3b4254" },
};

function dataBrasilia(d: Date | null): string {
  return d ? d.toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" }) : "";
}

function dataHora(d: Date | null): string {
  return d ? d.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" }) : "";
}

function numeroDe(c: ContratoAdminRow): string {
  return c.numero ? formatarNumeroContrato(c.numero) : "";
}

export default function AdminContratosView({
  contratos,
  assinaturaContratada,
}: {
  contratos: ContratoAdminRow[];
  assinaturaContratada: string | null;
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [de, setDe] = useState("");
  const [ate, setAte] = useState("");
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [novaAssinatura, setNovaAssinatura] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [salvou, setSalvou] = useState(false);

  // Rascunhos (quem ainda não assinou) não são contratos de verdade: ficam fora da lista e dos totais.
  const assinados = useMemo(() => contratos.filter((c) => c.status !== "rascunho"), [contratos]);
  const rascunhosAbertos = contratos.length - assinados.length;

  // O período filtra pela data do pagamento (contratos pagos) ou da assinatura (aguardando).
  const noPeriodo = useMemo(
    () =>
      assinados.filter((c) => {
        const dia = dataBrasilia(c.status === "pago" ? c.pagoEm : c.assinadoEm);
        return (!de || dia >= de) && (!ate || dia <= ate);
      }),
    [assinados, de, ate]
  );

  const resumo = useMemo(() => {
    const pagos = noPeriodo.filter((c) => c.status === "pago");
    const aguardando = noPeriodo.filter((c) => c.status === "assinado");
    const totalPago = pagos.reduce((s, c) => s + c.valorCentavos, 0);
    const comLiquido = pagos.filter((c) => c.valorLiquidoCentavos !== null);
    const liquido = comLiquido.reduce((s, c) => s + (c.valorLiquidoCentavos ?? 0), 0);
    const bruto = comLiquido.reduce((s, c) => s + c.valorCentavos, 0);
    const porPacote = PACOTES_CONTRATO.map((p) => {
      const lista = pagos.filter((c) => c.pacote === p);
      return { pacote: p, quantidade: lista.length, total: lista.reduce((s, c) => s + c.valorCentavos, 0) };
    });
    const porForma = (["pix", "cartao"] as const).map((f) => {
      const lista = pagos.filter((c) => c.formaPagamento === f);
      return { forma: f, quantidade: lista.length, total: lista.reduce((s, c) => s + c.valorCentavos, 0) };
    });
    return {
      quantidadePagos: pagos.length,
      totalPago,
      tarifa: bruto - liquido,
      liquido,
      semLiquido: pagos.length - comLiquido.length,
      totalAguardando: aguardando.reduce((s, c) => s + c.valorCentavos, 0),
      quantidadeAguardando: aguardando.length,
      porPacote,
      porForma,
    };
  }, [noPeriodo]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return noPeriodo
      .filter((c) => statusFiltro === "todos" || c.status === statusFiltro)
      .filter((c) => !termo || [c.nome, c.email, c.cpfCnpj, numeroDe(c)].some((v) => v.toLowerCase().includes(termo)))
      .sort((a, b) => (b.assinadoEm?.getTime() ?? 0) - (a.assinadoEm?.getTime() ?? 0));
  }, [noPeriodo, busca, statusFiltro]);

  // Agenda: só contratos assinados contam (rascunhos ainda não são horário de ninguém).
  const agendaPorDia = useMemo(() => {
    const mapa = new Map<string, { tipo: TipoEspaco; hora: number; nome: string; numero: string; confirmado: boolean }[]>();
    for (const c of assinados) {
      for (const r of c.reservas) {
        const dia = r.dia.toISOString().slice(0, 10);
        const itens = mapa.get(dia) ?? [];
        itens.push({ tipo: r.tipo as TipoEspaco, hora: r.horaInicio, nome: c.nome, numero: numeroDe(c), confirmado: r.status === "confirmado" });
        mapa.set(dia, itens);
      }
    }
    return mapa;
  }, [assinados]);

  function salvarAssinatura() {
    if (!novaAssinatura) return setErro("Faça a assinatura no quadro antes de salvar.");
    setErro("");
    setSalvou(false);
    iniciarTransicao(async () => {
      const resultado = await salvarAssinaturaContratada(novaAssinatura);
      if (resultado.error) return setErro(resultado.error);
      setSalvou(true);
      router.refresh();
    });
  }

  function removerAssinatura() {
    setErro("");
    iniciarTransicao(async () => {
      await removerAssinaturaContratada();
      router.refresh();
    });
  }

  function exportarContratos() {
    baixarCsv(
      "contratos-bienal.csv",
      ["Contrato", "Status", "Assinado em", "Pago em", "Nome", "CPF/CNPJ", "E-mail", "Telefone", "Pacote", "Forma de pagamento", "Valor de tabela", "Desconto (%)", "Valor", "Valor líquido"],
      lista.map((c) => [
        numeroDe(c),
        ROTULO_STATUS[c.status]?.texto ?? c.status,
        dataHora(c.assinadoEm),
        dataHora(c.pagoEm),
        c.nome,
        c.cpfCnpj,
        c.email,
        c.telefone,
        PACOTES[c.pacote as PacoteContrato]?.nome ?? c.pacote,
        c.formaPagamento === "pix" ? "Pix" : "Cartão",
        reais(c.valorTabelaCentavos),
        c.descontoPercentual,
        reais(c.valorCentavos),
        c.valorLiquidoCentavos !== null ? reais(c.valorLiquidoCentavos) : "",
      ])
    );
  }

  function exportarAgenda() {
    const linhas: (string | number)[][] = [];
    for (const dia of DIAS_BIENAL) {
      for (const item of (agendaPorDia.get(dia) ?? []).sort((a, b) => a.hora - b.hora)) {
        const fim = item.hora + ESPACOS[item.tipo].duracaoHoras;
        linhas.push([dia.split("-").reverse().join("/"), ESPACOS[item.tipo].rotulo, `${item.hora}h às ${fim}h`, item.nome, item.numero, item.confirmado ? "Confirmado" : "Aguardando pagamento"]);
      }
    }
    baixarCsv("agenda-bienal.csv", ["Dia", "Espaço", "Horário", "Contratante", "Contrato", "Situação"], linhas);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Contratos da Bienal</h2>
        <p style={{ fontSize: "13px", color: "#666" }}>Contratos feitos pelo site. Contratos fechados fora da plataforma (WhatsApp) não aparecem aqui.</p>
      </div>

      <div style={card}>
        <div style={titulo}>Assinatura da contratada</div>
        {assinaturaContratada ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- imagem em data URL guardada no banco */}
            <img src={assinaturaContratada} alt="Assinatura da contratada" style={{ maxWidth: "300px", maxHeight: "100px", border: "1px solid #E0E0E0", borderRadius: "6px", background: "white", padding: "6px" }} />
            <p style={{ fontSize: "12px", color: "#666" }}>Esta assinatura entra em todos os contratos gerados daqui para frente. Contratos já assinados não mudam.</p>
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#C0392B", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px", marginBottom: "10px" }}>
            Nenhuma assinatura cadastrada. A página pública do contrato fica indisponível até você cadastrar.
          </p>
        )}
        <details style={{ marginTop: "12px" }}>
          <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "13px", color: "#002776" }}>
            {assinaturaContratada ? "Trocar a assinatura" : "Cadastrar a assinatura"}
          </summary>
          <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <SignaturePad onChange={(png) => { setNovaAssinatura(png); setSalvou(false); }} permitirImagem />
            {erro && <div role="alert" style={{ fontSize: "13px", color: "#C0392B" }}>{erro}</div>}
            {salvou && <div style={{ fontSize: "13px", color: "#0a6130" }}>Assinatura salva.</div>}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={salvarAssinatura} disabled={pendente} style={{ background: "#009B3A", color: "white", padding: "10px 20px", fontWeight: 700, borderRadius: "6px", fontSize: "13px", opacity: pendente ? 0.7 : 1 }}>
                {pendente ? "Salvando..." : "Salvar assinatura"}
              </button>
              {assinaturaContratada && (
                <button type="button" onClick={removerAssinatura} disabled={pendente} style={{ background: "white", border: "1px solid #DDD", color: "#C0392B", padding: "10px 20px", fontWeight: 600, borderRadius: "6px", fontSize: "13px" }}>
                  Remover
                </button>
              )}
            </div>
          </div>
        </details>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", flexWrap: "wrap", marginBottom: "14px" }}>
          <div style={{ ...titulo, marginBottom: 0 }}>Valor dos contratos</div>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end", flexWrap: "wrap", fontSize: "12px" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontWeight: 600 }}>
              De
              <input type="date" value={de} onChange={(e) => setDe(e.target.value)} style={campo} />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: "4px", fontWeight: 600 }}>
              Até
              <input type="date" value={ate} onChange={(e) => setAte(e.target.value)} style={campo} />
            </label>
            {(de || ate) && (
              <button type="button" onClick={() => { setDe(""); setAte(""); }} style={{ ...campo, background: "white", fontWeight: 600 }}>
                Limpar período
              </button>
            )}
          </div>
        </div>

        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
          <div style={{ background: "#F0F9F3", borderRadius: "8px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>Total pago</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#0a6130" }}>{brl(resumo.totalPago)}</div>
            <div style={{ fontSize: "11px", color: "#666" }}>{resumo.quantidadePagos} {resumo.quantidadePagos === 1 ? "contrato pago" : "contratos pagos"}</div>
          </div>
          <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>Tarifa da Asaas</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#262626" }}>{brl(resumo.tarifa)}</div>
          </div>
          <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>Valor líquido</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#262626" }}>{brl(resumo.liquido)}</div>
            {resumo.semLiquido > 0 && <div style={{ fontSize: "11px", color: "#666" }}>{resumo.semLiquido} sem valor líquido informado ainda</div>}
          </div>
          <div style={{ background: "#FFF9DB", borderRadius: "8px", padding: "16px" }}>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>Aguardando pagamento</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#6b5400" }}>{brl(resumo.totalAguardando)}</div>
            <div style={{ fontSize: "11px", color: "#666" }}>{resumo.quantidadeAguardando} {resumo.quantidadeAguardando === 1 ? "contrato" : "contratos"}</div>
          </div>
        </div>

        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Pacote</th><th style={th}>Pagos</th><th style={th}>Total</th></tr></thead>
              <tbody>
                {resumo.porPacote.map((l) => (
                  <tr key={l.pacote}><td style={td}>{PACOTES[l.pacote].nome}</td><td style={td}>{l.quantidade}</td><td style={td}>{brl(l.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><th style={th}>Forma</th><th style={th}>Pagos</th><th style={th}>Total</th></tr></thead>
              <tbody>
                {resumo.porForma.map((l) => (
                  <tr key={l.forma}><td style={td}>{l.forma === "pix" ? "Pix" : "Cartão"}</td><td style={td}>{l.quantidade}</td><td style={td}>{brl(l.total)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p style={{ fontSize: "11px", color: "#666", marginTop: "10px" }}>
          O período filtra pela data do pagamento (contratos pagos) ou da assinatura (aguardando pagamento).
        </p>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
          <div style={{ ...titulo, marginBottom: 0 }}>Contratos ({lista.length})</div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input type="search" placeholder="Buscar por nome, e-mail, CPF ou número" value={busca} onChange={(e) => setBusca(e.target.value)} aria-label="Buscar contratos" style={{ ...campo, minWidth: "240px" }} />
            <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} aria-label="Filtrar por situação" style={campo}>
              <option value="todos">Todas as situações</option>
              <option value="assinado">Aguardando pagamento</option>
              <option value="pago">Pagos</option>
            </select>
            <button type="button" onClick={exportarContratos} style={{ ...campo, background: "white", fontWeight: 600, color: "#002776" }}>
              Exportar CSV
            </button>
          </div>
        </div>
        {rascunhosAbertos > 0 && (
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "10px" }}>
            {rascunhosAbertos} {rascunhosAbertos === 1 ? "pessoa começou" : "pessoas começaram"} o contrato e ainda não assinaram. Esses rascunhos não aparecem na lista.
          </p>
        )}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
            <thead>
              <tr>
                <th style={th}>Contrato</th><th style={th}>Assinado</th><th style={th}>Contratante</th><th style={th}>Pacote</th><th style={th}>Pagamento</th><th style={th}>Valor</th><th style={th}>Situação</th><th style={th}>PDF</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => {
                const status = ROTULO_STATUS[c.status] ?? ROTULO_STATUS.rascunho;
                return (
                  <tr key={c.id}>
                    <td style={{ ...td, whiteSpace: "nowrap", fontWeight: 600 }}>{numeroDe(c)}</td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{dataHora(c.assinadoEm)}</td>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{c.nome}</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>{c.email} · {c.telefone}</div>
                    </td>
                    <td style={td}>{PACOTES[c.pacote as PacoteContrato]?.nome ?? c.pacote}</td>
                    <td style={td}>
                      {c.formaPagamento === "pix" ? "Pix" : "Cartão"}
                      {c.descontoPercentual > 0 && <div style={{ fontSize: "11px", color: "#666" }}>{c.descontoPercentual}% de desconto</div>}
                    </td>
                    <td style={{ ...td, whiteSpace: "nowrap" }}>{brl(c.valorCentavos)}</td>
                    <td style={td}>
                      <span style={{ background: status.fundo, color: status.cor, padding: "2px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: 700, whiteSpace: "nowrap" }}>{status.texto}</span>
                      {c.agendaConflito && (
                        <div style={{ fontSize: "11px", color: "#C0392B", fontWeight: 600, marginTop: "4px" }}>Conflito de horário: confira a agenda</div>
                      )}
                    </td>
                    <td style={td}><a href={`/api/admin/contratos/${c.id}/pdf`} target="_blank" rel="noopener noreferrer" style={{ color: "#002776", fontWeight: 600 }}>Abrir</a></td>
                  </tr>
                );
              })}
              {lista.length === 0 && (
                <tr><td colSpan={8} style={{ ...td, textAlign: "center", color: "#666", padding: "24px" }}>Nenhum contrato encontrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "12px" }}>
          <div style={{ ...titulo, marginBottom: 0 }}>Agenda de horários</div>
          <button type="button" onClick={exportarAgenda} style={{ ...campo, background: "white", fontWeight: 600, color: "#002776" }}>
            Exportar CSV
          </button>
        </div>
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
          O balcão comporta {ESPACOS.balcao.capacidade} autores por período e o auditório {ESPACOS.auditorio.capacidade}. Itens em itálico ainda aguardam o pagamento.
        </p>
        {[...agendaPorDia.keys()].length === 0 ? (
          <p style={{ fontSize: "13px", color: "#666" }}>Nenhum horário reservado ainda.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {DIAS_BIENAL.filter((d) => agendaPorDia.has(d)).map((dia) => {
              const itens = (agendaPorDia.get(dia) ?? []).sort((a, b) => a.hora - b.hora || a.tipo.localeCompare(b.tipo));
              return (
                <details key={dia} style={{ border: "1px solid #E0E0E0", borderRadius: "8px", padding: "10px 14px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "13px" }}>
                    {dia.split("-").reverse().join("/")} ({itens.length} {itens.length === 1 ? "horário" : "horários"})
                  </summary>
                  <ul style={{ margin: "10px 0 0", paddingLeft: "18px", fontSize: "13px", lineHeight: 1.8 }}>
                    {itens.map((i, idx) => (
                      <li key={idx} style={{ fontStyle: i.confirmado ? "normal" : "italic" }}>
                        {ESPACOS[i.tipo].rotulo} {String(i.hora).padStart(2, "0")}h às {String(i.hora + ESPACOS[i.tipo].duracaoHoras).padStart(2, "0")}h: {i.nome} ({i.numero})
                      </li>
                    ))}
                  </ul>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
