"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEvent, removeEvent } from "@/app/painel/actions";
import type { AuthorWithRelations } from "./types";

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

const chipStyle = (status: string): React.CSSProperties => ({
  fontSize: "11px",
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: "12px",
  background: status === "Confirmado" ? "#E3F4E9" : "#FDF3D7",
  color: status === "Confirmado" ? "#009B3A" : "#A87900",
  whiteSpace: "nowrap",
  flexShrink: 0,
});

export default function EventosView({ author }: { author: AuthorWithRelations }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      await addEvent(formData);
      router.refresh();
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      await removeEvent(id);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Minha Agenda de Eventos</h2>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form action={onSubmit} style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>📅 Adicionar evento à agenda</div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Nome do evento</label>
            <input name="nome" type="text" required placeholder="Ex: Bienal do Livro – SP" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Dia</label>
              <input name="dia" type="number" required min={1} max={31} placeholder="15" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Mês</label>
              <select name="mes" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
                {MESES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Local</label>
            <input name="local" type="text" required placeholder="Ex: São Paulo, SP" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Status</label>
            <select name="status" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
              <option>Confirmado</option>
              <option>Pendente</option>
            </select>
          </div>
          <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Adicionando..." : "Adicionar à agenda"}
          </button>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {author.eventos.map((ev) => (
            <div key={ev.id} style={{ background: "white", borderRadius: "10px", padding: "16px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ background: "#F6F6F6", border: "1px solid #E0E0E0", borderRadius: "6px", padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#C0392B" }}>{ev.dia}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>{ev.mes}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{ev.nome}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>📍 {ev.local}</div>
              </div>
              <span style={chipStyle(ev.status)}>{ev.status}</span>
              <button onClick={() => onRemove(ev.id)} title="Remover evento" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0 }}>
                ✕
              </button>
            </div>
          ))}
          {author.eventos.length === 0 && (
            <div style={{ background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Você ainda não tem eventos na agenda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
