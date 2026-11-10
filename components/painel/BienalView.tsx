"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { escolherHorarioBienal, removerHorarioBienal } from "@/app/painel/bienalActions";
import GradeHorarios from "@/components/contrato/GradeHorarios";
import { PREMIUM_PLUS_TROCA_ATE, chaveHorario, rotuloHorario, type HorarioEscolhido } from "@/lib/contrato/config";
import type { DadosBienalPainel } from "./types";

const card: React.CSSProperties = { background: "white", borderRadius: "10px", padding: "22px" };

function dataExibida(iso: string): string {
  return iso.split("-").reverse().join("/");
}

export default function BienalView({ plano, bienal }: { plano: string; bienal: DadosBienalPainel | null }) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [escolha, setEscolha] = useState<HorarioEscolhido[]>(bienal?.reserva ? [bienal.reserva] : []);
  const [erro, setErro] = useState("");
  const [salvou, setSalvou] = useState(false);

  if (plano !== "Autor Premium+" || !bienal) {
    return (
      <div style={card}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Bienal do Livro Rio 2027</h2>
        <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7 }}>
          Autores do plano <strong>Premium+</strong> escolhem aqui o horário das 2 horas de participação no estande do coletivo.
        </p>
      </div>
    );
  }

  const atual = bienal.reserva;
  const mudou = escolha.length === 1 && (!atual || chaveHorario(escolha[0]) !== chaveHorario(atual));

  function salvar() {
    if (escolha.length !== 1) return setErro("Escolha o dia e o horário.");
    setErro("");
    setSalvou(false);
    iniciarTransicao(async () => {
      const r = await escolherHorarioBienal(escolha[0].dia, escolha[0].horaInicio);
      if (r.error) return setErro(r.error);
      setSalvou(true);
      router.refresh();
    });
  }

  function remover() {
    setErro("");
    setSalvou(false);
    iniciarTransicao(async () => {
      const r = await removerHorarioBienal();
      if (r.error) return setErro(r.error);
      setEscolha([]);
      router.refresh();
    });
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "820px" }}>
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Bienal do Livro Rio 2027</h2>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6 }}>
          Seu plano Premium+ inclui <strong>2 horas no balcão do estande</strong> do coletivo (lançamento, autógrafos e conversa com
          leitores), de 3 a 12 de setembro de 2027, das 10h às 20h. Cada período comporta até 4 autores.
        </p>
      </div>

      <div style={card}>
        <div style={{ fontWeight: 700, color: "#002776", marginBottom: "10px" }}>Seu horário</div>
        {atual ? (
          <div style={{ background: "#E3F4EA", color: "#0a6130", padding: "12px 16px", borderRadius: "8px", fontWeight: 600, fontSize: "14px" }}>
            ✅ {rotuloHorario(atual)}
          </div>
        ) : (
          <div style={{ background: "#FFF6CC", color: "#6b5400", padding: "12px 16px", borderRadius: "8px", fontSize: "14px" }}>
            Você ainda não escolheu o horário. Escolha abaixo para garantir a sua vaga.
          </div>
        )}
        <p style={{ fontSize: "12px", color: "#666", marginTop: "10px", lineHeight: 1.6 }}>
          {bienal.podeEscolher
            ? `Você pode trocar o horário sozinho até ${dataExibida(PREMIUM_PLUS_TROCA_ATE)}, enquanto houver vaga. Depois dessa data, fale com a administração.`
            : "O prazo para trocar sozinho já passou. Para mudar o horário, fale com a administração."}
          {" "}A participação depende da programação e das regras da Bienal e vale enquanto o plano Premium+ estiver ativo.
        </p>
      </div>

      {bienal.podeEscolher && (
        <div style={card}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "12px" }}>{atual ? "Trocar o horário" : "Escolher o horário"}</div>
          <GradeHorarios pacote="lancamento" ocupacao={bienal.ocupacao} selecionados={escolha} onChange={(h) => { setEscolha(h); setErro(""); setSalvou(false); }} />
          {erro && <div role="alert" style={{ fontSize: "13px", color: "#C0392B", marginTop: "12px" }}>{erro}</div>}
          {salvou && <div style={{ fontSize: "13px", color: "#0a6130", marginTop: "12px" }}>Horário salvo.</div>}
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "14px" }}>
            <button type="button" onClick={salvar} disabled={pendente || !mudou} style={{ background: "#009B3A", color: "white", padding: "10px 20px", fontWeight: 700, borderRadius: "6px", fontSize: "13px", opacity: pendente || !mudou ? 0.6 : 1 }}>
              {pendente ? "Salvando..." : atual ? "Salvar novo horário" : "Confirmar horário"}
            </button>
            {atual && (
              <button type="button" onClick={remover} disabled={pendente} style={{ background: "white", border: "1px solid #DDD", color: "#C0392B", padding: "10px 20px", fontWeight: 600, borderRadius: "6px", fontSize: "13px" }}>
                Liberar minha vaga
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
