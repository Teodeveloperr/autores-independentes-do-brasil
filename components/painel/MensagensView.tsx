"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { markConversationRead, sendMessage } from "@/app/painel/actions";
import type { AuthorWithRelations } from "./types";

export default function MensagensView({ author }: { author: AuthorWithRelations }) {
  const [selectedId, setSelectedId] = useState<string | null>(author.conversas[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selected = author.conversas.find((c) => c.id === selectedId) ?? null;

  function selectConversa(id: string) {
    setSelectedId(id);
    startTransition(async () => {
      await markConversationRead(id);
      router.refresh();
    });
  }

  function onReply(formData: FormData) {
    if (!selectedId) return;
    const texto = (formData.get("resposta") as string) || "";
    startTransition(async () => {
      await sendMessage(selectedId, texto);
      router.refresh();
    });
  }

  return (
    <div className="chat-grid" style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "20px", height: "560px" }}>
      <div style={{ background: "white", borderRadius: "10px", overflowY: "auto", padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
        {author.conversas.map((c) => (
          <button
            key={c.id}
            onClick={() => selectConversa(c.id)}
            style={{
              display: "flex",
              gap: "10px",
              alignItems: "center",
              width: "100%",
              textAlign: "left",
              padding: "10px",
              borderRadius: "8px",
              background: selectedId === c.id ? "#F1F8F4" : "white",
            }}
          >
            <div style={{ width: "40px", height: "40px", background: "#E0E0E0", borderRadius: "50%", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "13px", display: "flex", justifyContent: "space-between", gap: "6px" }}>
                <span>{c.nome}</span>
                {c.unread && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#009B3A", flexShrink: 0, marginTop: "4px" }} />}
              </div>
              <div style={{ fontSize: "12px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.mensagens[c.mensagens.length - 1]?.texto ?? ""}
              </div>
            </div>
          </button>
        ))}
        {author.conversas.length === 0 && (
          <div style={{ padding: "24px", textAlign: "center", color: "#666", fontSize: "13px" }}>Nenhuma conversa ainda.</div>
        )}
      </div>
      <div style={{ background: "white", borderRadius: "10px", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {selected ? (
          <>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F0F0F0", fontWeight: 700 }}>{selected.nome}</div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {selected.mensagens.map((m) => (
                <div key={m.id} style={{ display: "flex", justifyContent: m.de === "me" ? "flex-end" : "flex-start" }}>
                  <div
                    style={{
                      maxWidth: "70%",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      fontSize: "13px",
                      background: m.de === "me" ? "#009B3A" : "#F6F6F6",
                      color: m.de === "me" ? "white" : "#262626",
                    }}
                  >
                    {m.texto}
                  </div>
                </div>
              ))}
            </div>
            <form
              action={(fd) => {
                onReply(fd);
              }}
              style={{ display: "flex", gap: "10px", padding: "16px", borderTop: "1px solid #F0F0F0" }}
            >
              <input name="resposta" type="text" required placeholder="Escreva uma resposta..." style={{ flex: 1, padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
              <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "10px 20px", fontWeight: 700, borderRadius: "6px", fontSize: "13px", opacity: pending ? 0.7 : 1 }}>
                Enviar
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "14px" }}>
            Selecione uma conversa para responder
          </div>
        )}
      </div>
    </div>
  );
}
