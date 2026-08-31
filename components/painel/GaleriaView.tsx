"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/useImageUpload";
import { addPhoto, removePhoto } from "@/app/painel/actions";
import type { AuthorWithRelations } from "./types";

const CATEGORIAS = ["Bienais e Feiras", "Lançamentos", "Palestras e Workshops", "Encontros de Autores", "Eventos Culturais", "Outros"];

export default function GaleriaView({ author }: { author: AuthorWithRelations }) {
  const foto = useImageUpload("galeria-pessoal");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState("");
  const router = useRouter();
  const ehIniciante = author.plano === "Iniciante";

  function onRemove(id: string) {
    startTransition(async () => {
      await removePhoto(id);
      router.refresh();
    });
  }

  if (ehIniciante) {
    return (
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Galeria de Fotos</h2>
        <div style={{ textAlign: "center", background: "white", borderRadius: "10px", padding: "40px 24px" }}>
          <div style={{ fontSize: "28px", marginBottom: "12px" }}>🖼️</div>
          <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.6, maxWidth: "380px", margin: "0 auto 20px" }}>
            A galeria de fotos fica disponível a partir do plano Essencial.
          </p>
          <a
            href="/assinatura"
            style={{ display: "inline-block", background: "#009B3A", color: "white", padding: "10px 24px", borderRadius: "6px", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}
          >
            Fazer upgrade do plano
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Minha Galeria de Fotos</h2>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form
          action={(fd) => {
            fd.set("url", foto.url);
            setErro("");
            startTransition(async () => {
              try {
                await addPhoto(fd);
                foto.setUrl("");
                router.refresh();
              } catch (err) {
                setErro(err instanceof Error ? err.message : "Não foi possível adicionar a foto.");
              }
            });
          }}
          style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>🖼️ Adicionar foto à galeria</div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Título da foto</label>
            <input name="titulo" type="text" required placeholder="Ex: Lançamento na Bienal" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Categoria</label>
            <select name="categoria" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
              {CATEGORIAS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <label
            htmlFor="fotoInput"
            onDrop={foto.onDrop}
            onDragOver={foto.onDragOver}
            style={{
              border: "2px dashed #BBB",
              borderRadius: "8px",
              padding: "24px",
              textAlign: "center",
              fontSize: "13px",
              color: "#666",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              minHeight: "110px",
              justifyContent: "center",
              background: foto.url ? `center / cover no-repeat url(${foto.url})` : "#F6F6F6",
            }}
          >
            {!foto.url && <div>{foto.uploading ? "Enviando..." : "📷 Arraste a foto aqui ou clique para selecionar"}</div>}
          </label>
          <input id="fotoInput" type="file" accept="image/*" onChange={foto.onInputChange} style={{ display: "none" }} />
          {foto.error && <p style={{ fontSize: "12px", color: "#C0392B" }}>{foto.error}</p>}
          {erro && <p style={{ fontSize: "12px", color: "#C0392B" }}>{erro}</p>}
          <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.6 : 1 }}>
            {pending ? "Adicionando..." : "Adicionar foto"}
          </button>
        </form>
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {author.fotos.map((f) => (
            <div key={f.id} style={{ background: "white", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ aspectRatio: "4/3", background: `center / cover no-repeat url(${f.url})` }} />
              <div style={{ padding: "10px 12px", display: "flex", gap: "8px", alignItems: "center" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "12px" }}>{f.titulo}</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>{f.categoria}</div>
                </div>
                <button onClick={() => onRemove(f.id)} title="Remover foto" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "26px", height: "26px", fontSize: "11px", color: "#C0392B", flexShrink: 0 }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
          {author.fotos.length === 0 && (
            <div style={{ gridColumn: "1 / -1", background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Você ainda não adicionou fotos à galeria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
