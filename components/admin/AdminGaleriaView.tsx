"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/useImageUpload";
import { addCollectiveGalleryPhoto, removeCollectiveGalleryPhoto } from "@/app/admin/actions";
import type { CollectiveGalleryPhoto } from "./types";

const CATEGORIAS = ["Bienais e Feiras", "Lançamentos de Livros", "Palestras e Workshops", "Encontros de Autores", "Eventos Culturais", "Outros"];

export default function AdminGaleriaView({ fotos }: { fotos: CollectiveGalleryPhoto[] }) {
  const foto = useImageUpload("galeria-coletivo");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onRemove(id: string) {
    startTransition(async () => {
      await removeCollectiveGalleryPhoto(id);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Galeria do Coletivo</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Estas fotos aparecem na página pública &quot;Galeria&quot; para todos os visitantes.
      </p>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form
          action={(fd) => {
            fd.set("url", foto.url);
            startTransition(async () => {
              await addCollectiveGalleryPhoto(fd);
              foto.setUrl("");
              router.refresh();
            });
          }}
          style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>🖼️ Nova foto</div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Título da foto</label>
            <input name="titulo" type="text" required placeholder="Ex: Bienal do Livro SP 2026" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
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
              padding: "20px",
              textAlign: "center",
              fontSize: "13px",
              color: "#666",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              minHeight: "90px",
              background: foto.url ? `center / cover no-repeat url(${foto.url})` : "#F6F6F6",
            }}
          >
            {!foto.url && <div>{foto.uploading ? "Enviando..." : "📷 Arraste a foto aqui ou clique para selecionar"}</div>}
          </label>
          <input id="fotoInput" type="file" accept="image/*" onChange={foto.onInputChange} style={{ display: "none" }} />
          {foto.error && <p style={{ fontSize: "12px", color: "#C0392B" }}>{foto.error}</p>}
          <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Adicionando..." : "Adicionar à galeria"}
          </button>
        </form>
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px" }}>
          {fotos.map((f) => (
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
          {fotos.length === 0 && (
            <div style={{ gridColumn: "1 / -1", background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Nenhuma foto cadastrada ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
