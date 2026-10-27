"use client";

import { useEffect, useRef, useState } from "react";
import { iniciarEnvioEbook, finalizarEnvioEbook, registrarFalhaEnvioEbook } from "@/app/painel/ebookActions";
import { converterEEnviarPdf, ErroEnvioEbook, type ProgressoEnvio } from "@/lib/ebookPdfCliente";

// Painel de progresso do envio do PDF de um e-book. Começa sozinho ao aparecer e avisa quando termina.
export default function EnvioEbook({ bookId, arquivo, onFim }: { bookId: string; arquivo: File; onFim: (concluiu: boolean) => void }) {
  const [progresso, setProgresso] = useState<ProgressoEnvio>({ fase: "lendo", atual: 0, total: 0 });
  const [erro, setErro] = useState("");
  const [concluido, setConcluido] = useState(false);
  const iniciou = useRef(false);
  const controle = useRef<AbortController | null>(null);

  useEffect(() => {
    if (iniciou.current) return;
    iniciou.current = true;
    const abort = new AbortController();
    controle.current = abort;

    (async () => {
      let mensagem = "";
      try {
        const inicio = await iniciarEnvioEbook(bookId);
        if (inicio.error || !inicio.versao) throw new ErroEnvioEbook(inicio.error ?? "Não foi possível iniciar o envio.");

        const total = await converterEEnviarPdf({ arquivo, bookId, versao: inicio.versao, sinal: abort.signal, onProgresso: setProgresso });
        const fim = await finalizarEnvioEbook(bookId, inicio.versao, total);
        if (fim.error) throw new ErroEnvioEbook(fim.error);
        setConcluido(true);
        return;
      } catch (e) {
        mensagem = e instanceof ErroEnvioEbook ? e.message : "Não foi possível converter este PDF. Tente de novo ou use outro arquivo.";
        if (!(e instanceof ErroEnvioEbook)) console.error("[ebook] Falha na conversão do PDF:", e);
      }
      setErro(mensagem);
      await registrarFalhaEnvioEbook(bookId, mensagem).catch(() => undefined);
    })();

    return () => {
      // Em desenvolvimento o React monta duas vezes: só cancela de verdade ao sair da tela.
    };
  }, [bookId, arquivo]);

  const pct = progresso.total > 0 ? Math.round((progresso.atual / progresso.total) * 100) : 0;
  const rotulo =
    progresso.fase === "lendo" ? "Lendo o PDF…" : progresso.fase === "finalizando" ? "Finalizando…" : `Convertendo e enviando a página ${Math.min(progresso.atual + 1, progresso.total)} de ${progresso.total}…`;

  return (
    <div role="status" style={{ background: "white", borderRadius: "10px", padding: "20px", border: "1px solid #E0E0E0" }}>
      <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>📖 Enviando o e-book</div>
      <div style={{ fontSize: "12px", color: "#666", marginBottom: "10px", wordBreak: "break-word" }}>{arquivo.name}</div>
      {!erro && !concluido && (
        <>
          <div style={{ height: "10px", background: "#EEE", borderRadius: "6px", overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: "#009B3A", transition: "width .2s" }} />
          </div>
          <div style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>{rotulo}</div>
          <p style={{ fontSize: "11px", color: "#999", marginTop: "8px" }}>
            Mantenha esta página aberta até terminar. O PDF é convertido no seu computador; ele não é enviado inteiro nem guardado pela plataforma.
          </p>
          <button
            type="button"
            onClick={() => controle.current?.abort()}
            style={{ marginTop: "10px", background: "white", border: "1px solid #DDD", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: 600, color: "#C0392B" }}
          >
            Cancelar envio
          </button>
        </>
      )}
      {concluido && (
        <>
          <div style={{ fontSize: "13px", color: "#009B3A", fontWeight: 600 }}>✅ Pronto! O e-book já está disponível para venda.</div>
          <button type="button" onClick={() => onFim(true)} style={{ marginTop: "10px", background: "#009B3A", color: "white", padding: "8px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: 700 }}>
            Fechar
          </button>
        </>
      )}
      {erro && (
        <>
          <div style={{ fontSize: "13px", color: "#C0392B", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>{erro}</div>
          <button type="button" onClick={() => onFim(false)} style={{ marginTop: "10px", background: "white", border: "1px solid #DDD", padding: "8px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: 600 }}>
            Fechar
          </button>
        </>
      )}
    </div>
  );
}
