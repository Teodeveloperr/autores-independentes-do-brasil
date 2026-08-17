import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import AutoresGrid from "@/components/AutoresGrid";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Autores" };

export default async function AutoresPage() {
  const authors = await prisma.author.findMany({ where: { status: "ativo" }, orderBy: { createdAt: "desc" } });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="autores" />
      <section className="section-pad-lg" style={{ background: "white", padding: "40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, color: "#002776", marginBottom: "40px" }}>Nossos Autores</h1>
        <AutoresGrid authors={authors.map((a) => ({ id: a.id, nome: a.nome, generos: a.generos, fotoUrl: a.fotoUrl }))} />
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
