import { brl } from "@/lib/format";
import { precoComDescontoCentavos } from "@/lib/desconto";

export default function PrecoComDesconto({
  precoCentavos,
  descontoPercentual,
  fontSize = "14px",
}: {
  precoCentavos: number;
  descontoPercentual: number | null;
  fontSize?: string;
}) {
  if (!descontoPercentual) {
    return <div style={{ color: "#009B3A", fontWeight: 700, fontSize }}>{brl(precoCentavos)}</div>;
  }

  const final = precoComDescontoCentavos(precoCentavos, descontoPercentual);

  return (
    <div>
      <div style={{ display: "flex", gap: "6px", alignItems: "baseline", flexWrap: "wrap" }}>
        <span style={{ color: "#009B3A", fontWeight: 700, fontSize }}>{brl(final)}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: "white", background: "#C0392B", padding: "1px 6px", borderRadius: "10px" }}>
          -{descontoPercentual}%
        </span>
      </div>
      <div style={{ fontSize: "11px", color: "#999", textDecoration: "line-through" }}>{brl(precoCentavos)}</div>
    </div>
  );
}
