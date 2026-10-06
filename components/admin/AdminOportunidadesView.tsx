"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addOpportunity, updateOpportunity, removeOpportunity } from "@/app/admin/actions";
import { CATEGORIAS_OPORTUNIDADES as CATEGORIAS } from "@/lib/adminOptions";
import { REGIOES_OPORTUNIDADES } from "@/lib/regioes";
import type { Opportunity } from "./types";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Estado próprio (dentro do <form key=...>) pra desabilitar a data quando marcar fluxo contínuo.
function CampoPrazo({ prazoInicial }: { prazoInicial: Date | null | undefined }) {
  const [fluxoContinuo, setFluxoContinuo] = useState(prazoInicial === null);
  return (
    <div>
      <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Prazo final</label>
      <input
        name="prazoFinal"
        type="date"
        required={!fluxoContinuo}
        disabled={fluxoContinuo}
        defaultValue={prazoInicial ? toDateInputValue(prazoInicial) : undefined}
        style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", opacity: fluxoContinuo ? 0.5 : 1 }}
      />
      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#444", marginTop: "6px", fontWeight: 400 }}>
        <input type="checkbox" name="fluxoContinuo" checked={fluxoContinuo} onChange={(e) => setFluxoContinuo(e.target.checked)} />
        Fluxo contínuo (sem prazo de encerramento)
      </label>
    </div>
  );
}

export default function AdminOportunidadesView({ oportunidades }: { oportunidades: Opportunity[] }) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const router = useRouter();

  const editing = oportunidades.find((o) => o.id === editingId) ?? null;

  function onSubmit(formData: FormData) {
    setErro("");
    startTransition(async () => {
      const resultado = editingId ? await updateOpportunity(editingId, formData) : await addOpportunity(formData);
      if (resultado?.error) {
        setErro(resultado.error);
        return;
      }
      if (editingId) setEditingId(null);
      router.refresh();
    });
  }

  function onRemove(id: string) {
    if (editingId === id) setEditingId(null);
    startTransition(async () => {
      await removeOpportunity(id);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Oportunidades</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Estas oportunidades aparecem na página pública &quot;Oportunidades&quot; enquanto o prazo final não vencer.
      </p>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form key={editingId ?? "new"} action={onSubmit} style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>
            {editing ? "✏️ Editar oportunidade" : "🚀 Nova oportunidade"}
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Nome</label>
            <input name="nome" type="text" required defaultValue={editing?.nome} placeholder="Ex: Edital de Fomento à Literatura — MinC" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Categoria</label>
              <select name="categoria" defaultValue={editing?.categoria ?? CATEGORIAS[0]} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <CampoPrazo prazoInicial={editing?.prazoFinal} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Região</label>
              <select name="regiao" defaultValue={editing?.regiao ?? REGIOES_OPORTUNIDADES[0]} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
                {REGIOES_OPORTUNIDADES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Estado (opcional)</label>
              <input name="estado" type="text" defaultValue={editing?.estado} placeholder="Ex: Bahia" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Valor (opcional)</label>
            <input name="valor" type="text" defaultValue={editing?.valor ?? ""} placeholder="Ex: R$ 5.000 ou Gratuito" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Link de inscrição</label>
            <input name="link" type="text" required defaultValue={editing?.link} placeholder="https://..." style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          {erro && <p style={{ fontSize: "12px", color: "#C0392B" }}>{erro}</p>}
          <div style={{ display: "flex", gap: "10px" }}>
            {editing && (
              <button type="button" onClick={() => setEditingId(null)} style={{ flex: "0 0 auto", background: "white", border: "1px solid #DDD", color: "#262626", padding: "12px 20px", fontWeight: 600, borderRadius: "6px", fontSize: "14px" }}>
                Cancelar
              </button>
            )}
            <button type="submit" disabled={pending} style={{ flex: 1, background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}>
              {pending ? "Salvando..." : editing ? "Salvar alterações" : "Publicar oportunidade"}
            </button>
          </div>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {oportunidades.map((o) => (
            <div key={o.id} style={{ background: "white", borderRadius: "10px", padding: "16px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{o.nome}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {o.categoria} • 📍 {o.regiao}{o.estado ? ` — ${o.estado}` : ""} • {o.prazoFinal ? `até ${o.prazoFinal.toLocaleDateString("pt-BR", { timeZone: "UTC" })}` : "fluxo contínuo"}
                  {o.valor ? ` • ${o.valor}` : ""}
                </div>
              </div>
              <button onClick={() => setEditingId(o.id)} title="Editar oportunidade" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#002776", flexShrink: 0 }}>
                ✏️
              </button>
              <button onClick={() => onRemove(o.id)} title="Remover oportunidade" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0 }}>
                ✕
              </button>
            </div>
          ))}
          {oportunidades.length === 0 && (
            <div style={{ background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Nenhuma oportunidade cadastrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
