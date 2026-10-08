import type { ContratoMontado } from "@/lib/contrato/texto";

function estiloLinha(texto: string): React.CSSProperties {
  if (/^[a-z]\) /.test(texto)) return { paddingLeft: "20px", margin: "0 0 4px" };
  if (/^\[[ X]\] /.test(texto) || /^(PAGAMENTO:|VALOR:|PIX|CARTÃO|Valor |Taxa )/.test(texto)) return { margin: "0 0 2px" };
  return { margin: "0 0 8px" };
}

/** Pré-visualização do contrato na tela, a partir da mesma estrutura usada no PDF. */
export default function ContratoTextoView({ contrato }: { contrato: ContratoMontado }) {
  return (
    <div style={{ fontSize: "13px", lineHeight: 1.6, color: "#1c1c1c", textAlign: "justify" }}>
      <p style={{ fontSize: "12px", color: "#555", margin: "0 0 6px" }}>CONTRATO: {contrato.numeroTexto}</p>
      <h3 style={{ textAlign: "center", color: "#002776", fontSize: "15px", margin: "0 0 14px" }}>{contrato.titulo}</h3>
      {contrato.abertura.map((t) => (
        <p key={t} style={{ margin: "0 0 8px" }}>{t}</p>
      ))}
      <p style={{ margin: "0 0 8px" }}>{contrato.contratada}</p>
      <p style={{ margin: "0 0 8px" }}>{contrato.conectivo}</p>
      <p style={{ margin: "0 0 8px" }}>{contrato.contratante}</p>
      <p style={{ margin: "0 0 8px" }}>{contrato.preambuloFinal}</p>
      {contrato.clausulas.map((c) => (
        <div key={c.titulo}>
          <h4 style={{ color: "#002776", fontSize: "13px", margin: "14px 0 6px", textAlign: "left" }}>{c.titulo}</h4>
          {c.paragrafos.map((p, i) => (
            <p key={i} style={estiloLinha(p)}>{p}</p>
          ))}
        </div>
      ))}
      <p style={{ margin: "14px 0 0" }}>{contrato.fechamento}</p>
    </div>
  );
}
