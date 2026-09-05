"use client";

import { useState, useTransition } from "react";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useVideoUpload } from "@/hooks/useVideoUpload";
import { saveProfile } from "@/app/painel/actions";
import type { AuthorWithRelations } from "./types";
import { GENEROS } from "@/lib/genres";
import { BIO_MAX_CARACTERES_INICIANTE } from "@/lib/plans";
import BannerPositioner from "@/components/BannerPositioner";

export default function PerfilView({ author }: { author: AuthorWithRelations }) {
  const avatar = useImageUpload("avatars", author.fotoUrl ?? "");
  const banner = useImageUpload("banners", author.bannerUrl ?? "");
  const video = useVideoUpload("videos", author.videoUrl ?? "");
  const [bannerPos, setBannerPos] = useState({ x: author.bannerPositionX ?? 50, y: author.bannerPositionY ?? 50 });
  const ehIniciante = author.plano === "Iniciante";
  const [bio, setBio] = useState((author.bio ?? "").slice(0, ehIniciante ? BIO_MAX_CARACTERES_INICIANTE : undefined));
  const [frase, setFrase] = useState(author.fraseApresentacao ?? "");
  const [saved, setSaved] = useState(false);
  const [erro, setErro] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setErro("");
    startTransition(async () => {
      try {
        const resultado = await saveProfile(formData);
        if (resultado?.error) {
          setErro(resultado.error);
          return;
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível salvar o perfil.");
      }
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Meu Perfil</h2>
      <form action={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <input type="hidden" name="fotoUrl" value={avatar.url} />
        <input type="hidden" name="bannerUrl" value={banner.url} />
        <input type="hidden" name="bannerPositionX" value={bannerPos.x} />
        <input type="hidden" name="bannerPositionY" value={bannerPos.y} />
        <input type="hidden" name="videoUrl" value={video.url} />

        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>🖼️ Banner do perfil</div>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "14px" }}>Aparece no topo do seu perfil público.</p>
          {banner.url ? (
            <>
              <BannerPositioner
                url={banner.url}
                positionX={bannerPos.x}
                positionY={bannerPos.y}
                onChange={(x, y) => setBannerPos({ x, y })}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
                <p style={{ fontSize: "11px", color: "#999" }}>✋ Arraste a imagem pra ajustar o enquadramento.</p>
                <label htmlFor="bannerInput" style={{ fontSize: "12px", fontWeight: 600, color: "#002776", cursor: "pointer" }}>
                  Trocar imagem
                </label>
              </div>
            </>
          ) : (
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
                background: "#F6F6F6",
              }}
            >
              <span>{banner.uploading ? "Enviando..." : "🖼️ Clique para adicionar um banner"}</span>
            </label>
          )}
          <input
            id="bannerInput"
            type="file"
            accept="image/*"
            onChange={(e) => {
              setBannerPos({ x: 50, y: 50 });
              banner.onInputChange(e);
            }}
            style={{ display: "none" }}
          />
          {banner.error && <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "8px" }}>{banner.error}</p>}
          <p style={{ fontSize: "11px", color: "#999", marginTop: "10px" }}>📐 Tamanho recomendado: 1200 × 300px (proporção 4:1). JPG ou PNG, até 5MB.</p>
        </div>

        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>🎥 Vídeo de apresentação (opcional)</div>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "14px" }}>Um vídeo curto se apresentando, visível no seu perfil público.</p>
          {video.url ? (
            <>
              <video controls playsInline src={video.url} style={{ width: "100%", maxWidth: "360px", borderRadius: "8px", display: "block" }} />
              <div style={{ display: "flex", gap: "16px", marginTop: "8px" }}>
                <label htmlFor="videoInput" style={{ fontSize: "12px", fontWeight: 600, color: "#002776", cursor: "pointer" }}>
                  Trocar vídeo
                </label>
                <button type="button" onClick={video.remove} style={{ background: "white", fontSize: "12px", fontWeight: 600, color: "#C0392B", padding: 0 }}>
                  Remover vídeo
                </button>
              </div>
            </>
          ) : (
            <label
              htmlFor="videoInput"
              onDrop={video.onDrop}
              onDragOver={video.onDragOver}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                color: "#666",
                border: "2px dashed #BBB",
                background: "#F6F6F6",
              }}
            >
              <span>{video.uploading ? "Enviando..." : "🎥 Clique para adicionar um vídeo"}</span>
            </label>
          )}
          <input id="videoInput" type="file" accept="video/mp4,video/webm,video/quicktime" onChange={video.onInputChange} style={{ display: "none" }} />
          {video.error && <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "8px" }}>{video.error}</p>}
          <p style={{ fontSize: "11px", color: "#999", marginTop: "10px" }}>📐 Até 30 segundos e 25MB. MP4, WebM ou MOV.</p>
        </div>

        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
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
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Gêneros literários</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 14px", padding: "10px", border: "1px solid #DDD", borderRadius: "6px" }}>
                {GENEROS.map((g) => (
                  <label key={g} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 400 }}>
                    <input type="checkbox" name="generos" value={g} defaultChecked={author.generos.includes(g)} />
                    {g}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Cidade / UF</label>
              <input name="cidade" type="text" defaultValue={author.cidade ?? ""} placeholder="Ex: Fortaleza, CE" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Profissões / atuações (opcional)</label>
              <input name="profissoes" type="text" defaultValue={author.profissoes ?? ""} placeholder="Ex: Psicólogo, Produtor Cultural" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
              <p style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Aparece no seu card como &quot;Escritor | (o que você escrever aqui)&quot;.</p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Frase de apresentação (opcional)</label>
              <input
                name="fraseApresentacao"
                type="text"
                value={frase}
                onChange={(e) => setFrase(e.target.value)}
                maxLength={140}
                placeholder='Ex: "Histórias também podem ser caminhos de transformação."'
                style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
              />
              <p style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>{frase.length}/140 caracteres — aparece em destaque no seu card na página de Autores.</p>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Bio</label>
              <textarea
                name="bio"
                value={bio}
                onChange={(e) => setBio(ehIniciante ? e.target.value.slice(0, BIO_MAX_CARACTERES_INICIANTE) : e.target.value)}
                maxLength={ehIniciante ? BIO_MAX_CARACTERES_INICIANTE : undefined}
                style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", minHeight: "90px", resize: "vertical" }}
              />
              {ehIniciante && (
                <p style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>
                  {bio.length}/{BIO_MAX_CARACTERES_INICIANTE} caracteres — o plano Iniciante tem bio limitada.{" "}
                  <a href="/assinatura" style={{ color: "#002776", fontWeight: 600 }}>Fazer upgrade →</a>
                </p>
              )}
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>📷 Instagram</label>
              <input name="instagramUrl" type="text" placeholder="https://instagram.com/seuusuario" defaultValue={author.instagramUrl ?? ""} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>🐦 Twitter / X</label>
              <input name="twitterUrl" type="text" placeholder="https://x.com/seuusuario" defaultValue={author.twitterUrl ?? ""} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>🔗 Site</label>
              <input name="siteUrl" type="text" placeholder="https://seusite.com.br" defaultValue={author.siteUrl ?? ""} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>

            {erro && <p style={{ fontSize: "13px", color: "#C0392B" }}>{erro}</p>}
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
