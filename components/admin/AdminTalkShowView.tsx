"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addTalkShowVideo, updateTalkShowVideo, removeTalkShowVideo } from "@/app/admin/actions";
import { extrairYoutubeId } from "@/lib/youtube";
import type { TalkShowVideo } from "./types";

export default function AdminTalkShowView({ videos }: { videos: TalkShowVideo[] }) {
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [youtubeUrlInput, setYoutubeUrlInput] = useState("");
  const [erro, setErro] = useState("");
  const router = useRouter();

  const editing = videos.find((v) => v.id === editingId) ?? null;
  const previewId = extrairYoutubeId(youtubeUrlInput || editing?.youtubeUrl || "");

  function onEdit(v: TalkShowVideo) {
    setEditingId(v.id);
    setYoutubeUrlInput(v.youtubeUrl);
    setErro("");
  }

  function onCancelEdit() {
    setEditingId(null);
    setYoutubeUrlInput("");
    setErro("");
  }

  function onRemove(id: string) {
    const ok = window.confirm("Remover este vídeo do Talk Show / Conteúdos?");
    if (!ok) return;
    if (editingId === id) onCancelEdit();
    startTransition(async () => {
      await removeTalkShowVideo(id);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Talk Show / Conteúdos</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Estes vídeos aparecem na página pública &quot;Talk Show / Conteúdos&quot; para todos os visitantes.
      </p>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form
          key={editingId ?? "new"}
          action={(fd) => {
            setErro("");
            startTransition(async () => {
              const resultado = editingId ? await updateTalkShowVideo(editingId, fd) : await addTalkShowVideo(fd);
              if (resultado?.error) {
                setErro(resultado.error);
                return;
              }
              onCancelEdit();
              router.refresh();
            });
          }}
          style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>
            {editing ? "✏️ Editar vídeo" : "🎙️ Novo vídeo"}
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Título</label>
            <input
              name="titulo"
              type="text"
              required
              defaultValue={editing?.titulo}
              placeholder="Ex: Bate-papo sobre literatura independente"
              style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Descrição (opcional)</label>
            <textarea
              name="descricao"
              defaultValue={editing?.descricao ?? undefined}
              placeholder="Breve descrição do vídeo..."
              style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", minHeight: "70px", resize: "vertical" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Link do YouTube</label>
            <input
              name="youtubeUrl"
              type="url"
              required
              defaultValue={editing?.youtubeUrl}
              onChange={(e) => setYoutubeUrlInput(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
            />
            {previewId && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
                alt="Prévia do vídeo"
                style={{ marginTop: "10px", borderRadius: "6px", width: "160px" }}
              />
            )}
          </div>
          {erro && (
            <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>{erro}</div>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            {editing && (
              <button
                type="button"
                onClick={onCancelEdit}
                style={{ flex: "0 0 auto", background: "white", border: "1px solid #DDD", color: "#262626", padding: "12px 20px", fontWeight: 600, borderRadius: "6px", fontSize: "14px" }}
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={pending}
              style={{ flex: 1, background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "Salvando..." : editing ? "Salvar alterações" : "Publicar vídeo"}
            </button>
          </div>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {videos.map((v) => {
            const id = extrairYoutubeId(v.youtubeUrl);
            return (
              <div key={v.id} style={{ background: "white", borderRadius: "10px", padding: "16px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: "80px",
                    height: "56px",
                    borderRadius: "6px",
                    flexShrink: 0,
                    background: id ? `center / cover no-repeat url(https://img.youtube.com/vi/${id}/mqdefault.jpg)` : "#E0E0E0",
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{v.titulo}</div>
                  {v.descricao && (
                    <div style={{ fontSize: "12px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v.descricao}</div>
                  )}
                </div>
                <button onClick={() => onEdit(v)} title="Editar vídeo" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#002776", flexShrink: 0 }}>
                  ✏️
                </button>
                <button onClick={() => onRemove(v.id)} title="Remover vídeo" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0 }}>
                  ✕
                </button>
              </div>
            );
          })}
          {videos.length === 0 && (
            <div style={{ background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Nenhum vídeo publicado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
