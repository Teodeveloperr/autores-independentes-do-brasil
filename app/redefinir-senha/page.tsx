import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import RedefinirSenhaForm from "@/components/RedefinirSenhaForm";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#002776" }}>
      <PublicHeader />
      <section style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 40px" }}>
        <div style={{ background: "white", color: "#262626", padding: "48px", borderRadius: "8px", maxWidth: "460px", width: "100%" }}>
          {token ? (
            <RedefinirSenhaForm token={token} />
          ) : (
            <div style={{ textAlign: "center" }}>
              <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px", color: "#002776" }}>
                Link inválido
              </h2>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>
                Este link de redefinição de senha está incompleto. Solicite um novo.
              </p>
              <a
                href="/recuperar-senha"
                style={{ display: "inline-block", background: "#002776", color: "white", padding: "12px 28px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}
              >
                Solicitar novo link
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
