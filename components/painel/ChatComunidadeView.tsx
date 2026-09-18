"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { listarMensagensChat, enviarMensagemChat, type ChatMensagemRow } from "@/app/painel/actions";
import { initials } from "@/lib/format";

const INTERVALO_POLLING_MS = 4000;

export default function ChatComunidadeView({ authorId }: { authorId: string }) {
  const [mensagens, setMensagens] = useState<ChatMensagemRow[]>([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pending, startTransition] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;

    async function buscar() {
      const dados = await listarMensagensChat();
      if (!cancelado) {
        setMensagens(dados);
        setCarregando(false);
      }
    }

    buscar();
    const intervalo = setInterval(buscar, INTERVALO_POLLING_MS);
    return () => {
      cancelado = true;
      clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  function onEnviar(e: React.FormEvent) {
    e.preventDefault();
    const valor = texto;
    if (!valor.trim()) return;
    setErro("");
    setTexto("");
    startTransition(async () => {
      const resultado = await enviarMensagemChat(valor);
      if (resultado?.error) {
        setErro(resultado.error);
        setTexto(valor);
        return;
      }
      const dados = await listarMensagensChat();
      setMensagens(dados);
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Chat da Comunidade</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Uma sala única onde todos os autores do coletivo podem conversar. As mensagens são atualizadas a cada
        poucos segundos.
      </p>
      <div style={{ background: "white", borderRadius: "10px", display: "flex", flexDirection: "column", height: "560px", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {carregando ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "13px" }}>
              Carregando mensagens...
            </div>
          ) : mensagens.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "13px", textAlign: "center" }}>
              Nenhuma mensagem ainda — seja o primeiro a puxar assunto com o coletivo!
            </div>
          ) : (
            mensagens.map((m) => {
              const minhaMensagem = !m.deAdmin && m.authorId === authorId;
              return (
                <div key={m.id} style={{ display: "flex", gap: "10px", flexDirection: minhaMensagem ? "row-reverse" : "row" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      flexShrink: 0,
                      background: m.deAdmin ? "#002776" : m.authorFotoUrl ? `center / cover no-repeat url(${m.authorFotoUrl})` : "#E0E0E0",
                      display: m.deAdmin || !m.authorFotoUrl ? "flex" : undefined,
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: m.deAdmin ? "15px" : "11px",
                      fontWeight: 700,
                      color: m.deAdmin ? "white" : "#002776",
                    }}
                  >
                    {m.deAdmin ? "🏛️" : !m.authorFotoUrl && initials(m.authorNome)}
                  </div>
                  <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: minhaMensagem ? "flex-end" : "flex-start" }}>
                    {!minhaMensagem && (
                      <div style={{ fontSize: "11px", fontWeight: 700, color: m.deAdmin ? "#002776" : "#666", marginBottom: "3px" }}>
                        {m.authorNome}
                      </div>
                    )}
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "12px",
                        fontSize: "13px",
                        background: minhaMensagem ? "#009B3A" : m.deAdmin ? "#EAF0FB" : "#F6F6F6",
                        color: minhaMensagem ? "white" : "#262626",
                        border: m.deAdmin ? "1px solid #C9D7F2" : undefined,
                        whiteSpace: "pre-line",
                        overflowWrap: "break-word",
                      }}
                    >
                      {m.texto}
                    </div>
                    <div style={{ fontSize: "10px", color: "#AAA", marginTop: "3px" }}>
                      {m.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={fimRef} />
        </div>
        <form onSubmit={onEnviar} style={{ borderTop: "1px solid #F0F0F0", padding: "14px 20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva uma mensagem para o coletivo..."
            maxLength={1000}
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
