"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addCollectiveEvent, removeCollectiveEvent } from "@/app/admin/actions";
import type { CollectiveEvent } from "./types";

const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const CATEGORIAS = ["Bienais e Feiras", "Palestras e Workshops", "Encontros de Autores", "Lançamentos", "Eventos Online"];

export default function AdminAgendaView({ eventos }: { eventos: CollectiveEvent[] }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      await addCollectiveEvent(formData);
      router.refresh();
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      await removeCollectiveEvent(id);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Agenda do Coletivo</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Estes eventos aparecem na página pública &quot;Eventos&quot; para todos os visitantes.
      </p>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form action={onSubmit} style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>📅 Novo evento</div>
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
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Categoria</label>
            <select name="categoria" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Local</label>
            <input name="local" type="text" required placeholder="Ex: São Paulo, SP ou Online" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Período (texto livre)</label>
            <input name="periodo" type="text" placeholder="Ex: 3 a 13 de setembro" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Adicionando..." : "Adicionar à agenda"}
          </button>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {eventos.map((ev) => (
            <div key={ev.id} style={{ background: "white", borderRadius: "10px", padding: "16px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ background: "#F6F6F6", border: "1px solid #E0E0E0", borderRadius: "6px", padding: "8px 14px", textAlign: "center", flexShrink: 0 }}>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#C0392B" }}>{ev.dia}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#666" }}>{ev.mes}</div>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{ev.nome}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{ev.categoria} • 📍 {ev.local}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{ev.periodo}</div>
              </div>
              <button onClick={() => onRemove(ev.id)} title="Remover evento" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0 }}>
                ✕
              </button>
            </div>
          ))}
          {eventos.length === 0 && (
            <div style={{ background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Nenhum evento cadastrado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
