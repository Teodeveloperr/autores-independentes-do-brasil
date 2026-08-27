import type { Metadata } from "next";
import crypto from "node:crypto";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { prisma } from "@/lib/db";
import { confirmarRecebimento } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Confirmar recebimento" };

export default async function ConfirmarPedidoPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  const order = token
    ? await prisma.order.findUnique({
        where: { confirmacaoTokenHash: crypto.createHash("sha256").update(token).digest("hex") },
        include: { author: true },
      })
    : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 40px" }}>
        <div
          className="section-pad-md"
          style={{ background: "white", padding: "48px", borderRadius: "8px", maxWidth: "460px", width: "100%", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}
        >
          {!order ? (
            <>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Link inválido</h1>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>Este link de confirmação não é válido.</p>
            </>
          ) : order.repasseStatus === "transferido" ? (
            <>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>✅</div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Recebimento já confirmado</h1>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
                Obrigado! Já processamos a confirmação do seu pedido de <b>{order.livro}</b>.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>📦</div>
              <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Confirmar recebimento</h1>
              <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>
                Confirme que você recebeu <b>{order.livro}</b>, de {order.author.nome}. Isso libera o repasse do valor para o autor.
              </p>
              <form action={confirmarRecebimento}>
                <input type="hidden" name="token" value={token} />
                <button
                  type="submit"
                  style={{ background: "#009B3A", color: "white", padding: "12px 28px", fontWeight: 700, borderRadius: "6px", border: "none", fontSize: "14px" }}
                >
                  Recebi meu pedido
                </button>
              </form>
            </>
          )}
        </div>
      </section>
      <PublicFooter variant="minimal" />
    </div>
  );
}
