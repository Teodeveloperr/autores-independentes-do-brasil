"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useImageUpload } from "@/hooks/useImageUpload";
import { addBook, updateBook, removeBook } from "@/app/painel/actions";
import { GENEROS } from "@/lib/genres";
import { DESCONTOS_DISPONIVEIS } from "@/lib/desconto";
import PrecoComDesconto from "@/components/PrecoComDesconto";
import type { AuthorWithRelations } from "./types";

export default function LivrosView({ author }: { author: AuthorWithRelations }) {
  const capa = useImageUpload("capas");
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sinopseId, setSinopseId] = useState<string | null>(null);
  const router = useRouter();

  const sinopseBook = author.books.find((b) => b.id === sinopseId) ?? null;

  const editing = author.books.find((b) => b.id === editingId) ?? null;

  useEffect(() => {
    capa.setUrl(editing?.capaUrl ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId]);

  function onSubmit(formData: FormData) {
    setErro("");
    startTransition(async () => {
      try {
        if (editingId) {
          await updateBook(editingId, formData);
          setEditingId(null);
        } else {
          await addBook(formData);
          capa.setUrl("");
        }
        router.refresh();
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível salvar o livro.");
      }
    });
  }

  function onRemove(id: string) {
    if (editingId === id) setEditingId(null);
    startTransition(async () => {
      await removeBook(id);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Meus Livros</h2>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form
          key={editingId ?? "new"}
          action={(fd) => {
            fd.set("capaUrl", capa.url);
            onSubmit(fd);
          }}
          style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}
        >
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>
            {editing ? "✏️ Editar livro" : "📕 Colocar livro à venda"}
          </div>
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
            <input name="titulo" type="text" required defaultValue={editing?.titulo} placeholder="Ex: O Caminho das Palavras" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Gênero</label>
              <select name="genero" defaultValue={editing?.genero ?? GENEROS[0]} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
                {GENEROS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Preço (R$)</label>
              <input name="preco" type="text" required defaultValue={editing ? (editing.precoCentavos / 100).toFixed(2).replace(".", ",") : undefined} placeholder="49,90" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
            </div>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Desconto</label>
            <select name="descontoPercentual" defaultValue={editing?.descontoPercentual ?? 0} style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
              <option value={0}>Sem desconto</option>
              {DESCONTOS_DISPONIVEIS.map((d) => (
                <option key={d} value={d}>{d}% OFF</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Estoque (unidades)</label>
            <input name="estoque" type="number" required defaultValue={editing?.estoque} placeholder="20" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Sinopse</label>
            <textarea name="descricao" defaultValue={editing?.descricao ?? undefined} placeholder="Escreva uma breve sinopse da obra..." style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", minHeight: "80px", resize: "vertical" }} />
          </div>
          {erro && <p style={{ fontSize: "12px", color: "#C0392B" }}>{erro}</p>}
          <div style={{ display: "flex", gap: "10px" }}>
            {editing && (
              <button type="button" onClick={() => setEditingId(null)} style={{ flex: "0 0 auto", background: "white", border: "1px solid #DDD", color: "#262626", padding: "12px 20px", fontWeight: 600, borderRadius: "6px", fontSize: "14px" }}>
                Cancelar
              </button>
            )}
            <button type="submit" disabled={pending} style={{ flex: 1, background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}>
              {pending ? "Salvando..." : editing ? "Salvar alterações" : "Publicar livro à venda"}
            </button>
          </div>
        </form>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {author.books.map((b) => (
            <div key={b.id} style={{ background: "white", borderRadius: "10px", padding: "16px", display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
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
                  backgroundColor: b.capaUrl ? "#F6F6F6" : "#E0E0E0",
                  backgroundImage: b.capaUrl ? `url(${b.capaUrl})` : undefined,
                  backgroundSize: "contain",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              >
                {!b.capaUrl && "📖"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{b.titulo}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{b.genero}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Estoque: {b.estoque} unidades</div>
              </div>
              <PrecoComDesconto precoCentavos={b.precoCentavos} descontoPercentual={b.descontoPercentual} fontSize="15px" />
              <button
                onClick={() => setSinopseId(b.id)}
                style={{ background: "white", border: "1px solid #002776", color: "#002776", padding: "0 12px", height: "32px", fontSize: "12px", fontWeight: 600, borderRadius: "6px", flexShrink: 0 }}
              >
                Sinopse
              </button>
              <button onClick={() => setEditingId(b.id)} title="Editar livro" style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#002776", flexShrink: 0 }}>
                ✏️
              </button>
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

      {sinopseBook && (
        <div
          onClick={() => setSinopseId(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", borderRadius: "8px", padding: "28px", maxWidth: "480px", width: "100%", maxHeight: "80vh", overflowY: "auto" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#002776" }}>{sinopseBook.titulo}</h3>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>{sinopseBook.genero}</div>
              </div>
              <button
                onClick={() => setSinopseId(null)}
                aria-label="Fechar"
                style={{ background: "#F6F6F6", border: "none", borderRadius: "50%", width: "28px", height: "28px", fontSize: "14px", color: "#666", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7 }}>
              {sinopseBook.descricao || "Este livro ainda não tem uma sinopse cadastrada."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
