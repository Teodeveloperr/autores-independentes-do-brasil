"use client";

import { useState, useTransition } from "react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { saveProfile } from "@/app/painel/actions";
import type { AuthorWithRelations } from "./types";

const GENEROS = ["Romance", "Poesia", "Ficção", "Fantasia", "Terror", "Ficção Científica", "Infantil", "Biografia"];

export default function PerfilView({ author }: { author: AuthorWithRelations }) {
  const avatar = useImageUpload("avatars", author.fotoUrl ?? "");
  const banner = useImageUpload("banners", author.bannerUrl ?? "");
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      await saveProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Meu Perfil</h2>
      <form action={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <input type="hidden" name="fotoUrl" value={avatar.url} />
        <input type="hidden" name="bannerUrl" value={banner.url} />

        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>🖼️ Banner do perfil</div>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "14px" }}>Aparece no topo do seu perfil público.</p>
          <label
            htmlFor="bannerInput"
            onDrop={banner.onDrop}
            onDragOver={banner.onDragOver}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "140px",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              color: "#666",
              border: "2px dashed #BBB",
              background: banner.url ? `center / cover no-repeat url(${banner.url})` : "#F6F6F6",
            }}
          >
            {!banner.url && <span>{banner.uploading ? "Enviando..." : "🖼️ Clique para adicionar um banner"}</span>}
          </label>
          <input id="bannerInput" type="file" accept="image/*" onChange={banner.onInputChange} style={{ display: "none" }} />
          {banner.error && <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "8px" }}>{banner.error}</p>}
          <p style={{ fontSize: "11px", color: "#999", marginTop: "10px" }}>📐 Tamanho recomendado: 1200 × 300px (proporção 4:1). JPG ou PNG, até 5MB.</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
          <div style={{ background: "white", borderRadius: "10px", padding: "24px", textAlign: "center" }}>
            <div
              style={{
                width: "140px",
                height: "140px",
                borderRadius: "50%",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "36px",
                color: "#999",
                background: avatar.url ? `center / cover no-repeat url(${avatar.url})` : "#E0E0E0",
              }}
            >
              {!avatar.url && (avatar.uploading ? "…" : "👤")}
            </div>
            <label htmlFor="avatarInput" style={{ display: "inline-block", background: "#002776", color: "white", padding: "8px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              📷 Alterar foto
            </label>
            <input id="avatarInput" type="file" accept="image/*" onChange={avatar.onInputChange} style={{ display: "none" }} />
            {avatar.error && <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "8px" }}>{avatar.error}</p>}
            <p style={{ fontSize: "11px", color: "#999", marginTop: "10px" }}>📐 Recomendado: quadrada (ex: 400×400px). JPG ou PNG, até 5MB.</p>
          </div>
          <div style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Nome completo</label>
              <input name="nome" type="text" required defaultValue={author.nome} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Gênero literário</label>
                <select name="genero" defaultValue={author.genero} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
                  {GENEROS.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Cidade / UF</label>
                <input name="cidade" type="text" defaultValue={author.cidade ?? ""} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Bio</label>
              <textarea name="bio" defaultValue={author.bio ?? ""} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", minHeight: "90px", resize: "vertical" }} />
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px 24px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}>
                {pending ? "Salvando..." : "Salvar alterações"}
              </button>
              {saved && (
                <span style={{ background: "#E9F5EE", color: "#009B3A", padding: "8px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: 600 }}>
                  ✓ Perfil atualizado com sucesso!
                </span>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
