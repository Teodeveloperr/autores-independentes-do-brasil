import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import AtualizarAteConfirmar from "@/components/AtualizarAteConfirmar";
import { prisma } from "@/lib/db";
import { PREMIO_WHATSAPP_ESTORNO, PREMIO_WHATSAPP_ESTORNO_LINK } from "@/lib/premio";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Inscrição no Prêmio Literário", robots: { index: false } };

const botao: React.CSSProperties = { display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px", fontSize: "14px" };
const titulo: React.CSSProperties = { fontSize: "24px", fontWeight: 700, color: "#002776", marginBottom: "12px" };
const texto: React.CSSProperties = { fontSize: "14px", color: "#444", lineHeight: 1.7, marginBottom: "16px" };

// Página para onde a Asaas devolve quem pagou a taxa de inscrição do prêmio no cartão. O código (token) é
// aleatório, conhecido só por quem fez a inscrição; a página não mostra dados pessoais, só o estado do pagamento.
export default async function PremioObrigadoPage({ searchParams }: { searchParams: Promise<{ i?: string }> }) {
  const { i: token } = await searchParams;
  const inscricao =
    token && /^[A-Za-z0-9_-]{20,40}$/.test(token)
      ? await prisma.inscricaoPremio.findUnique({ where: { token }, select: { pagamentoStatus: true, titulo: true, categoria: true } })
      : null;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="premio" />
      <section className="section-pad-lg" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 40px", background: "#F6F6F6" }}>
        <div className="section-pad-md" style={{ background: "white", padding: "48px", borderRadius: "8px", maxWidth: "560px", width: "100%", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)" }}>
          {!inscricao ? (
            <>
              <h1 style={{ ...titulo, fontSize: "22px" }}>Inscrição não encontrada</h1>
              <p style={{ ...texto, color: "#666" }}>Não localizamos esta inscrição. Se você acabou de pagar, confira o e-mail de confirmação.</p>
              <Link href="/premio" style={botao}>Voltar ao prêmio</Link>
            </>
          ) : inscricao.pagamentoStatus === "pago" ? (
            <>
              <h1 style={titulo}>Pagamento confirmado!</h1>
              <p style={texto}>
                Recebemos a sua inscrição de <b>{inscricao.titulo}</b> na categoria <b>{inscricao.categoria}</b>. Como o pagamento foi feito pela plataforma, você <b>não precisa enviar comprovante</b>.
              </p>
              <p style={{ ...texto, fontSize: "13px", color: "#666" }}>
                Enviamos a confirmação para o seu e-mail. A organização confere os arquivos e entra em contato se precisar de algum documento complementar.
              </p>
              <p style={{ ...texto, fontSize: "12px", color: "#888" }}>
                Precisa pedir estorno? Fale com a organização pelo WhatsApp{" "}
                <a href={PREMIO_WHATSAPP_ESTORNO_LINK} target="_blank" rel="noopener noreferrer" style={{ color: "#002776", textDecoration: "underline" }}>{PREMIO_WHATSAPP_ESTORNO}</a>, para analisarmos e providenciarmos.
              </p>
              <Link href="/" style={botao}>Voltar para o início</Link>
            </>
          ) : inscricao.pagamentoStatus === "cancelado" || inscricao.pagamentoStatus === "estornado" ? (
            <>
              <h1 style={titulo}>{inscricao.pagamentoStatus === "estornado" ? "Pagamento estornado" : "Inscrição cancelada"}</h1>
              <p style={texto}>
                {inscricao.pagamentoStatus === "estornado"
                  ? "O pagamento desta inscrição foi estornado, então ela não está efetivada."
                  : "O pagamento desta inscrição não foi concluído, então ela não está efetivada."}{" "}
                Em caso de dúvida, fale com a organização pelo WhatsApp{" "}
                <a href={PREMIO_WHATSAPP_ESTORNO_LINK} target="_blank" rel="noopener noreferrer" style={{ color: "#002776", textDecoration: "underline" }}>{PREMIO_WHATSAPP_ESTORNO}</a>.
              </p>
              <Link href="/premio" style={botao}>Voltar ao prêmio</Link>
            </>
          ) : (
            <>
              <AtualizarAteConfirmar />
              <h1 style={titulo}>Estamos confirmando o seu pagamento</h1>
              <p style={texto}>Isso costuma levar poucos segundos. Esta página se atualiza sozinha quando o pagamento for confirmado.</p>
              <p style={{ ...texto, fontSize: "13px", color: "#666" }}>
                Se você já pagou e esta mensagem continuar por alguns minutos, não se preocupe: assim que a confirmação chegar, enviaremos um e-mail. Se o pagamento foi recusado, volte ao formulário e tente de novo.
              </p>
              <Link href="/premio" style={botao}>Voltar ao prêmio</Link>
            </>
          )}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
