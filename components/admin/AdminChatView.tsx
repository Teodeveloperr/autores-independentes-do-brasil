"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { listarMensagensChatAdmin, enviarMensagemChatAdmin, removerMensagemChat } from "@/app/admin/actions";
import type { ChatMensagemRow } from "@/app/painel/actions";
import { initials } from "@/lib/format";

const INTERVALO_POLLING_MS = 4000;

export default function AdminChatView() {
  const [mensagens, setMensagens] = useState<ChatMensagemRow[]>([]);
  const [texto, setTexto] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [pending, startTransition] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelado = false;

    async function buscar() {
      const dados = await listarMensagensChatAdmin();
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
      const resultado = await enviarMensagemChatAdmin(valor);
      if (resultado?.error) {
        setErro(resultado.error);
        setTexto(valor);
        return;
      }
      const dados = await listarMensagensChatAdmin();
      setMensagens(dados);
    });
  }

  function onRemover(id: string, autorNome: string) {
    const ok = window.confirm(`Remover essa mensagem de ${autorNome} do Chat da Comunidade?`);
    if (!ok) return;
    startTransition(async () => {
      await removerMensagemChat(id);
      const dados = await listarMensagensChatAdmin();
      setMensagens(dados);
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Chat da Comunidade</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Sala única de chat entre os autores — o admin participa como &quot;Equipe Autores Independentes&quot; e
        pode remover mensagens, se precisar moderar algo.
      </p>
      <div style={{ background: "white", borderRadius: "10px", display: "flex", flexDirection: "column", height: "560px", overflow: "hidden" }}>
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {carregando ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "13px" }}>
              Carregando mensagens...
            </div>
          ) : mensagens.length === 0 ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "13px" }}>
              Nenhuma mensagem ainda.
            </div>
          ) : (
            mensagens.map((m) => (
              <div key={m.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
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
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#002776" }}>{m.authorNome}</span>
                    <span style={{ fontSize: "10px", color: "#AAA" }}>
                      {m.createdAt.toLocaleDateString("pt-BR")} {m.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#262626",
                      whiteSpace: "pre-line",
                      overflowWrap: "break-word",
                      marginTop: "2px",
                      display: "inline-block",
                      padding: m.deAdmin ? "8px 12px" : undefined,
                      borderRadius: m.deAdmin ? "8px" : undefined,
                      background: m.deAdmin ? "#EAF0FB" : undefined,
                      border: m.deAdmin ? "1px solid #C9D7F2" : undefined,
                    }}
                  >
                    {m.texto}
                  </div>
                </div>
                <button
                  onClick={() => onRemover(m.id, m.authorNome)}
                  disabled={pending}
                  title="Remover mensagem"
                  style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "28px", height: "28px", fontSize: "12px", color: "#C0392B", flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            ))
          )}
          <div ref={fimRef} />
        </div>
        <form onSubmit={onEnviar} style={{ borderTop: "1px solid #F0F0F0", padding: "14px 20px", display: "flex", gap: "10px" }}>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva como Equipe Autores Independentes..."
            maxLength={1000}
            style={{ flex: 1, padding: "10px 14px", border: "1px solid #DDD", borderRadius: "20px", fontSize: "13px" }}
          />
          <button
            type="submit"
            disabled={pending || !texto.trim()}
            style={{ background: "#002776", color: "white", padding: "10px 22px", fontWeight: 700, borderRadius: "20px", fontSize: "13px", opacity: pending || !texto.trim() ? 0.6 : 1 }}
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
