"use client";

import { brl } from "@/lib/format";
import { descontoPlanoPercentual, parcelasDisponiveis, valorPlanoPorMetodoCentavos, PREMIUM_PLUS_OFERTA_NOME, type MetodoPagamentoPlano } from "@/lib/plans";

// Escolha da forma de pagamento do Premium+ (anual). Mostra lado a lado o que cada forma custa, para a
// pessoa ver o desconto do Pix e do cartão à vista antes de decidir. Usada na página de planos e no cadastro.

type Props = {
  metodo: MetodoPagamentoPlano | null;
  onEscolher: (m: MetodoPagamentoPlano) => void;
  parcelas: number;
  onParcelas: (n: number) => void;
  desabilitado?: boolean;
};

function Opcao({
  selecionada,
  onClick,
  desabilitado,
  titulo,
  selo,
  preco,
  precoRiscado,
  linhaPreco,
  detalhe,
  children,
}: {
  selecionada: boolean;
  onClick: () => void;
  desabilitado?: boolean;
  titulo: string;
  selo?: string;
  preco: string;
  precoRiscado?: string;
  linhaPreco: string;
  detalhe: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: selecionada ? "3px solid #009B3A" : "2px solid #DDD",
        background: selecionada ? "#F1F8F4" : "white",
        borderRadius: "10px",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        role="radio"
        aria-checked={selecionada}
        onClick={onClick}
        disabled={desabilitado}
        style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", padding: selecionada ? "12px 14px" : "13px 15px", cursor: "pointer" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
          <span
            aria-hidden="true"
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              border: selecionada ? "6px solid #009B3A" : "2px solid #AAA",
              background: "white",
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#262626" }}>{titulo}</span>
          {selo && (
            <span style={{ background: "#009B3A", color: "white", fontSize: "11px", fontWeight: 700, padding: "3px 8px", borderRadius: "10px", whiteSpace: "nowrap" }}>{selo}</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>{preco}</span>
          {precoRiscado && <span style={{ fontSize: "13px", color: "#999", textDecoration: "line-through" }}>{precoRiscado}</span>}
          <span style={{ fontSize: "12px", color: "#666" }}>{linhaPreco}</span>
        </div>
        <div style={{ fontSize: "12px", color: "#666", marginTop: "4px", lineHeight: 1.45 }}>{detalhe}</div>
      </button>
      {selecionada && children && <div style={{ padding: "0 14px 12px" }}>{children}</div>}
    </div>
  );
}

export default function OpcoesPagamentoPremiumPlus({ metodo, onEscolher, parcelas, onParcelas, desabilitado }: Props) {
  const percentual = descontoPlanoPercentual("premiumPlus", "anual", "pix");
  const cheio = valorPlanoPorMetodoCentavos("premiumPlus", "anual", "parcelado");
  const comDesconto = valorPlanoPorMetodoCentavos("premiumPlus", "anual", "pix");
  const temOferta = percentual > 0;
  const opcoesParcelas = parcelasDisponiveis("anual");
  const parcelasEscolhidas = Math.min(Math.max(parcelas, 1), opcoesParcelas.length);

  return (
    <div style={{ marginBottom: "14px" }}>
      {temOferta && (
        <div style={{ background: "#111", color: "#FFDF00", borderRadius: "8px", padding: "10px 12px", marginBottom: "10px", fontWeight: 700, fontSize: "13px", lineHeight: 1.4, textAlign: "center" }}>
          <div style={{ fontSize: "11px", letterSpacing: "1.5px", marginBottom: "2px" }}>🖤 OFERTA {PREMIUM_PLUS_OFERTA_NOME.toUpperCase()}</div>
          {percentual}% de desconto no Pix ou no cartão à vista: {brl(comDesconto)} em vez de {brl(cheio)}
        </div>
      )}
      <div style={{ fontSize: "13px", fontWeight: 700, color: "#262626", marginBottom: "8px" }}>Escolha como quer pagar:</div>
      <div role="radiogroup" aria-label="Forma de pagamento" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <Opcao
          selecionada={metodo === "pix"}
          onClick={() => onEscolher("pix")}
          desabilitado={desabilitado}
          titulo="Pix"
          selo={temOferta ? `${percentual}% OFF` : undefined}
          preco={brl(comDesconto)}
          precoRiscado={temOferta ? brl(cheio) : undefined}
          linhaPreco="por ano"
          detalhe="Você autoriza uma vez no app do seu banco e a renovação anual é debitada sozinha, pelo mesmo valor."
        />
        <Opcao
          selecionada={metodo === "cartao"}
          onClick={() => onEscolher("cartao")}
          desabilitado={desabilitado}
          titulo="Cartão à vista"
          selo={temOferta ? `${percentual}% OFF` : undefined}
          preco={brl(comDesconto)}
          precoRiscado={temOferta ? brl(cheio) : undefined}
          linhaPreco="por ano"
          detalhe="Paga o ano todo de uma vez no cartão (1x). A renovação anual é cobrada sozinha, pelo mesmo valor."
        />
        <Opcao
          selecionada={metodo === "parcelado"}
          onClick={() => onEscolher("parcelado")}
          desabilitado={desabilitado}
          titulo="Parcelado no cartão"
          preco={`${parcelasEscolhidas}x de ${brl(Math.round(cheio / parcelasEscolhidas))}`}
          linhaPreco={`total ${brl(cheio)}`}
          detalhe={temOferta ? "Sem desconto. Não renova sozinho: quando o ano acabar, você renova se quiser." : "Não renova sozinho: quando o ano acabar, você renova se quiser."}
        >
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600 }}>
            Em quantas parcelas?
            <select
              value={parcelasEscolhidas}
              onChange={(e) => onParcelas(Number(e.target.value))}
              disabled={desabilitado}
              style={{ flex: 1, padding: "8px 10px", border: "1px solid #CCC", borderRadius: "4px", fontSize: "13px", fontWeight: 600 }}
            >
              {opcoesParcelas.map((n) => (
                <option key={n} value={n}>
                  {n}x de {brl(Math.round(cheio / n))}
                </option>
              ))}
            </select>
          </label>
        </Opcao>
      </div>
    </div>
  );
}

/** Texto do botão de confirmar, conforme a forma escolhida. */
export function rotuloConfirmarPremiumPlus(metodo: MetodoPagamentoPlano | null, parcelas: number): string {
  if (!metodo) return "Escolha uma forma de pagamento";
  if (metodo === "parcelado") {
    const total = valorPlanoPorMetodoCentavos("premiumPlus", "anual", "parcelado");
    return `Parcelar ${parcelas}x de ${brl(Math.round(total / parcelas))}`;
  }
  const valor = brl(valorPlanoPorMetodoCentavos("premiumPlus", "anual", metodo));
  return metodo === "pix" ? `Pagar ${valor} com Pix` : `Pagar ${valor} no cartão à vista`;
}
