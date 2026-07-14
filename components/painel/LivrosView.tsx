"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/useImageUpload";
import { addBook, removeBook } from "@/app/painel/actions";
import { brl } from "@/lib/format";
import type { AuthorWithRelations } from "./types";

const GENEROS = ["Romance", "Poesia", "Ficção", "Fantasia", "Terror", "Ficção Científica", "Infantil", "Biografia"];

export default function LivrosView({ author }: { author: AuthorWithRelations }) {
  const capa = useImageUpload("capas");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      await addBook(formData);
      capa.setUrl("");
      router.refresh();
    });
  }

  function onRemove(id: string) {
    startTransition(async () => {
      await removeBook(id);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Meus Livros</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form
          action={(fd) => {
            fd.set("capaUrl", capa.url);
            onSubmit(fd);
          }}
          style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>📕 Colocar livro à venda</div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Capa do livro</label>
            <label
              htmlFor="capaInput"
              onDrop={capa.onDrop}
              onDragOver={capa.onDragOver}
              style={{
                border: "2px dashed #BBB",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
                fontSize: "13px",
                color: "#666",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                minHeight: "90px",
                justifyContent: "center",
                background: capa.url ? `center / cover no-repeat url(${capa.url})` : "transparent",
              }}
            >
              {!capa.url && <div>{capa.uploading ? "Enviando..." : "📕 Arraste a capa aqui ou clique para selecionar"}</div>}
            </label>
            <input id="capaInput" type="file" accept="image/*" onChange={capa.onInputChange} style={{ display: "none" }} />
            {capa.error && <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "6px" }}>{capa.error}</p>}
            <p style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>📐 Recomendado: proporção 3:4 (ex: 600×800px). JPG ou PNG, até 5MB.</p>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Título do livro</label>
            <input name="titulo" type="text" required placeholder="Ex: O Caminho das Palavras" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Gênero</label>
              <select name="genero" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
                {GENEROS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Preço (R$)</label>
              <input name="preco" type="text" required placeholder="49,90" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Estoque (unidades)</label>
            <input name="estoque" type="number" required placeholder="20" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Sinopse</label>
            <textarea name="descricao" placeholder="Escreva uma breve sinopse da obra..." style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", minHeight: "80px", resize: "vertical" }} />
          </div>
          <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}>
            {pending ? "Publicando..." : "Publicar livro à venda"}
          </button>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {author.books.map((b) => (
            <div key={b.id} style={{ background: "white", borderRadius: "10px", padding: "16px", display: "flex", gap: "16px", alignItems: "center" }}>
              <div
                style={{
                  width: "56px",
                  height: "74px",
                  borderRadius: "4px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  background: b.capaUrl ? `center / cover no-repeat url(${b.capaUrl})` : "#E0E0E0",
                }}
              >
                {!b.capaUrl && "📖"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{b.titulo}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{b.genero}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Estoque: {b.estoque} unidades</div>
              </div>
              <div style={{ fontWeight: 700, color: "#009B3A", fontSize: "15px" }}>{brl(b.precoCentavos)}</div>
              <button onClick={() => onRemove(b.id)} title="Remover livro" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0 }}>
                ✕
              </button>
            </div>
          ))}
          {author.books.length === 0 && (
            <div style={{ background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Você ainda não colocou nenhum livro à venda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
