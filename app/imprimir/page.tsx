import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ImprimirView from "@/components/painel/ImprimirView";
import ComprouKitReenvio from "@/components/ComprouKitReenvio";
import { getCurrentAuthor } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imprimir meu livro",
  description: "Configure o seu livro, envie a capa e o miolo em PDF e receba o orçamento de impressão por e-mail.",
};

// Página pública do "Imprimir meu livro", para quem não tem conta na plataforma. Autores cadastrados
// usam a aba do painel (mesmo fluxo, com os pedidos listados lá).
export default async function ImprimirPage() {
  const author = await getCurrentAuthor();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="imprimir" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 700, marginBottom: "12px" }}>Imprimir meu livro</h1>
          <p style={{ fontSize: "16px", lineHeight: 1.6 }}>
            Não precisa ter cadastro nem assinatura. Configure o seu livro, envie a capa e o miolo em PDF e receba o orçamento de impressão por e-mail.
          </p>
        </div>
      </section>
      <section className="section-pad-lg" style={{ background: "#F6F6F6", padding: "32px 40px 56px", flex: 1 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
          {author && (
            <div style={{ background: "#FFF6CC", color: "#5c4800", padding: "14px 18px", borderRadius: "8px", fontSize: "14px", lineHeight: 1.6 }}>
              Você tem conta na plataforma: no painel você acompanha seus pedidos de impressão.{" "}
              <Link href="/painel?aba=imprimir" style={{ color: "#002776", fontWeight: 700, textDecoration: "underline" }}>
                Ir para o meu painel
              </Link>
            </div>
          )}
          <ComprouKitReenvio />
          <ImprimirView publico nomeInicial={author?.nome ?? ""} emailInicial={author?.email ?? ""} />
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
