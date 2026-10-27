"use client";

import { brl } from "@/lib/format";
import { PREMIUM_PLUS_VALOR_BASE_CENTAVOS, PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS, valorParceiroPremiumPlusCentavos } from "@/lib/plans";
import type { SubscriptionPaymentRow } from "./types";

// Janela da Receita sobre a fatia do parceiro nos pagamentos do Premium+: quanto cabe a ele, quanto já foi
// repassado e quanto ainda espera a liberação da Asaas. O repasse em si é feito pelo cron (lib/repasseParceiro.ts).

const PERCENTUAL_PARCEIRO = (PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS / (PREMIUM_PLUS_VALOR_BASE_CENTAVOS + PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS)) * 100;

type Situacao = "repassado" | "liberado" | "aguardando";

// Valor que cabe ao parceiro nesse pagamento: o que de fato foi transferido, ou a fatia proporcional ao
// valor pago (o mesmo teto que o cron usa).
function parteDoParceiro(p: SubscriptionPaymentRow): number {
  if (p.repasseParceiroStatus === "transferido" && p.repasseParceiroValorCentavos != null) return p.repasseParceiroValorCentavos;
  return valorParceiroPremiumPlusCentavos(p.valorCentavos);
}

function situacaoDe(p: SubscriptionPaymentRow): Situacao {
  if (p.repasseParceiroStatus === "transferido") return "repassado";
  return p.disponivelEm ? "liberado" : "aguardando";
}

const ROTULO: Record<Situacao, { texto: string; cor: string }> = {
  repassado: { texto: "✅ Repassado", cor: "#009B3A" },
  liberado: { texto: "🟡 Liberado, a repassar", cor: "#A87900" },
  aguardando: { texto: "⏳ Aguardando liberação da Asaas", cor: "#666" },
};

function dataLabel(d: Date) {
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Cartao({ titulo, valor, nota, cor }: { titulo: string; valor: string; nota?: string; cor?: string }) {
  return (
    <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "14px 16px" }}>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>{titulo}</div>
      <div style={{ fontSize: "22px", fontWeight: 700, color: cor ?? "#002776" }}>{valor}</div>
      {nota && <div style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>{nota}</div>}
    </div>
  );
}

export default function AdminParceiroPremiumPlus({
  pagamentos,
  doMes,
  rotuloMes,
  chaveConfigurada,
}: {
  pagamentos: SubscriptionPaymentRow[];
  doMes: SubscriptionPaymentRow[];
  rotuloMes: string;
  chaveConfigurada: boolean;
}) {
  const todos = pagamentos.filter((p) => p.plano === "Autor Premium+");

  const soma = (lista: SubscriptionPaymentRow[], situacao?: Situacao) =>
    lista.filter((p) => !situacao || situacaoDe(p) === situacao).reduce((s, p) => s + parteDoParceiro(p), 0);

  const brutoMes = doMes.reduce((s, p) => s + p.valorCentavos, 0);
  const parceiroMes = soma(doMes);
  const comErro = todos.filter((p) => p.repasseParceiroStatus === "erro" && p.repasseParceiroErro);

  return (
    <div style={{ background: "white", borderRadius: "10px", padding: "24px", marginTop: "24px" }}>
      <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>🤝 Parceiro do Premium+</div>
      <p style={{ fontSize: "12px", color: "#666", marginBottom: "14px", lineHeight: 1.5 }}>
        De cada pagamento do Premium+, <strong>{PERCENTUAL_PARCEIRO.toFixed(1).replace(".", ",")}%</strong> vão para o parceiro e o restante fica com a plataforma
        (antes da tarifa da Asaas). Em R$ 900,00 são {brl(PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS)}; em R$ 810,00 (Black Friday no Pix ou cartão à vista) são{" "}
        {brl(valorParceiroPremiumPlusCentavos(81000))}. No parcelado, <strong>cada parcela</strong> repassa {PERCENTUAL_PARCEIRO.toFixed(1).replace(".", ",")}% do seu valor, quando a Asaas libera essa parcela
        (cerca de 30 dias depois da anterior). O repasse sai por Pix, automaticamente, uma vez por dia.
      </p>

      {!chaveConfigurada && (
        <div style={{ background: "#FEF6E7", color: "#8A6116", fontSize: "13px", padding: "10px 14px", borderRadius: "6px", marginBottom: "14px" }}>
          ⚠️ A chave Pix do parceiro ainda não está configurada (Configurações). Enquanto isso, nenhum repasse sai; o valor fica acumulado abaixo.
        </div>
      )}

      <div style={{ fontSize: "12px", fontWeight: 700, color: "#262626", marginBottom: "8px" }}>Situação geral (todos os pagamentos Premium+)</div>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "20px" }}>
        <Cartao titulo="✅ Já repassado ao parceiro" valor={brl(soma(todos, "repassado"))} cor="#009B3A" />
        <Cartao titulo="🟡 Liberado pela Asaas, a repassar" valor={brl(soma(todos, "liberado"))} cor="#A87900" nota="Sai no próximo ciclo diário, se a chave Pix estiver configurada." />
        <Cartao titulo="⏳ Aguardando liberação da Asaas" valor={brl(soma(todos, "aguardando"))} cor="#666" nota="Parcelas e pagamentos de cartão ainda não liberados." />
      </div>

      <div style={{ fontSize: "12px", fontWeight: 700, color: "#262626", marginBottom: "8px" }}>Pagamentos Premium+ de {rotuloMes}</div>
      {doMes.length === 0 ? (
        <div style={{ fontSize: "13px", color: "#666" }}>Nenhum pagamento Premium+ nesse mês.</div>
      ) : (
        <>
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "14px" }}>
            <Cartao titulo={`Pago pelos autores (${doMes.length} pagamento${doMes.length === 1 ? "" : "s"})`} valor={brl(brutoMes)} />
            <Cartao titulo="Parte do parceiro" valor={brl(parceiroMes)} cor="#6B4EAF" />
            <Cartao titulo="Parte da plataforma" valor={brl(brutoMes - parceiroMes)} cor="#009B3A" nota="Antes da tarifa da Asaas." />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {doMes.map((p) => {
              const situacao = situacaoDe(p);
              const rotulo = ROTULO[situacao];
              return (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", fontSize: "13px", padding: "10px 0", borderBottom: "1px solid #F0F0F0", flexWrap: "wrap" }}>
                  <span style={{ color: "#999", width: "80px", flexShrink: 0 }}>{dataLabel(p.createdAt)}</span>
                  <span style={{ flex: 1, minWidth: "140px", color: "#262626" }}>{p.author.nome}</span>
                  <span style={{ color: "#666", flexShrink: 0 }}>pagou {brl(p.valorCentavos)}</span>
                  <span style={{ fontWeight: 700, color: "#6B4EAF", flexShrink: 0 }}>parceiro {brl(parteDoParceiro(p))}</span>
                  <span style={{ fontSize: "11px", color: rotulo.cor, flexShrink: 0 }}>{rotulo.texto}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {comErro.length > 0 && (
        <div style={{ background: "#FDEDEC", color: "#C0392B", fontSize: "12px", padding: "10px 14px", borderRadius: "6px", marginTop: "14px" }}>
          ⚠️ {comErro.length} repasse{comErro.length === 1 ? "" : "s"} com erro na última tentativa: {comErro[0].repasseParceiroErro} Corrija e ele será tentado de novo no próximo ciclo.
        </div>
      )}
    </div>
  );
}
