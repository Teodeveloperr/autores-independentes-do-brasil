"use client";

import { useState } from "react";
import {
  DIAS_BIENAL,
  ESPACOS,
  PACOTES,
  chaveHorario,
  horasInicioDoEspaco,
  rotuloHorario,
  type HorarioEscolhido,
  type PacoteContrato,
  type TipoEspaco,
} from "@/lib/contrato/config";

function rotuloDia(dia: string): { semana: string; data: string } {
  const [, mes, d] = dia.split("-");
  const semana = new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
  return { semana, data: `${d}/${mes}` };
}

const chip = (ativo: boolean, desabilitado: boolean): React.CSSProperties => ({
  background: ativo ? "#009B3A" : desabilitado ? "#F0F0F0" : "white",
  color: ativo ? "white" : desabilitado ? "#AAA" : "#262626",
  border: ativo ? "1px solid #009B3A" : "1px solid #DDD",
  padding: "8px 12px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: desabilitado ? "not-allowed" : "pointer",
  textAlign: "left",
});

function SecaoEspaco({
  tipo,
  quantidade,
  ocupacao,
  selecionados,
  onToggle,
}: {
  tipo: TipoEspaco;
  quantidade: number;
  ocupacao: Record<string, number>;
  selecionados: HorarioEscolhido[];
  onToggle: (h: HorarioEscolhido) => void;
}) {
  const [diaAtivo, setDiaAtivo] = useState<string>(DIAS_BIENAL[0]);
  const espaco = ESPACOS[tipo];
  const doTipo = selecionados.filter((h) => h.tipo === tipo);
  const completo = doTipo.length >= quantidade;

  return (
    <div style={{ border: "1px solid #E0E0E0", borderRadius: "8px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div>
        <div style={{ fontWeight: 700, color: "#002776" }}>
          {espaco.rotulo}: escolha {quantidade} {quantidade === 1 ? "período" : "períodos"} de {espaco.duracaoHoras} {espaco.duracaoHoras === 1 ? "hora" : "horas"}
        </div>
        <div style={{ fontSize: "13px", color: completo ? "#009B3A" : "#666" }}>
          {doTipo.length} de {quantidade} {completo ? "escolhidos ✓" : "escolhidos"}
        </div>
      </div>

      <div role="tablist" aria-label={`Dias do ${espaco.rotulo}`} style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
        {DIAS_BIENAL.map((dia) => {
          const { semana, data } = rotuloDia(dia);
          const escolhidosNoDia = doTipo.filter((h) => h.dia === dia).length;
          return (
            <button
              key={dia}
              type="button"
              role="tab"
              aria-selected={dia === diaAtivo}
              onClick={() => setDiaAtivo(dia)}
              style={{
                background: dia === diaAtivo ? "#002776" : "white",
                color: dia === diaAtivo ? "white" : "#262626",
                border: dia === diaAtivo ? "1px solid #002776" : "1px solid #DDD",
                padding: "6px 10px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: 600,
                textTransform: "capitalize",
              }}
            >
              {semana} {data}
              {escolhidosNoDia > 0 && <span style={{ marginLeft: "6px", color: dia === diaAtivo ? "#FFDF00" : "#009B3A" }}>●</span>}
            </button>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "8px" }}>
        {horasInicioDoEspaco(tipo).map((hora) => {
          const horario: HorarioEscolhido = { tipo, dia: diaAtivo, horaInicio: hora };
          const marcado = selecionados.some((h) => chaveHorario(h) === chaveHorario(horario));
          const vagas = espaco.capacidade - (ocupacao[chaveHorario(horario)] ?? 0);
          const lotado = vagas <= 0 && !marcado;
          const semDireito = completo && !marcado && quantidade > 1;
          return (
            <button
              key={hora}
              type="button"
              disabled={lotado || semDireito}
              aria-pressed={marcado}
              onClick={() => onToggle(horario)}
              style={chip(marcado, lotado || semDireito)}
            >
              <div>
                {String(hora).padStart(2, "0")}h às {String(hora + espaco.duracaoHoras).padStart(2, "0")}h
              </div>
              <div style={{ fontSize: "11px", fontWeight: 400, opacity: 0.85 }}>
                {marcado ? "Escolhido" : lotado ? "Lotado" : espaco.capacidade === 1 ? "Livre" : `${vagas} ${vagas === 1 ? "vaga" : "vagas"}`}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Grade de escolha dos horários de balcão e auditório a que o pacote dá direito. */
export default function GradeHorarios({
  pacote,
  ocupacao,
  selecionados,
  onChange,
}: {
  pacote: PacoteContrato;
  ocupacao: Record<string, number>;
  selecionados: HorarioEscolhido[];
  onChange: (horarios: HorarioEscolhido[]) => void;
}) {
  const direitos = PACOTES[pacote];

  function alternar(horario: HorarioEscolhido) {
    const chave = chaveHorario(horario);
    if (selecionados.some((h) => chaveHorario(h) === chave)) {
      onChange(selecionados.filter((h) => chaveHorario(h) !== chave));
      return;
    }
    const limite = horario.tipo === "balcao" ? direitos.balcao : direitos.auditorio;
    const doTipo = selecionados.filter((h) => h.tipo === horario.tipo);
    if (limite === 1) {
      // Quando só há um período, clicar em outro horário troca o escolhido.
      onChange([...selecionados.filter((h) => h.tipo !== horario.tipo), horario]);
    } else if (doTipo.length < limite) {
      onChange([...selecionados, horario]);
    }
  }

  const ordenados = [...selecionados].sort((a, b) => a.dia.localeCompare(b.dia) || a.horaInicio - b.horaInicio);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {direitos.balcao > 0 && (
        <SecaoEspaco tipo="balcao" quantidade={direitos.balcao} ocupacao={ocupacao} selecionados={selecionados} onToggle={alternar} />
      )}
      {direitos.auditorio > 0 && (
        <SecaoEspaco tipo="auditorio" quantidade={direitos.auditorio} ocupacao={ocupacao} selecionados={selecionados} onToggle={alternar} />
      )}
      {ordenados.length > 0 && (
        <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "14px 16px" }}>
          <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px" }}>Seus horários</div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: 1.8 }}>
            {ordenados.map((h) => (
              <li key={chaveHorario(h)}>
                {rotuloHorario(h)}{" "}
                <button type="button" onClick={() => alternar(h)} style={{ background: "none", border: "none", color: "#C0392B", fontSize: "12px", fontWeight: 600 }}>
                  remover
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
