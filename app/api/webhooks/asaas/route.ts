import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verificarWebhookAsaas } from "@/lib/asaas";
import { sendOrderConfirmationEmail, sendNewSaleEmail } from "@/lib/email";

const EVENTOS_PAGO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);

export async function POST(request: NextRequest) {
  const token = request.headers.get("asaas-access-token");
  if (!verificarWebhookAsaas(token)) {
    console.error("[asaas] Webhook rejeitado: token inválido ou não configurado.");
    return NextResponse.json({ status: "invalid token" }, { status: 401 });
  }

  let body: { event?: string; payment?: { id?: string } } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const evento = body.event || "";
  const paymentId = body.payment?.id || "";

  if (!EVENTOS_PAGO.has(evento) || !paymentId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const rows = await prisma.order.findMany({ where: { asaasPaymentId: paymentId } });
  if (rows.length === 0) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const jaProcessado = rows.every((r) => r.status !== "Aguardando pagamento");
  if (jaProcessado) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  await prisma.order.updateMany({ where: { asaasPaymentId: paymentId }, data: { status: "Pago" } });

  const authorIds = [...new Set(rows.map((r) => r.authorId))];
  const authors = await prisma.author.findMany({ where: { id: { in: authorIds } } });
  const primeira = rows[0];
  const enderecoTexto = `${primeira.compradorRua}, ${primeira.compradorNumero}${
    primeira.compradorComplemento ? ` - ${primeira.compradorComplemento}` : ""
  } - ${primeira.compradorBairro}, ${primeira.compradorCidade}/${primeira.compradorUf} - CEP ${primeira.compradorCep}`;

  const freteTotalCentavos = rows.reduce((sum, r) => sum + (r.freteCentavos ?? 0), 0);
  const totalCentavos = rows.reduce((sum, r) => sum + r.valorCentavos, 0) + freteTotalCentavos;

  await Promise.all([
    sendOrderConfirmationEmail(primeira.compradorEmail ?? "", {
      itens: rows.map((r) => ({
        titulo: r.livro,
        autorNome: authors.find((a) => a.id === r.authorId)?.nome ?? "",
        quantidade: r.quantidade,
        precoCentavos: r.valorCentavos / r.quantidade,
      })),
      freteCentavos: freteTotalCentavos,
      totalCentavos,
    }).catch((err) => console.error("[asaas] Falha ao enviar e-mail de confirmação ao comprador:", err)),
    ...authorIds.map((authorId) => {
      const author = authors.find((a) => a.id === authorId);
      if (!author) return Promise.resolve();
      const rowsAutor = rows.filter((r) => r.authorId === authorId);
      const rowFrete = rowsAutor.find((r) => r.freteCentavos != null);
      return sendNewSaleEmail(author.email, {
        comprador: primeira.comprador,
        compradorEmail: primeira.compradorEmail ?? "",
        compradorTelefone: primeira.compradorTelefone,
        endereco: enderecoTexto,
        itens: rowsAutor.map((r) => ({ titulo: r.livro, quantidade: r.quantidade, precoCentavos: r.valorCentavos / r.quantidade })),
        freteCentavos: rowFrete?.freteCentavos ?? null,
        freteServico: rowFrete?.freteServico ?? null,
      }).catch((err) => console.error(`[asaas] Falha ao enviar e-mail de nova venda para ${author.email}:`, err));
    }),
  ]);

  return NextResponse.json({ received: true }, { status: 200 });
}
