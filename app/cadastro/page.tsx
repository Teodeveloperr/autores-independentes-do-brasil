import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import CadastroWizard from "@/components/CadastroWizard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Criar cadastro" };

export default function CadastroPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#002776" }}>
      <PublicHeader showContato={false} />
      <section style={{ background: "#002776", color: "white", padding: "48px 40px", flex: 1, display: "flex", alignItems: "flex-start", gap: "48px" }}>
        <div style={{ flex: "0 0 380px", position: "sticky", top: "48px" }}>
          <h1 style={{ fontSize: "40px", fontWeight: 700, lineHeight: 1.2, marginBottom: "24px" }}>
            Junte-se ao
            <br />
            <span style={{ color: "#009B3A" }}>coletivo</span> e leve
            <br />
            suas histórias
            <br />
            <span style={{ color: "#FFDF00" }}>mais longe.</span>
          </h1>
          <p style={{ fontSize: "15px", lineHeight: 1.6, marginBottom: "28px" }}>
            Crie sua conta e faça parte de uma comunidade que valoriza autores independentes de todo o Brasil.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>✅ Divulgue seus livros para novos leitores</div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>✅ Participe de eventos e bienais com o coletivo</div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>✅ Acompanhe vendas e pedidos no seu painel</div>
          </div>
        </div>
        <CadastroWizard />
      </section>
    </div>
  );
}
