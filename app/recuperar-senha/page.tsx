import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import RecuperarSenhaForm from "@/components/RecuperarSenhaForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecuperarSenhaPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#002776" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 40px" }}>
        <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "48px", borderRadius: "8px", maxWidth: "460px", width: "100%" }}>
          <RecuperarSenhaForm />
        </div>
      </section>
    </div>
  );
}
