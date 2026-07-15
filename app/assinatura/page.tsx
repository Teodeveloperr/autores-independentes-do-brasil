import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { getCurrentAuthor } from "@/lib/auth";

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
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", maxWidth: "1100px", margin: "0 auto", alignItems: "start" }}>
          <div style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Gratuito</div>
              <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>
                R$ 0<span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>/mês</span>
              </div>
              <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>Para começar sua jornada no coletivo</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", flex: 1 }}>
              <div style={{ display: "flex", gap: "8px" }}>✅ Perfil de autor na plataforma</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Até 2 livros à venda</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Participação na comunidade</div>
            </div>
            <Link href={cta} style={{ display: "block", textAlign: "center", background: "white", border: "2px solid #002776", color: "#002776", padding: "12px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
              Começar grátis
            </Link>
          </div>
          <div style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px", border: "3px solid #FFDF00", position: "relative" }}>
            <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#FFDF00", color: "#002776", fontSize: "12px", fontWeight: 700, padding: "4px 16px", borderRadius: "12px", whiteSpace: "nowrap" }}>
              MAIS POPULAR
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Autor Essencial</div>
              <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>
                R$ 29,90<span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>/mês</span>
              </div>
              <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>Tudo que você precisa para vender e divulgar</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", flex: 1 }}>
              <div style={{ display: "flex", gap: "8px" }}>✅ Livros ilimitados à venda</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Agenda de eventos</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Galeria de fotos</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Dashboard de vendas e pedidos</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Mensagens com leitores</div>
            </div>
            <Link href={cta} style={{ display: "block", textAlign: "center", background: "#009B3A", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
              Assinar Essencial
            </Link>
          </div>
          <div style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Autor Premium</div>
              <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>
                R$ 49,90<span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>/mês</span>
              </div>
              <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>Máxima visibilidade para suas obras</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", flex: 1 }}>
              <div style={{ display: "flex", gap: "8px" }}>✅ Tudo do Autor Essencial</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Destaque na página inicial</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Relatórios avançados de vendas</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Prioridade em bienais e feiras</div>
              <div style={{ display: "flex", gap: "8px" }}>✅ Suporte dedicado</div>
            </div>
            <Link href={cta} style={{ display: "block", textAlign: "center", background: "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
              Assinar Premium
            </Link>
          </div>
        </div>
        <p style={{ textAlign: "center", fontSize: "13px", color: "rgba(255,255,255,0.7)", marginTop: "32px" }}>
          Pagamento seguro • Cancele quando quiser • Sem taxa de adesão
        </p>
      </div>
      </section>
      <PublicFooter variant="minimal" />
    </div>
  );
}
