import type { Metadata } from "next";
import CartaoLeitor from "@/components/leitor/CartaoLeitor";
import { LeitorSenhaForm } from "@/components/leitor/LeitorForms";
import { buscarLinkLeitorValido } from "@/lib/leitorLinks";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Escolher a senha", robots: { index: false, follow: false } };

export default async function SenhaLeitorPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const link = token ? await buscarLinkLeitorValido(token) : null;

  if (!token || !link) {
    return (
      <CartaoLeitor titulo="Link inválido ou expirado" subtitulo="Este link não pode mais ser usado. Peça um novo; é rápido.">
        <div style={{ textAlign: "center" }}>
          <a
            href="/entrar/esqueci"
            style={{ display: "inline-block", background: "#002776", color: "white", padding: "12px 28px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}
          >
            Pedir um novo link
          </a>
        </div>
      </CartaoLeitor>
    );
  }

  return (
    <CartaoLeitor
      titulo={link.finalidade === "primeiro_acesso" ? "Crie a sua senha" : "Escolha uma nova senha"}
      subtitulo="Com ela você entra na sua estante de e-books."
    >
      <LeitorSenhaForm token={token} />
    </CartaoLeitor>
  );
}
