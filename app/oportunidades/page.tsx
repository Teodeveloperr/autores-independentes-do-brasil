import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import OportunidadesGrid from "@/components/OportunidadesGrid";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Oportunidades" };

export default async function OportunidadesPage() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const oportunidades = await prisma.opportunity.findMany({
    where: { prazoFinal: { gte: hoje } },
    orderBy: { prazoFinal: "asc" },
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="oportunidades" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
        <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>🚀 Oportunidades</h1>
          <p style={{ fontSize: "16px", marginBottom: "40px" }}>
            Editais, bienais, feiras, concursos, prêmios e outras oportunidades pra autores independentes, tudo centralizado em um só lugar.
          </p>
          <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px" }}>
            <OportunidadesGrid
              oportunidades={oportunidades.map((o) => ({
                id: o.id,
                nome: o.nome,
                categoria: o.categoria,
                prazoFinal: o.prazoFinal.toISOString(),
                estado: o.estado,
                valor: o.valor,
                link: o.link,
              }))}
            />
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
