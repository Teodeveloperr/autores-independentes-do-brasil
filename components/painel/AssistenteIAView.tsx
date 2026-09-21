"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { perguntarIA } from "@/app/painel/actions";

type MensagemExibida = { role: "user" | "assistant"; texto: string };

export default function AssistenteIAView() {
  const [mensagens, setMensagens] = useState<MensagemExibida[]>([
    { role: "assistant", texto: "Olá! Sou o assistente de dúvidas do Autores Independentes do Brasil. Pode perguntar sobre planos, vendas, repasse, cadastro e mais." },
  ]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [pending, startTransition] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens, pending]);

  function onEnviar(e: React.FormEvent) {
    e.preventDefault();
    const pergunta = texto.trim();
    if (!pergunta) return;

    setErro("");
    setTexto("");
    const historico = [...mensagens, { role: "user" as const, texto: pergunta }];
    setMensagens(historico);

    startTransition(async () => {
      const resultado = await perguntarIA(historico.map((m) => ({ role: m.role, texto: m.texto })));
      if ("error" in resultado) {
        setErro(resultado.error);
        return;
      }
      setMensagens((atual) => [...atual, { role: "assistant", texto: resultado.resposta }]);
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>🤖 Tirar Dúvidas com IA</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Pergunte sobre como a plataforma funciona — planos, vendas, repasse, cadastro e mais. As respostas são
        geradas automaticamente e podem não cobrir tudo; em caso de dúvida, fale com a nossa equipe.
      </p>
      <div style={{ background: "white", borderRadius: "10px", display: "flex", flexDirection: "column", height: "560px", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {mensagens.map((m, i) => {
            const minhaMensagem = m.role === "user";
            return (
              <div key={i} style={{ display: "flex", gap: "10px", flexDirection: minhaMensagem ? "row-reverse" : "row" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    flexShrink: 0,
                    background: minhaMensagem ? "#E0E0E0" : "#002776",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "15px",
                    color: minhaMensagem ? "#002776" : "white",
                  }}
                >
                  {minhaMensagem ? "🙂" : "🤖"}
                </div>
                <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: minhaMensagem ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      background: minhaMensagem ? "#009B3A" : "#F6F6F6",
                      color: minhaMensagem ? "white" : "#262626",
                      whiteSpace: "pre-line",
                      overflowWrap: "break-word",
                    }}
                  >
                    {m.texto}
                  </div>
                </div>
              </div>
            );
          })}
          {pending && (
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", flexShrink: 0, background: "#002776", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", color: "white" }}>
                🤖
              </div>
              <div style={{ padding: "10px 14px", borderRadius: "12px", fontSize: "13px", background: "#F6F6F6", color: "#999" }}>
                Digitando...
              </div>
            </div>
          )}
          <div ref={fimRef} />
        </div>
        <form onSubmit={onEnviar} style={{ borderTop: "1px solid #F0F0F0", padding: "14px 20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva sua dúvida..."
            maxLength={2000}
            style={{ flex: 1, padding: "10px 14px", border: "1px solid #DDD", borderRadius: "20px", fontSize: "13px" }}
          />
          <button
            type="submit"
            disabled={pending || !texto.trim()}
            style={{ background: "#009B3A", color: "white", padding: "10px 22px", fontWeight: 700, borderRadius: "20px", fontSize: "13px", opacity: pending || !texto.trim() ? 0.6 : 1 }}
          >
            Enviar
          </button>
        </form>
        {erro && (
          <div style={{ padding: "0 20px 14px", fontSize: "12px", color: "#C0392B" }}>{erro}</div>
        )}
      </div>
    </div>
  );
}
