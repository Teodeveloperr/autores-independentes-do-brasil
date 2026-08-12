import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import EventosCalendario from "@/components/EventosCalendario";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Eventos" };

export default async function EventosPage() {
  const eventos = await prisma.collectiveEvent.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="eventos" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Eventos</h1>
        <p style={{ fontSize: "16px", marginBottom: "40px" }}>
          Acompanhe os próximos eventos do coletivo e participe de encontros, feiras, palestras e outras atividades literárias em todo o Brasil
        </p>
        <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px" }}>
          <EventosCalendario eventos={eventos} />
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
