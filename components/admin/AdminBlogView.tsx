"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/useImageUpload";
import { uploadImage } from "@/lib/upload-client";
import { addArticle, removeArticle } from "@/app/admin/actions";
import type { Article } from "./types";

const CATEGORIAS = ["Artigos", "Entrevistas", "Dicas", "Mercado", "Autores", "Notícias", "Eventos"];

function wrapSelection(textarea: HTMLTextAreaElement, before: string, after: string = before) {
  const { selectionStart, selectionEnd, value } = textarea;
  const selected = value.slice(selectionStart, selectionEnd);
  textarea.value = value.slice(0, selectionStart) + before + selected + after + value.slice(selectionEnd);
  const cursorPos = selectionStart + before.length + selected.length + after.length;
  textarea.focus();
  textarea.setSelectionRange(cursorPos, cursorPos);
}

function insertAtCursor(textarea: HTMLTextAreaElement, text: string) {
  const { selectionStart, selectionEnd, value } = textarea;
  textarea.value = value.slice(0, selectionStart) + text + value.slice(selectionEnd);
  const cursorPos = selectionStart + text.length;
  textarea.focus();
  textarea.setSelectionRange(cursorPos, cursorPos);
}

const toolbarBtnStyle: React.CSSProperties = {
  background: "#F6F6F6",
  border: "1px solid #DDD",
  borderRadius: "4px",
  width: "30px",
  height: "30px",
  fontSize: "13px",
  color: "#262626",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

export default function AdminBlogView({ artigos }: { artigos: Article[] }) {
  const capa = useImageUpload("blog-capas");
  const [pending, startTransition] = useTransition();
  const [enviandoImagemConteudo, setEnviandoImagemConteudo] = useState(false);
  const conteudoRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  async function onInsertImagemConteudo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !conteudoRef.current) return;
    if (file.size > 5 * 1024 * 1024) {
      window.alert("A imagem deve ter até 5MB.");
      return;
    }
    setEnviandoImagemConteudo(true);
    try {
      const url = await uploadImage(file, "blog-conteudo");
      insertAtCursor(conteudoRef.current, `\n![](${url})\n`);
    } catch {
      window.alert("Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setEnviandoImagemConteudo(false);
    }
  }

  function onRemove(id: string) {
    const ok = window.confirm("Remover este artigo do blog?");
    if (!ok) return;
    startTransition(async () => {
      await removeArticle(id);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Blog do Coletivo</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px" }}>
        Estes artigos aparecem na página pública &quot;Blog&quot; para todos os visitantes.
      </p>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form
          action={(fd) => {
            fd.set("capaUrl", capa.url);
            startTransition(async () => {
              await addArticle(fd);
              capa.setUrl("");
              router.refresh();
            });
          }}
          style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>📝 Novo artigo</div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Título</label>
            <input name="titulo" type="text" required placeholder="Ex: O poder da literatura independente" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Resumo</label>
            <textarea name="resumo" required placeholder="Breve descrição que aparece no card do artigo..." style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", minHeight: "70px", resize: "vertical" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Conteúdo do artigo</label>
            <div style={{ display: "flex", gap: "6px", marginBottom: "6px" }}>
              <button type="button" title="Negrito" style={toolbarBtnStyle} onClick={() => conteudoRef.current && wrapSelection(conteudoRef.current, "**")}>
                <strong>B</strong>
              </button>
              <button type="button" title="Itálico" style={toolbarBtnStyle} onClick={() => conteudoRef.current && wrapSelection(conteudoRef.current, "*")}>
                <em>I</em>
              </button>
              <button type="button" title="Sublinhado" style={toolbarBtnStyle} onClick={() => conteudoRef.current && wrapSelection(conteudoRef.current, "__")}>
                <u>S</u>
              </button>
              <label htmlFor="conteudoImagemInput" title="Inserir imagem" style={{ ...toolbarBtnStyle, opacity: enviandoImagemConteudo ? 0.6 : 1 }}>
                {enviandoImagemConteudo ? "…" : "🖼️"}
              </label>
              <input id="conteudoImagemInput" type="file" accept="image/*" disabled={enviandoImagemConteudo} onChange={onInsertImagemConteudo} style={{ display: "none" }} />
            </div>
            <textarea
              ref={conteudoRef}
              name="conteudo"
              required
              placeholder="Texto completo do artigo, exibido na página do post..."
              style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", minHeight: "160px", resize: "vertical" }}
            />
            <p style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
              Selecione um trecho de texto e clique em B, I ou S para formatar. O botão 🖼️ insere uma imagem na posição do cursor.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Categoria</label>
              <select name="categoria" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
                {CATEGORIAS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Autor(a)</label>
              <input name="autorNome" type="text" placeholder="Ex: Mariana Costa" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Capa do artigo</label>
            <label
              htmlFor="capaInput"
              onDrop={capa.onDrop}
              onDragOver={capa.onDragOver}
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
                background: capa.url ? `center / cover no-repeat url(${capa.url})` : "#F6F6F6",
              }}
            >
              {!capa.url && <div>{capa.uploading ? "Enviando..." : "🖼️ Arraste a capa aqui ou clique para selecionar"}</div>}
            </label>
            <input id="capaInput" type="file" accept="image/*" onChange={capa.onInputChange} style={{ display: "none" }} />
            {capa.error && <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "6px" }}>{capa.error}</p>}
          </div>
          <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Publicando..." : "Publicar artigo"}
          </button>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {artigos.map((a) => (
            <div key={a.id} style={{ background: "white", borderRadius: "10px", padding: "16px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "6px",
                  flexShrink: 0,
                  background: a.capaUrl ? `center / cover no-repeat url(${a.capaUrl})` : "#E0E0E0",
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{a.titulo}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{a.categoria} • {a.autorNome}</div>
              </div>
              <button onClick={() => onRemove(a.id)} title="Remover artigo" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0 }}>
                ✕
              </button>
            </div>
          ))}
          {artigos.length === 0 && (
            <div style={{ background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Nenhum artigo publicado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
