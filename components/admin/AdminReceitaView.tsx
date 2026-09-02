"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { brl } from "@/lib/format";
import { valorRepasseCentavos, valorRepasseCentavosLiquido } from "@/lib/plans";
import { reconciliarReceita, atualizarValoresLiquidos, type CobrancaFaltante } from "@/app/admin/actions";
import type { OrderComReceita, SubscriptionPaymentRow } from "./types";

// Repasse real (já transferido) ou, na falta dele, a melhor estimativa disponível: com
// base no valor líquido real da Asaas quando já confirmado, ou no valor bruto quando ainda não.
function repasseDoPedido(p: OrderComReceita): number {
  if (p.repasseValorCentavos != null) return p.repasseValorCentavos;
  if (p.valorLiquidoCentavos != null) {
    return valorRepasseCentavosLiquido(p.author.plano, p.valorCentavos, p.freteCentavos ?? 0, p.valorLiquidoCentavos);
  }
  return valorRepasseCentavos(p.author.plano, p.valorCentavos, p.freteCentavos ?? 0);
}

// Comissão real da plataforma nesse pedido: o que sobra depois do repasse (real ou
// estimado) sobre o valor líquido real recebido (ou bruto, se ainda não confirmado).
function comissaoDoPedido(p: OrderComReceita): number {
  const totalLinha = p.valorLiquidoCentavos ?? p.valorCentavos + (p.freteCentavos ?? 0);
  return totalLinha - repasseDoPedido(p);
}

const TIPO_LABEL: Record<string, string> = { assinatura: "Assinatura", venda: "Venda de livro" };

function mesChave(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function mesLabel(chave: string) {
  const [ano, mes] = chave.split("-").map(Number);
  return new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function dataLabel(data: Date) {
  return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

type EntradaReceita = {
  id: string;
  data: Date;
  tipo: "Assinatura" | "Venda de livro";
  descricao: string;
  valorCentavos: number;
  disponivel: boolean;
};

export default function AdminReceitaView({ pedidos, assinaturaPagamentos }: { pedidos: OrderComReceita[]; assinaturaPagamentos: SubscriptionPaymentRow[] }) {
  const router = useRouter();
  const meses = useMemo(() => {
    const chaves = new Set<string>();
    pedidos.forEach((p) => chaves.add(mesChave(p.createdAt)));
    assinaturaPagamentos.forEach((s) => chaves.add(mesChave(s.createdAt)));
    chaves.add(mesChave(new Date()));
    return Array.from(chaves).sort().reverse();
  }, [pedidos, assinaturaPagamentos]);

  const [mes, setMes] = useState(meses[0]);
  const [reconciliando, startReconciliar] = useTransition();
  const [resultado, setResultado] = useState<{ faltantes: CobrancaFaltante[]; totalConferido: number } | null>(null);
  const [erroReconciliar, setErroReconciliar] = useState("");
  const [atualizandoLiquido, startAtualizarLiquido] = useTransition();
  const [resultadoLiquido, setResultadoLiquido] = useState<{ atualizados: number; falhas: number } | null>(null);
  const [erroLiquido, setErroLiquido] = useState("");

  function onReconciliar() {
    setResultado(null);
    setErroReconciliar("");
    startReconciliar(async () => {
      try {
        const r = await reconciliarReceita(mes);
        setResultado(r);
      } catch (err) {
        setErroReconciliar(err instanceof Error ? err.message : "Não foi possível reconciliar com a Asaas.");
      }
    });
  }

  function onAtualizarLiquido() {
    setResultadoLiquido(null);
    setErroLiquido("");
    startAtualizarLiquido(async () => {
      try {
        const r = await atualizarValoresLiquidos();
        setResultadoLiquido(r);
        if (r.atualizados > 0) {
          router.refresh();
        }
      } catch (err) {
        setErroLiquido(err instanceof Error ? err.message : "Não foi possível atualizar os valores líquidos.");
      }
    });
  }

  const dados = useMemo(() => {
    const pedidosDoMes = pedidos.filter((p) => mesChave(p.createdAt) === mes);
    const assinaturasDoMes = assinaturaPagamentos.filter((s) => mesChave(s.createdAt) === mes);

    // "Confirmado" = a Asaas já confirmou o pagamento (pode ainda não estar disponível
    // pra movimentação — cartão de crédito só libera em D+32). "Disponível" = já pode
    // ser de fato movimentado (Pix: quase imediato; cartão: só depois do D+32).
    let comissaoLivrosCentavos = 0;
    let repasseLivrosCentavos = 0;
    let vendaLivrosCentavos = 0;
    let comissaoLivrosDisponivelCentavos = 0;
    for (const p of pedidosDoMes) {
      const comissao = comissaoDoPedido(p);
      comissaoLivrosCentavos += comissao;
      repasseLivrosCentavos += repasseDoPedido(p);
      vendaLivrosCentavos += p.valorCentavos + (p.freteCentavos ?? 0);
      if (p.disponivelEm) comissaoLivrosDisponivelCentavos += comissao;
    }

    // Usa o valor líquido (já descontada a tarifa da Asaas) quando disponível — pagamentos
    // registrados antes dessa informação existir caem no valor bruto como aproximação.
    const assinaturasCentavos = assinaturasDoMes.reduce((sum, s) => sum + (s.valorLiquidoCentavos ?? s.valorCentavos), 0);
    const assinaturasDisponivelCentavos = assinaturasDoMes
      .filter((s) => s.disponivelEm)
      .reduce((sum, s) => sum + (s.valorLiquidoCentavos ?? s.valorCentavos), 0);

    const entradas: EntradaReceita[] = [
      ...pedidosDoMes.map((p) => ({
        id: p.id,
        data: p.createdAt,
        tipo: "Venda de livro" as const,
        descricao: `${p.livro} — ${p.comprador}`,
        valorCentavos: comissaoDoPedido(p),
        disponivel: Boolean(p.disponivelEm),
      })),
      ...assinaturasDoMes.map((s) => ({
        id: s.id,
        data: s.createdAt,
        tipo: "Assinatura" as const,
        descricao: `${s.author.nome} — ${s.plano}`,
        valorCentavos: s.valorLiquidoCentavos ?? s.valorCentavos,
        disponivel: Boolean(s.disponivelEm),
      })),
    ].sort((a, b) => b.data.getTime() - a.data.getTime());

    const totalConfirmadoCentavos = comissaoLivrosCentavos + assinaturasCentavos;
    const totalDisponivelCentavos = comissaoLivrosDisponivelCentavos + assinaturasDisponivelCentavos;

    return {
      pedidosCount: pedidosDoMes.length,
      assinaturasCount: assinaturasDoMes.length,
      vendaLivrosCentavos,
      comissaoLivrosCentavos,
      repasseLivrosCentavos,
      assinaturasCentavos,
      totalReceitaCentavos: totalConfirmadoCentavos,
      totalDisponivelCentavos,
      totalAguardandoCentavos: totalConfirmadoCentavos - totalDisponivelCentavos,
      entradas,
    };
  }, [pedidos, assinaturaPagamentos, mes]);

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Receita</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Receita da plataforma: comissão sobre vendas de livro + assinaturas de autores, por mês.
      </p>

      <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
        <select
          value={mes}
          onChange={(e) => { setMes(e.target.value); setResultado(null); setErroReconciliar(""); }}
          style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #DDD", fontSize: "13px", fontWeight: 600, textTransform: "capitalize" }}
        >
          {meses.map((m) => (
            <option key={m} value={m} style={{ textTransform: "capitalize" }}>
              {mesLabel(m)}
            </option>
          ))}
        </select>
        <button
          onClick={onReconciliar}
          disabled={reconciliando}
          style={{ background: "white", border: "1px solid #002776", color: "#002776", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, opacity: reconciliando ? 0.7 : 1 }}
        >
          {reconciliando ? "Reconciliando..." : "🔄 Reconciliar com a Asaas"}
        </button>
        <button
          onClick={onAtualizarLiquido}
          disabled={atualizandoLiquido}
          style={{ background: "white", border: "1px solid #002776", color: "#002776", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, opacity: atualizandoLiquido ? 0.7 : 1 }}
        >
          {atualizandoLiquido ? "Atualizando..." : "💧 Atualizar valores líquidos"}
        </button>
      </div>

      {erroReconciliar && (
        <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px", marginBottom: "20px" }}>
          {erroReconciliar}
        </div>
      )}

      {erroLiquido && (
        <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px", marginBottom: "20px" }}>
          {erroLiquido}
        </div>
      )}

      {resultadoLiquido && (
        <div style={{ background: "white", borderRadius: "10px", padding: "20px", marginBottom: "24px", fontSize: "13px" }}>
          {resultadoLiquido.atualizados > 0 && (
            <div style={{ color: "#009B3A" }}>
              ✅ {resultadoLiquido.atualizados} pagamento{resultadoLiquido.atualizados === 1 ? "" : "s"} atualizado{resultadoLiquido.atualizados === 1 ? "" : "s"} com o valor líquido da Asaas.
            </div>
          )}
          {resultadoLiquido.falhas > 0 && (
            <div style={{ color: "#A87900", marginTop: resultadoLiquido.atualizados > 0 ? "8px" : 0 }}>
              ⚠️ {resultadoLiquido.falhas} pagamento{resultadoLiquido.falhas === 1 ? "" : "s"} não encontrado{resultadoLiquido.falhas === 1 ? "" : "s"} ou sem valor líquido disponível na Asaas.
            </div>
          )}
          {resultadoLiquido.atualizados === 0 && resultadoLiquido.falhas === 0 && (
            <div style={{ color: "#666" }}>Todos os pagamentos já têm valor líquido registrado.</div>
          )}
        </div>
      )}

      {resultado && (
        <div style={{ background: "white", borderRadius: "10px", padding: "20px", marginBottom: "24px" }}>
          {resultado.faltantes.length === 0 ? (
            <div style={{ color: "#009B3A", fontSize: "13px" }}>
              ✅ Conferido {resultado.totalConferido} cobrança{resultado.totalConferido === 1 ? "" : "s"} recebida{resultado.totalConferido === 1 ? "" : "s"} na Asaas nesse mês — tudo bate com o que está gravado aqui.
            </div>
          ) : (
            <>
              <div style={{ color: "#C0392B", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>
                ⚠️ {resultado.faltantes.length} cobrança{resultado.faltantes.length === 1 ? "" : "s"} recebida{resultado.faltantes.length === 1 ? "" : "s"} na Asaas mas sem registro aqui (de {resultado.totalConferido} conferidas):
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {resultado.faltantes.map((f) => (
                  <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", fontSize: "13px", padding: "8px 0", borderBottom: "1px solid #F0F0F0", flexWrap: "wrap" }}>
                    <span>
                      {TIPO_LABEL[f.tipo] ?? f.tipo} · {f.paymentDate ?? "—"} · {f.status} · <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#666" }}>{f.id}</span>
                    </span>
                    <span style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <span style={{ fontWeight: 700 }}>{brl(f.valorCentavos)}</span>
                      <a href={f.invoiceUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#002776", fontWeight: 600 }}>
                        Ver na Asaas ↗
                      </a>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "20px" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>✅ Disponível para movimentação</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#009B3A" }}>{brl(dados.totalDisponivelCentavos)}</div>
          <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Pix: quase na hora. Cartão: só depois de ~32 dias (D+32).</div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>⏳ Confirmado, aguardando liquidação</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#A87900" }}>{brl(dados.totalAguardandoCentavos)}</div>
          <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Pago pelo cliente, mas a Asaas ainda não liberou pra saque/transferência.</div>
        </div>
      </div>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "28px" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>💰 Total confirmado (comissão + assinaturas líquidas)</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{brl(dados.totalReceitaCentavos)}</div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>📚 Comissão real sobre vendas ({dados.pedidosCount} pedido{dados.pedidosCount === 1 ? "" : "s"})</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{brl(dados.comissaoLivrosCentavos)}</div>
          <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Já descontada a tarifa da Asaas na cobrança</div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
          <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>✍️ Assinaturas líquidas ({dados.assinaturasCount} pagamento{dados.assinaturasCount === 1 ? "" : "s"})</div>
          <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{brl(dados.assinaturasCentavos)}</div>
          <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Já descontada a tarifa da Asaas</div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
        <div style={{ fontWeight: 700, color: "#002776", marginBottom: "16px" }}>Detalhamento de vendas de livro</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Total vendido (livros + frete)</span>
            <span style={{ fontWeight: 600 }}>{brl(dados.vendaLivrosCentavos)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "#666" }}>Repassado aos autores</span>
            <span style={{ fontWeight: 600 }}>{brl(dados.repasseLivrosCentavos)}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #F0F0F0", paddingTop: "10px" }}>
            <span style={{ color: "#666" }}>Comissão real da plataforma</span>
            <span style={{ fontWeight: 700, color: "#002776" }}>{brl(dados.comissaoLivrosCentavos)}</span>
          </div>
          <div style={{ fontSize: "11px", color: "#999" }}>
            Já descontada a tarifa da Asaas na cobrança — pode ser um pouco menor que o percentual nominal do plano do autor.
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", padding: "24px", marginTop: "24px" }}>
        <div style={{ fontWeight: 700, color: "#002776", marginBottom: "16px" }}>Entradas de receita do mês</div>
        {dados.entradas.length === 0 ? (
          <div style={{ fontSize: "13px", color: "#666" }}>Nenhuma entrada de receita nesse mês.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {dados.entradas.map((e) => (
              <div
                key={`${e.tipo}-${e.id}`}
                style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", fontSize: "13px", padding: "10px 0", borderBottom: "1px solid #F0F0F0" }}
              >
                <span style={{ color: "#999", flexShrink: 0, width: "80px" }}>{dataLabel(e.data)}</span>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    flexShrink: 0,
                    background: e.tipo === "Assinatura" ? "#E3F4E9" : "#E9EEF9",
                    color: e.tipo === "Assinatura" ? "#009B3A" : "#002776",
                  }}
                >
                  {e.tipo}
                </span>
                <span style={{ flex: 1, color: "#262626", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.descricao}</span>
                <span
                  title={e.disponivel ? "Já disponível para movimentação na Asaas" : "Confirmado, mas ainda não liberado pra movimentação na Asaas"}
                  style={{ fontSize: "11px", flexShrink: 0, color: e.disponivel ? "#009B3A" : "#A87900" }}
                >
                  {e.disponivel ? "✅ Disponível" : "⏳ Aguardando"}
                </span>
                <span style={{ fontWeight: 700, color: "#002776", flexShrink: 0 }}>{brl(e.valorCentavos)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
