import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import GaleriaCatalogo from "@/components/GaleriaCatalogo";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Galeria" };

export default async function GaleriaPage() {
  const fotos = await prisma.collectiveGalleryPhoto.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="galeria" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Galeria</h1>
        <p style={{ fontSize: "16px", marginBottom: "40px" }}>
          Momentos que celebram a literatura, os autores independentes e o poder das palavras.
        </p>
        <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px" }}>
          {fotos.length > 0 ? (
            <GaleriaCatalogo fotos={fotos} />
          ) : (
            <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px", textAlign: "center", color: "#666", fontSize: "14px" }}>
              Nenhuma foto cadastrada ainda. Volte em breve!
            </div>
          )}
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
