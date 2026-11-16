import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import AtualizarAteConfirmar from "@/components/AtualizarAteConfirmar";
import { ConversaoCompra } from "@/components/GoogleAdsTag";
import { prisma } from "@/lib/db";
import { kitPorId } from "@/lib/kits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Obrigado pela contratação", robots: { index: false } };

const botao: React.CSSProperties = { display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px", fontSize: "14px" };

// Página para onde a Asaas devolve quem pagou um kit da Bienal. O código do pedido (token) é aleatório,
// conhecido só por quem fez a compra.
export default async function KitObrigadoPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const { pedido: token } = await searchParams;
  const pedido = token && /^[A-Za-z0-9_-]{20,40}$/.test(token) ? await prisma.pedidoKit.findUnique({ where: { token } }) : null;
  const kit = pedido ? kitPorId(pedido.kit) : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 40px" }}>
        <div
          className="section-pad-md"
          style={{ background: "white", padding: "48px", borderRadius: "8px", maxWidth: "560px", width: "100%", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
        >
          {!pedido || !kit ? (
            <>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Pedido não encontrado</h1>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>Não localizamos este pedido. Se você acabou de pagar, confira o e-mail de confirmação.</p>
              <Link href="/" style={botao}>Voltar para o início</Link>
            </>
          ) : pedido.status === "cancelado" ? (
            <>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Pedido cancelado</h1>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>Este pedido foi cancelado. Em caso de dúvida, fale com a gente.</p>
              <Link href="/" style={botao}>Voltar para o início</Link>
            </>
          ) : pedido.status === "pago" ? (
            <>
              <ConversaoCompra pedidoId={`kit-${pedido.id}`} valor={pedido.valorCentavos / 100} />
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Obrigado pela contratação!</h1>
              <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, marginBottom: "16px" }}>
                Seu pagamento do <b>{kit.nome}</b> foi confirmado. Seu livro vai para a Bienal do Livro Rio 2027!
              </p>
              <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>
                Enviamos os detalhes para o seu e-mail. Nossa equipe vai entrar em contato para combinar o envio dos arquivos do seu livro e o seu lançamento.
              </p>
              <Link href="/" style={botao}>Voltar para o início</Link>
            </>
          ) : (
            <>
              <AtualizarAteConfirmar />
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Aguardando a confirmação do pagamento</h1>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
                Assim que o pagamento for confirmado, esta página se atualiza sozinha. Isso costuma levar alguns segundos. Você também recebe a confirmação por e-mail.
              </p>
            </>
          )}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
