import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { prisma } from "@/lib/db";
import { brl } from "@/lib/format";

export const metadata: Metadata = { title: "Livros" };

export default async function LivrosPage() {
  const books = await prisma.book.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: true },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="livros" />
      <section style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Todos os livros</h1>
        <p style={{ fontSize: "16px", marginBottom: "40px" }}>
          Descubra obras incríveis de autores independentes de todos o Brasil.
        </p>
        <div style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px" }}>
          <div style={{ display: "flex", gap: "24px" }}>
            <div style={{ flex: "0 0 200px" }}>
              <div style={{ fontWeight: 700, marginBottom: "16px" }}>Filtros</div>
              <div style={{ color: "#009B3A", fontSize: "14px", marginBottom: "24px", cursor: "pointer" }}>Limpar filtros</div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontWeight: 600, marginBottom: "12px" }}>Buscar livro</div>
                <input type="text" placeholder="Título, autor ou palavra-chave..." style={{ width: "100%", padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }} />
              </div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontWeight: 600, marginBottom: "12px" }}>Gênero literário</div>
                <select style={{ width: "100%", padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}>
                  <option>Selecionar gênero</option>
                </select>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontWeight: 600, marginBottom: "12px" }}>Formato</div>
                <label style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px" }}><input type="checkbox" /> Físico</label>
                <label style={{ display: "flex", gap: "8px", marginBottom: "8px", fontSize: "14px" }}><input type="checkbox" /> E-book</label>
                <label style={{ display: "flex", gap: "8px", fontSize: "14px" }}><input type="checkbox" /> Áudio livro</label>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontWeight: 600, marginBottom: "12px" }}>Faixa de preço</div>
                <div style={{ display: "flex", gap: "8px", fontSize: "12px", marginBottom: "8px" }}>
                  <input type="number" placeholder="R$ 0,00" style={{ flex: 1, padding: "8px", border: "1px solid #DDD", borderRadius: "4px" }} />
                  <input type="number" placeholder="R$ 200,00" style={{ flex: 1, padding: "8px", border: "1px solid #DDD", borderRadius: "4px" }} />
                </div>
              </div>
              <div style={{ marginBottom: "24px" }}>
                <div style={{ fontWeight: 600, marginBottom: "12px" }}>Autor</div>
                <select style={{ width: "100%", padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}>
                  <option>Selecionar autor</option>
                </select>
              </div>
              <button style={{ background: "#002776", color: "white", padding: "10px", width: "100%", fontWeight: 600, borderRadius: "4px" }}>Aplicar filtros</button>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <div style={{ color: "#262626" }}>{books.length} livro{books.length === 1 ? "" : "s"} encontrado{books.length === 1 ? "" : "s"}</div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <input type="text" placeholder="Buscar livro..." style={{ padding: "8px 16px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }} />
                  <select style={{ padding: "8px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}>
                    <option>Mais recentes</option>
                  </select>
                  <button style={{ background: "#002776", color: "white", padding: "8px 16px", borderRadius: "4px" }}>⊞⊞</button>
                  <button style={{ background: "white", border: "1px solid #DDD", padding: "8px 16px", borderRadius: "4px" }}>≡</button>
                </div>
              </div>
              {books.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
                  {books.map((b) => (
                    <div key={b.id} style={{ textAlign: "center" }}>
                      <div
                        style={{
                          background: b.capaUrl ? `center / cover no-repeat url(${b.capaUrl})` : "#E0E0E0",
                          aspectRatio: "3/4",
                          borderRadius: "4px",
                          marginBottom: "12px",
                        }}
                      />
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>{b.titulo}</div>
                      <div style={{ fontSize: "13px", color: "#666", marginBottom: "8px" }}>{b.author.nome}</div>
                      <div style={{ color: "#009B3A", fontWeight: 700, marginBottom: "12px" }}>{brl(b.precoCentavos)}</div>
                      <Link
                        href={`/perfil/${b.authorId}`}
                        style={{ display: "block", background: "#009B3A", color: "white", padding: "8px", fontSize: "13px", fontWeight: 600, width: "100%", borderRadius: "4px", textDecoration: "none" }}
                      >
                        Ver detalhes
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px 40px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                  Nenhum livro publicado ainda. Volte em breve!
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
