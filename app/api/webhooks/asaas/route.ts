import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verificarWebhookAsaas, buscarCobranca } from "@/lib/asaas";
import { sendOrderConfirmationEmail, sendNewSaleEmail, sendNovaCobrancaAssinaturaEmail, sendWelcomeEmail } from "@/lib/email";

const EVENTOS_PAGO = new Set(["PAYMENT_RECEIVED", "PAYMENT_CONFIRMED"]);
const EVENTOS_PIX_AUTO_ATIVADO = new Set(["PIX_AUTOMATIC_RECURRING_AUTHORIZATION_ACTIVATED"]);
const EVENTOS_PIX_AUTO_ENCERRADO: Record<string, string> = {
  PIX_AUTOMATIC_RECURRING_AUTHORIZATION_EXPIRED: "expired",
  PIX_AUTOMATIC_RECURRING_AUTHORIZATION_REFUSED: "refused",
  PIX_AUTOMATIC_RECURRING_AUTHORIZATION_CANCELLED: "cancelled",
};

// Não confirmei o formato exato do payload da Asaas pra esses eventos (não achei na
// documentação) — tenta os caminhos mais prováveis e loga o corpo cru se não achar.
function extrairIdAutorizacaoPix(body: Record<string, unknown>): string | null {
  const candidatos = [
    (body as { pixAutomaticAuthorization?: { id?: string } }).pixAutomaticAuthorization?.id,
    (body as { authorization?: { id?: string } }).authorization?.id,
    (body as { id?: string }).id,
  ];
  const encontrado = candidatos.find((c) => typeof c === "string" && c.length > 0);
  if (!encontrado) {
    console.error("[asaas] Não achei o id da autorização Pix Automático no payload do webhook:", JSON.stringify(body));
    return null;
  }
  return encontrado;
}

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

  if (EVENTOS_PIX_AUTO_ATIVADO.has(evento)) {
    const authorizationId = extrairIdAutorizacaoPix(body);
    if (authorizationId) {
      const author = await prisma.author.findUnique({ where: { asaasPixAutoAuthorizationId: authorizationId } });
      if (author && author.planoPendente) {
        await prisma.author.update({
          where: { id: author.id },
          data: { plano: author.planoPendente, asaasPixAutoStatus: "active", planoPendente: null },
        });
      } else if (!author) {
        // Cadastro novo: a conta só é criada agora, com o pagamento já confirmado.
        const pendente = await prisma.pendingSignup.findUnique({ where: { asaasPixAutoAuthorizationId: authorizationId } });
        if (pendente) {
          const emailEmUso = await prisma.author.findUnique({ where: { email: pendente.email } });
          if (emailEmUso) {
            console.error(`[asaas] PendingSignup ${pendente.id} não pôde virar conta: e-mail ${pendente.email} já está em uso.`);
          } else {
            const novoAuthor = await prisma.author.create({
              data: {
                nome: pendente.nome,
                email: pendente.email,
                senhaHash: pendente.senhaHash,
                generos: pendente.generos,
                cidade: pendente.cidade,
                bio: pendente.bio,
                anoEntrada: new Date().getFullYear(),
                plano: pendente.planoNome,
                planoCiclo: pendente.ciclo,
                planoValorCentavos: pendente.valorCentavos,
                planoIniciadoEm: new Date(),
                cpf: pendente.cpf,
                asaasPixCustomerId: pendente.asaasPixCustomerId,
                asaasPixAutoAuthorizationId: pendente.asaasPixAutoAuthorizationId,
                asaasPixAutoStatus: "active",
              },
            });
            await sendWelcomeEmail(novoAuthor.email, novoAuthor.nome).catch((err) =>
              console.error("[email] Falha ao enviar e-mail de boas-vindas:", err)
            );
            await prisma.pendingSignup.delete({ where: { id: pendente.id } });
          }
        }
      }
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (evento in EVENTOS_PIX_AUTO_ENCERRADO) {
    const authorizationId = extrairIdAutorizacaoPix(body);
    if (authorizationId) {
      const author = await prisma.author.findUnique({ where: { asaasPixAutoAuthorizationId: authorizationId } });
      if (author) {
        await prisma.author.update({
          where: { id: author.id },
          data: { plano: "Iniciante", asaasPixAutoStatus: EVENTOS_PIX_AUTO_ENCERRADO[evento], planoPendente: null },
        });
      } else {
        // Autorização de um cadastro que nunca chegou a virar conta — só limpa o pendente, se houver.
        await prisma.pendingSignup.deleteMany({ where: { asaasPixAutoAuthorizationId: authorizationId } });
      }
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const paymentId = body.payment?.id || "";

  if (evento === "PAYMENT_CREATED" && paymentId) {
    const cobranca = await buscarCobranca(paymentId);
    if (cobranca?.subscription) {
      const author = await prisma.author.findUnique({ where: { asaasSubscriptionId: cobranca.subscription } });
      if (author) {
        await sendNovaCobrancaAssinaturaEmail(author.email, {
          planoNome: author.planoPendente ?? author.plano,
          valorCentavos: cobranca.valueCentavos,
          invoiceUrl: cobranca.invoiceUrl,
          dueDate: new Date().toLocaleDateString("pt-BR"),
        }).catch((err) => console.error(`[asaas] Falha ao enviar e-mail de nova cobrança para ${author.email}:`, err));
      }
    }
    // Cobrança do Pix Automático (sem cobranca.subscription, identificada por customer) é debitada
    // sozinha — não faz sentido mandar e-mail pedindo pra pagar um link.
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (evento === "PAYMENT_OVERDUE" && paymentId) {
    const cobranca = await buscarCobranca(paymentId);
    const viaAssinaturaLink = Boolean(cobranca?.subscription);
    const author = viaAssinaturaLink
      ? await prisma.author.findUnique({ where: { asaasSubscriptionId: cobranca!.subscription! } })
      : cobranca?.customer
        ? await prisma.author.findFirst({ where: { asaasPixCustomerId: cobranca.customer, asaasPixAutoStatus: "active" } })
        : null;
    if (author && author.plano !== "Iniciante") {
      await prisma.author.update({
        where: { id: author.id },
        data: {
          planoPendente: author.planoPendente ?? author.plano,
          plano: "Iniciante",
          // A assinatura via link avulso passa a "overdue"; o Pix Automático mantém o status da
          // autorização como está — só essa cobrança do ciclo que falhou, a autorização continua ativa.
          asaasSubscriptionStatus: viaAssinaturaLink ? "overdue" : author.asaasSubscriptionStatus,
        },
      });
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (!EVENTOS_PAGO.has(evento) || !paymentId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const cobranca = await buscarCobranca(paymentId);
  if (!cobranca) {
    return NextResponse.json({ received: true }, { status: 200 });
  }
  const authorAssinatura = cobranca.subscription
    ? await prisma.author.findUnique({ where: { asaasSubscriptionId: cobranca.subscription } })
    : cobranca.customer
      ? await prisma.author.findFirst({ where: { asaasPixCustomerId: cobranca.customer, asaasPixAutoStatus: "active" } })
      : null;

  if (authorAssinatura) {
    const jaRegistrado = await prisma.subscriptionPayment.findUnique({ where: { asaasPaymentId: paymentId } });
    if (!jaRegistrado) {
      await prisma.subscriptionPayment.create({
        data: { authorId: authorAssinatura.id, plano: authorAssinatura.planoPendente ?? authorAssinatura.plano, valorCentavos: cobranca.valueCentavos, asaasPaymentId: paymentId },
      });
    }
    if (authorAssinatura.planoPendente) {
      await prisma.author.update({
        where: { id: authorAssinatura.id },
        data: {
          plano: authorAssinatura.planoPendente,
          planoPendente: null,
          asaasSubscriptionStatus: cobranca.subscription ? "active" : authorAssinatura.asaasSubscriptionStatus,
        },
      });
    } else if (cobranca.subscription && authorAssinatura.asaasSubscriptionStatus !== "active") {
      await prisma.author.update({ where: { id: authorAssinatura.id }, data: { asaasSubscriptionStatus: "active" } });
    }
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (cobranca.subscription) {
    // Cadastro novo pago via checkout hospedado da Asaas: a conta só é criada agora,
    // com o pagamento já confirmado.
    const pendente = await prisma.pendingSignup.findUnique({ where: { asaasSubscriptionId: cobranca.subscription } });
    if (pendente) {
      const emailEmUso = await prisma.author.findUnique({ where: { email: pendente.email } });
      if (emailEmUso) {
        console.error(`[asaas] PendingSignup ${pendente.id} não pôde virar conta: e-mail ${pendente.email} já está em uso.`);
      } else {
        const novoAuthor = await prisma.author.create({
          data: {
            nome: pendente.nome,
            email: pendente.email,
            senhaHash: pendente.senhaHash,
            generos: pendente.generos,
            cidade: pendente.cidade,
            bio: pendente.bio,
            anoEntrada: new Date().getFullYear(),
            plano: pendente.planoNome,
            planoCiclo: pendente.ciclo,
            planoValorCentavos: pendente.valorCentavos,
            planoIniciadoEm: new Date(),
            cpf: pendente.cpf,
            asaasSubscriptionId: pendente.asaasSubscriptionId,
            asaasSubscriptionStatus: "active",
          },
        });
        await prisma.subscriptionPayment.create({
          data: { authorId: novoAuthor.id, plano: novoAuthor.plano, valorCentavos: cobranca.valueCentavos, asaasPaymentId: paymentId },
        });
        await sendWelcomeEmail(novoAuthor.email, novoAuthor.nome).catch((err) =>
          console.error("[email] Falha ao enviar e-mail de boas-vindas:", err)
        );
        await prisma.pendingSignup.delete({ where: { id: pendente.id } });
      }
      return NextResponse.json({ received: true }, { status: 200 });
    }
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
