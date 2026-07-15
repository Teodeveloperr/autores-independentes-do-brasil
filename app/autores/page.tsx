import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Autores" };

export default async function AutoresPage() {
  const authors = await prisma.author.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="autores" />
      <section style={{ background: "white", padding: "40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, color: "#002776", marginBottom: "40px" }}>Nossos Autores</h1>
        <div style={{ display: "flex", gap: "24px", marginBottom: "40px", flexWrap: "wrap" }}>
          <button style={{ background: "#002776", color: "white", padding: "8px 20px", borderRadius: "4px", fontSize: "14px", fontWeight: 600 }}>Todos</button>
          <button style={{ background: "white", border: "1px solid #DDD", padding: "8px 20px", borderRadius: "4px", fontSize: "14px" }}>Romance</button>
          <button style={{ background: "white", border: "1px solid #DDD", padding: "8px 20px", borderRadius: "4px", fontSize: "14px" }}>Poesia</button>
          <button style={{ background: "white", border: "1px solid #DDD", padding: "8px 20px", borderRadius: "4px", fontSize: "14px" }}>Fantasia</button>
          <button style={{ background: "white", border: "1px solid #DDD", padding: "8px 20px", borderRadius: "4px", fontSize: "14px" }}>Terror</button>
          <button style={{ background: "white", border: "1px solid #DDD", padding: "8px 20px", borderRadius: "4px", fontSize: "14px" }}>Ficção Científica</button>
          <input type="text" placeholder="Buscar autor..." style={{ marginLeft: "auto", padding: "8px 16px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }} />
        </div>
        {authors.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "24px" }}>
            {authors.map((a) => (
              <div key={a.id} style={{ background: "#F6F6F6", padding: "24px", borderRadius: "8px", textAlign: "center" }}>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    margin: "0 auto 16px",
                    background: a.fotoUrl ? `center / cover no-repeat url(${a.fotoUrl})` : "#E0E0E0",
                    display: a.fotoUrl ? undefined : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#002776",
                  }}
                >
                  {!a.fotoUrl && initials(a.nome)}
                </div>
                <div style={{ fontWeight: 700, marginBottom: "8px" }}>{a.nome}</div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>{a.genero || "—"}</div>
                <Link
                  href={`/perfil/${a.id}`}
                  style={{ display: "block", textAlign: "center", background: "#002776", color: "white", padding: "10px 20px", fontWeight: 600, width: "100%", borderRadius: "4px", textDecoration: "none" }}
                >
                  VER PERFIL
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>
              Ainda não há autores cadastrados no coletivo.
            </p>
            <Link href="/cadastro" style={{ display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
              Seja o primeiro a se cadastrar →
            </Link>
          </div>
        )}
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
