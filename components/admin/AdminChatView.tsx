"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { listarMensagensChatAdmin, removerMensagemChat } from "@/app/admin/actions";
import type { ChatMensagemRow } from "@/app/painel/actions";
import { initials } from "@/lib/format";

const INTERVALO_POLLING_MS = 4000;

export default function AdminChatView() {
  const [mensagens, setMensagens] = useState<ChatMensagemRow[]>([]);
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
        Acompanhamento da sala única de chat entre autores — só visualização e remoção de mensagens, quem escreve é
        o próprio autor pelo painel dele.
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
                    background: m.authorFotoUrl ? `center / cover no-repeat url(${m.authorFotoUrl})` : "#E0E0E0",
                    display: m.authorFotoUrl ? undefined : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#002776",
                  }}
                >
                  {!m.authorFotoUrl && initials(m.authorNome)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#002776" }}>{m.authorNome}</span>
                    <span style={{ fontSize: "10px", color: "#AAA" }}>
                      {m.createdAt.toLocaleDateString("pt-BR")} {m.createdAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div style={{ fontSize: "13px", color: "#262626", whiteSpace: "pre-line", overflowWrap: "break-word", marginTop: "2px" }}>
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
      </div>
    </div>
  );
}
