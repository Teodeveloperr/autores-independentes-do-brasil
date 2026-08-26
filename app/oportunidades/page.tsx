import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const metadata: Metadata = { title: "Oportunidades" };

export default function OportunidadesPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="oportunidades" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1, display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: "640px", width: "100%", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🚧</div>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Oportunidades</h1>
          <p style={{ fontSize: "16px", marginBottom: "32px" }}>
            Em breve, editais, parcerias e outras oportunidades pra autores do coletivo vão aparecer por aqui.
          </p>
          <Link
            href="/"
            style={{ display: "inline-block", background: "#FFDF00", color: "#002776", padding: "12px 32px", fontWeight: 700, borderRadius: "4px", textDecoration: "none" }}
          >
            Voltar para a home
          </Link>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
