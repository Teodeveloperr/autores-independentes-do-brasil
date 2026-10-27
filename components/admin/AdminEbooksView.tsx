"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  revogarAcessoEbookAdmin,
  reativarAcessoEbookAdmin,
  reenviarAcessoEbookAdmin,
  encerrarSessoesLeitorAdmin,
  liberarAcessoEbookManual,
} from "@/app/admin/actions";
import type { AcessoEbookAdminRow, EbookAdminRow } from "./types";

const FILTROS = ["Todos", "Ativos", "Revogados"] as const;
type Filtro = (typeof FILTROS)[number];

const STATUS_EBOOK: Record<string, { label: string; cor: string }> = {
  pronto: { label: "Pronto", cor: "#009B3A" },
  processando: { label: "Processando", cor: "#A87900" },
  erro: { label: "Com erro", cor: "#C0392B" },
  retirado: { label: "Retirado da venda (leitores mantêm acesso)", cor: "#666" },
};

const botaoPequeno: React.CSSProperties = { background: "white", border: "1px solid #DDD", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, color: "#002776" };

function dataHora(d: Date | null): string {
  return d ? d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function AdminEbooksView({ acessos, ebooks }: { acessos: AcessoEbookAdminRow[]; ebooks: EbookAdminRow[] }) {
  const router = useRouter();
  const [pendente, startTransition] = useTransition();
  const [filtro, setFiltro] = useState<Filtro>("Todos");
  const [busca, setBusca] = useState("");
  const [revogando, setRevogando] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("");
  const [aviso, setAviso] = useState<{ tipo: "ok" | "erro"; texto: string } | null>(null);

  const [emailManual, setEmailManual] = useState("");
  const [livroManual, setLivroManual] = useState("");
  const livrosProntos = ebooks.filter((e) => e.ebookStatus === "pronto");

  const termo = busca.trim().toLowerCase();
  const visiveis = acessos.filter((a) => {
    if (filtro === "Ativos" && a.revogadoEm) return false;
    if (filtro === "Revogados" && !a.revogadoEm) return false;
    if (!termo) return true;
    return [a.leitor.email, a.leitor.nome ?? "", a.book.titulo, a.book.author.nome].some((t) => t.toLowerCase().includes(termo));
  });

  function executar(acao: () => Promise<{ error?: string }>, sucesso: string, aoConcluir?: () => void) {
    setAviso(null);
    startTransition(async () => {
      try {
        const r = await acao();
        if (r.error) {
          setAviso({ tipo: "erro", texto: r.error });
          return;
        }
        setAviso({ tipo: "ok", texto: sucesso });
        aoConcluir?.();
        router.refresh();
      } catch (err) {
        setAviso({ tipo: "erro", texto: err instanceof Error ? err.message : "Não foi possível concluir." });
      }
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>E-books</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Quem tem acesso a cada e-book, com as ferramentas de suporte: revogar, reativar, reenviar o e-mail de acesso e liberar manualmente.
      </p>

      {aviso && (
        <div
          role="status"
          style={{
            fontSize: "13px",
            padding: "10px 14px",
            borderRadius: "6px",
            marginBottom: "20px",
            color: aviso.tipo === "ok" ? "#009B3A" : "#C0392B",
            background: aviso.tipo === "ok" ? "#E3F4E9" : "#FDEDEC",
          }}
        >
          {aviso.texto}
        </div>
      )}

      <div style={{ background: "white", borderRadius: "10px", padding: "24px", marginBottom: "24px" }}>
        <div style={{ fontWeight: 700, color: "#002776", marginBottom: "12px" }}>E-books cadastrados ({ebooks.length})</div>
        {ebooks.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#666" }}>Nenhum autor cadastrou um e-book ainda.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ebooks.map((e) => {
              const st = STATUS_EBOOK[e.ebookStatus ?? ""] ?? { label: e.ebookStatus ?? "—", cor: "#666" };
              return (
                <div key={e.id} style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", padding: "10px 0", borderBottom: "1px solid #F0F0F0", fontSize: "13px" }}>
                  <div style={{ flex: 1, minWidth: "180px" }}>
                    <div style={{ fontWeight: 700 }}>{e.titulo}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {e.author.nome} • {e.ebookPaginas ? `${e.ebookPaginas} páginas` : "sem páginas"} • {e._count.acessosEbook} leitor{e._count.acessosEbook === 1 ? "" : "es"}
                    </div>
                    {e.ebookStatus === "erro" && e.ebookErro && <div style={{ fontSize: "12px", color: "#C0392B", marginTop: "2px" }}>{e.ebookErro}</div>}
                  </div>
                  <span style={{ fontSize: "12px", fontWeight: 700, padding: "6px 12px", borderRadius: "12px", background: "#F6F6F6", color: st.cor, flexShrink: 0 }}>{st.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ background: "white", borderRadius: "10px", padding: "24px", marginBottom: "24px" }}>
        <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Liberar acesso manualmente</div>
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "12px" }}>
          Para cortesia ou correção de suporte. Cria a conta de leitor se não existir e manda o e-mail de acesso. Não gera pedido nem repasse.
        </p>
        <form
          onSubmit={(ev) => {
            ev.preventDefault();
            executar(() => liberarAcessoEbookManual(emailManual, livroManual), "Acesso liberado e e-mail enviado.", () => setEmailManual(""));
          }}
          style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}
        >
          <input
            type="email"
            required
            value={emailManual}
            onChange={(ev) => setEmailManual(ev.target.value)}
            placeholder="E-mail do leitor"
            style={{ flex: "1 1 220px", padding: "9px 12px", borderRadius: "6px", border: "1px solid #DDD", fontSize: "13px" }}
          />
          <select
            required
            value={livroManual}
            onChange={(ev) => setLivroManual(ev.target.value)}
            style={{ flex: "1 1 220px", padding: "9px 12px", borderRadius: "6px", border: "1px solid #DDD", fontSize: "13px" }}
          >
            <option value="">Escolha o e-book…</option>
            {livrosProntos.map((l) => (
              <option key={l.id} value={l.id}>
                {l.titulo} — {l.author.nome}
              </option>
            ))}
          </select>
          <button type="submit" disabled={pendente || livrosProntos.length === 0} style={{ background: "#009B3A", color: "white", padding: "9px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: 700, opacity: pendente || livrosProntos.length === 0 ? 0.6 : 1 }}>
            Liberar
          </button>
        </form>
        {livrosProntos.length === 0 && <div style={{ fontSize: "12px", color: "#A87900", marginTop: "8px" }}>Ainda não há e-book pronto para leitura.</div>}
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap", alignItems: "center" }}>
        {FILTROS.map((f) => (
          <button
            key={f}
            onClick={() => setFiltro(f)}
            style={{
              background: filtro === f ? "#002776" : "white",
              color: filtro === f ? "white" : "#262626",
              border: filtro === f ? "none" : "1px solid #DDD",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            {f}
          </button>
        ))}
        <input
          value={busca}
          onChange={(ev) => setBusca(ev.target.value)}
          placeholder="Buscar por e-mail, nome, livro ou autor"
          style={{ flex: "1 1 240px", padding: "9px 12px", borderRadius: "6px", border: "1px solid #DDD", fontSize: "13px" }}
        />
      </div>

      <div style={{ background: "white", borderRadius: "10px", overflow: "hidden" }}>
        {visiveis.map((a) => {
          const revogado = Boolean(a.revogadoEm);
          return (
            <div key={a.id} style={{ padding: "16px 20px", borderBottom: "1px solid #F0F0F0" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: "220px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{a.book.titulo}</div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {a.leitor.nome ? `${a.leitor.nome} • ` : ""}
                    {a.leitor.email} • Autor: {a.book.author.nome}
                  </div>
                  <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>
                    Liberado em {dataHora(a.concedidoEm)} • {a.order ? `Pedido #${a.order.id.slice(-6)} (${a.order.status})` : "Sem pedido (liberação manual)"} • Último acesso do leitor: {dataHora(a.leitor.ultimoAcessoEm)} • {a.leitor._count.sessoes} aparelho{a.leitor._count.sessoes === 1 ? "" : "s"} com sessão
                  </div>
                  {revogado && (
                    <div style={{ fontSize: "12px", color: "#C0392B", marginTop: "2px" }}>
                      Revogado em {dataHora(a.revogadoEm)}
                      {a.motivoRevogacao ? ` — ${a.motivoRevogacao}` : ""}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: "12px", fontWeight: 700, padding: "6px 12px", borderRadius: "12px", background: "#F6F6F6", color: revogado ? "#C0392B" : "#009B3A", flexShrink: 0 }}>
                  {revogado ? "Revogado" : "Ativo"}
                </span>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}>
                {revogado ? (
                  <button disabled={pendente} style={botaoPequeno} onClick={() => executar(() => reativarAcessoEbookAdmin(a.id), "Acesso reativado.")}>
                    Reativar acesso
                  </button>
                ) : (
                  <>
                    <button disabled={pendente} style={botaoPequeno} onClick={() => executar(() => reenviarAcessoEbookAdmin(a.id), "E-mail de acesso enviado.")}>
                      Reenviar e-mail de acesso
                    </button>
                    <button
                      disabled={pendente}
                      style={{ ...botaoPequeno, color: "#C0392B" }}
                      onClick={() => {
                        setRevogando(revogando === a.id ? null : a.id);
                        setMotivo("");
                      }}
                    >
                      Revogar acesso
                    </button>
                  </>
                )}
                <button
                  disabled={pendente || a.leitor._count.sessoes === 0}
                  style={{ ...botaoPequeno, opacity: a.leitor._count.sessoes === 0 ? 0.5 : 1 }}
                  onClick={() => executar(() => encerrarSessoesLeitorAdmin(a.leitor.id), "Leitor desconectado de todos os aparelhos.")}
                >
                  Desconectar aparelhos
                </button>
              </div>

              {revogando === a.id && (
                <form
                  onSubmit={(ev) => {
                    ev.preventDefault();
                    executar(() => revogarAcessoEbookAdmin(a.id, motivo), "Acesso revogado.", () => setRevogando(null));
                  }}
                  style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "10px" }}
                >
                  <input
                    autoFocus
                    value={motivo}
                    onChange={(ev) => setMotivo(ev.target.value)}
                    maxLength={250}
                    placeholder="Motivo (ex.: estorno, compartilhamento indevido)"
                    style={{ flex: "1 1 260px", padding: "8px 12px", borderRadius: "6px", border: "1px solid #DDD", fontSize: "13px" }}
                  />
                  <button type="submit" disabled={pendente || !motivo.trim()} style={{ background: "#C0392B", color: "white", padding: "8px 16px", borderRadius: "6px", fontSize: "12px", fontWeight: 700, opacity: pendente || !motivo.trim() ? 0.6 : 1 }}>
                    Confirmar revogação
                  </button>
                </form>
              )}
            </div>
          );
        })}
        {visiveis.length === 0 && <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>Nenhum acesso encontrado.</div>}
      </div>
    </div>
  );
}
