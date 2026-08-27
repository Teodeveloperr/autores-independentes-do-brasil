import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import AssinaturaPlanos from "@/components/AssinaturaPlanos";
import { getCurrentAuthor } from "@/lib/auth";
import { descontoFidelidade } from "@/lib/plans";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Planos e Assinaturas" };

export default async function AssinaturaPage() {
  const author = await getCurrentAuthor();
  const cta = author ? "/painel" : "/cadastro";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#002776" }}>
      <PublicHeader active="planos" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "60px 40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h1 style={{ fontSize: "42px", fontWeight: 700, marginBottom: "16px" }}>Planos e Assinaturas</h1>
          <p style={{ fontSize: "16px", lineHeight: 1.6, maxWidth: "600px", margin: "0 auto" }}>
            Escolha o plano ideal para levar suas histórias mais longe. Cancele quando quiser, sem multas.
          </p>
        </div>
        <AssinaturaPlanos
          isLoggedIn={!!author}
          planoAtual={author?.plano ?? "Iniciante"}
          descontoFidelidadePct={author && author.plano !== "Iniciante" ? descontoFidelidade(author.planoIniciadoEm) : 0}
          cta={cta}
        />
        <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.7)", marginTop: "32px" }}>
          Pagamento seguro via Mercado Pago • Cancele quando quiser • Sem taxa de adesão
        </p>
      </div>
      </section>
      <PublicFooter variant="minimal" />
    </div>
  );
}
