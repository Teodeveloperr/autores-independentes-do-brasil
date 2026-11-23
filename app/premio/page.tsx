import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import Regulamento from "@/components/premio/Regulamento";
import InscricaoPremioForm from "@/components/premio/InscricaoPremioForm";

export const metadata: Metadata = {
  title: "1º Prêmio Autores do Brasil de Literatura 2027",
  description: "Regulamento e ficha de inscrição do 1º Prêmio Literário Autores do Brasil – 2027. Inscrições até 24 de janeiro de 2027.",
  openGraph: { images: [{ url: "/premio-banner.jpg", width: 1600, height: 400 }] },
};

export default function PremioPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section style={{ background: "#1E3A8A" }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- banner oficial do formulário, exibido inteiro, sem corte */}
        <img src="/premio-banner.jpg" alt="1º Prêmio Autores do Brasil de Literatura 2027" width={1600} height={400} style={{ display: "block", width: "100%", maxWidth: "1600px", height: "auto", margin: "0 auto" }} />
      </section>
      <section className="section-pad-lg" style={{ background: "#F6F6F6", padding: "32px 40px 56px", flex: 1 }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="section-pad-md" style={{ background: "white", padding: "32px", borderRadius: "8px", maxHeight: "560px", overflowY: "auto" }}>
            <Regulamento />
          </div>
          <div className="section-pad-md" style={{ background: "white", padding: "32px", borderRadius: "8px" }}>
            <InscricaoPremioForm />
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
