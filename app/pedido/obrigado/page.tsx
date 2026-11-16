import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import AtualizarAteConfirmar from "@/components/AtualizarAteConfirmar";
import { ConversaoCompra } from "@/components/GoogleAdsTag";
import { prisma } from "@/lib/db";
import { ehEbook } from "@/lib/ebook";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Obrigado pela compra", robots: { index: false } };

const botao: React.CSSProperties = { display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px", fontSize: "14px" };

// Página para onde a Asaas devolve o comprador depois de pagar um pedido de livros. O código do
// pedido (grupoPedidoId) é um UUID aleatório, conhecido só por quem fez a compra.
export default async function PedidoObrigadoPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const { pedido } = await searchParams;

  const linhas =
    pedido && /^[0-9a-f-]{36}$/i.test(pedido)
      ? await prisma.order.findMany({
          where: { grupoPedidoId: pedido },
          select: { livro: true, formato: true, status: true, valorCentavos: true, freteCentavos: true },
        })
      : [];

  const canceladas = linhas.filter((l) => l.status === "Cancelado");
  const pagas = linhas.filter((l) => l.status !== "Aguardando pagamento" && l.status !== "Cancelado");
  const pago = linhas.length > 0 && pagas.length === linhas.length;
  const cancelado = linhas.length > 0 && canceladas.length === linhas.length;
  const totalCentavos = linhas.reduce((soma, l) => soma + l.valorCentavos + (l.freteCentavos ?? 0), 0);
  const temEbook = linhas.some((l) => ehEbook(l.formato));

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 40px" }}>
        <div
          className="section-pad-md"
          style={{ background: "white", padding: "48px", borderRadius: "8px", maxWidth: "520px", width: "100%", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
        >
          {linhas.length === 0 ? (
            <>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Pedido não encontrado</h1>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>Não localizamos este pedido. Se você acabou de pagar, confira o e-mail de confirmação.</p>
              <Link href="/livros" style={botao}>Ver livros</Link>
            </>
          ) : cancelado ? (
            <>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Pedido cancelado</h1>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>Este pedido foi cancelado. Em caso de dúvida, fale com a gente.</p>
              <Link href="/livros" style={botao}>Ver livros</Link>
            </>
          ) : pago ? (
            <>
              <ConversaoCompra pedidoId={pedido!} valor={totalCentavos / 100} />
              <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Obrigado pela compra!</h1>
              <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, marginBottom: "16px" }}>
                Seu pagamento foi confirmado. Você apoiou diretamente a literatura independente.
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 20px", fontSize: "14px", color: "#262626", lineHeight: 1.8 }}>
                {linhas.map((l, i) => (
                  <li key={i}><b>{l.livro}</b></li>
                ))}
              </ul>
              <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>
                Enviamos os detalhes para o seu e-mail.
                {temEbook && " O e-book já está liberado em Minha estante."}
              </p>
              <Link href="/livros" style={botao}>Continuar comprando</Link>
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
