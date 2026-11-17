import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ImprimirView from "@/components/painel/ImprimirView";
import { prisma } from "@/lib/db";
import { numeroDoPedidoImpressao, STATUS_IMPRESSAO } from "@/lib/impressao";
import { kitPorId } from "@/lib/kits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Enviar meu livro para impressão", robots: { index: false } };

const botao: React.CSSProperties = { display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px", fontSize: "14px" };

function Aviso({ titulo, texto, mostrarReenvio }: { titulo: string; texto: string; mostrarReenvio?: boolean }) {
  return (
    <div style={{ background: "white", padding: "48px", borderRadius: "8px", maxWidth: "560px", width: "100%", textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", margin: "0 auto" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>{titulo}</h1>
      <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>{texto}</p>
      <Link href={mostrarReenvio ? "/imprimir#comprei-um-kit" : "/"} style={botao}>
        {mostrarReenvio ? "Pedir o link de novo" : "Voltar para o início"}
      </Link>
    </div>
  );
}

// Página do link enviado a quem comprou um kit da Bienal (Prata/Ouro): a impressão já vem definida pelo
// kit, e o cliente só informa título e ISBN, envia a capa e o miolo e confirma. O código do kit (token)
// é aleatório e secreto, e vale para um único pedido de impressão.
export default async function KitImprimirPage({ searchParams }: { searchParams: Promise<{ pedido?: string }> }) {
  const { pedido: token } = await searchParams;
  const pedido =
    token && /^[A-Za-z0-9_-]{20,40}$/.test(token) ? await prisma.pedidoKit.findUnique({ where: { token }, include: { impressao: { select: { numero: true, status: true } } } }) : null;
  const kit = pedido ? kitPorId(pedido.kit) : null;

  let conteudo: React.ReactNode;
  if (!pedido || !kit) {
    conteudo = <Aviso titulo="Link inválido" texto="Não encontramos este kit. Se você comprou, use o link do e-mail de confirmação ou peça o link de novo." mostrarReenvio />;
  } else if (pedido.status !== "pago") {
    conteudo = <Aviso titulo="Pagamento não confirmado" texto="Assim que o pagamento do seu kit for confirmado, este link libera o envio do livro. Isso costuma levar alguns segundos; recarregue a página em instantes." />;
  } else if (pedido.impressao) {
    conteudo = (
      <Aviso
        titulo={`Pedido ${numeroDoPedidoImpressao(pedido.impressao.numero)} enviado`}
        texto={`Já recebemos o livro do seu ${kit.nome}. Situação: ${STATUS_IMPRESSAO[pedido.impressao.status] ?? pedido.impressao.status}. Nossa equipe entra em contato por e-mail e telefone para os próximos passos e para combinar o seu lançamento.`}
      />
    );
  } else {
    conteudo = (
      <ImprimirView
        kit={{ token: pedido.token, id: kit.id, nome: kit.nome, copias: kit.copias, paginasMax: kit.paginasMax }}
      />
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px" }}>
        <div style={{ maxWidth: "820px", margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: "34px", fontWeight: 700, marginBottom: "12px" }}>Enviar meu livro para impressão</h1>
          <p style={{ fontSize: "16px", lineHeight: 1.6 }}>
            {kit ? `A impressão do seu ${kit.nome} já está definida. Informe o título e o ISBN, envie a capa e o miolo em PDF e confirme.` : "Use o link que enviamos por e-mail depois da compra do seu kit."}
          </p>
        </div>
      </section>
      <section className="section-pad-lg" style={{ background: "#F6F6F6", padding: "32px 40px 56px", flex: 1 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>{conteudo}</div>
      </section>
      <PublicFooter />
    </div>
  );
}
