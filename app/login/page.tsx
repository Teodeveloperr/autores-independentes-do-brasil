import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = { title: "Login" };

export default function LoginPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#002776" }}>
      <PublicHeader showContato={false} cta={{ href: "/cadastro", label: "CRIAR CADASTRO" }} />
      <section style={{ background: "#002776", color: "white", padding: "60px 40px", flex: 1, display: "flex", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: "48px", fontWeight: 700, lineHeight: 1.2, marginBottom: "24px" }}>
            A literatura
            <br />
            <span style={{ color: "#009B3A" }}>conecta,</span>
            <br />
            <span style={{ color: "#FFDF00" }}>transforma</span>
            <br />e inspira.
          </h1>
          <p style={{ fontSize: "16px", lineHeight: 1.6, marginBottom: "32px" }}>
            Fará parte coletivo que valoriza autores independentes e leva suas histórias ainda mais longe.
          </p>
          <div style={{ background: "#F6F6F6", padding: "40px", borderRadius: "8px", maxWidth: "400px" }} />
        </div>
        <div style={{ flex: 1, background: "white", color: "#262626", padding: "48px", borderRadius: "8px", maxWidth: "500px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, marginBottom: "32px", textAlign: "center" }}>
            Bem-vindo de volta!
          </h2>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
