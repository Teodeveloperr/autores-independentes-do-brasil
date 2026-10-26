import "server-only";
import type { Order } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { ehEbook } from "@/lib/ebook";
import { liberarAcessoEbook, revogarAcessoEbook, enviarEmailAcessoLiberado } from "@/lib/leitorAcesso";
import { processarRepasse } from "@/lib/repasse";

// O que muda no pedido quando ele tem e-book: o acesso é liberado assim que o pagamento confirma
// e o repasse ao autor sai assim que a Asaas mostra o saldo disponível (sem esperar entrega física).

/** Libera o acesso a cada e-book do pedido e manda UM e-mail com todos os títulos. */
export async function entregarEbooksDoPedido(rows: Order[]): Promise<void> {
  const ebooks = rows.filter((r) => ehEbook(r.formato) && r.bookId && r.compradorEmail);
  if (ebooks.length === 0) return;

  let leitor: Awaited<ReturnType<typeof liberarAcessoEbook>>["leitor"] | null = null;
  for (const r of ebooks) {
    const resultado = await liberarAcessoEbook({ email: r.compradorEmail!, nome: r.comprador, bookId: r.bookId!, orderId: r.id });
    leitor = resultado.leitor;
  }
  if (!leitor) return;

  // Um único e-mail por compra: cada link de acesso novo invalida o anterior ainda não usado.
  await enviarEmailAcessoLiberado(leitor, ebooks.map((r) => r.livro)).catch((err) =>
    console.error("[ebook] Falha ao enviar o e-mail de acesso ao leitor:", err)
  );
}

/**
 * Repassa ao autor as vendas de e-book cujo valor já está disponível. Quando a Asaas ainda não liberou
 * o saldo (cartão: D+32), nada acontece e o cron tenta de novo depois.
 */
export async function repassarEbooksDisponiveis(where: { asaasPaymentId?: string } = {}): Promise<{ tentados: number; repassados: number }> {
  const pendentes = await prisma.order.findMany({
    where: { ...where, formato: "ebook", status: "Entregue", disponivelEm: { not: null }, repasseStatus: { not: "transferido" } },
    include: { author: true },
  });
  let repassados = 0;
  for (const order of pendentes) {
    try {
      const resultado = await processarRepasse(order, order.author);
      if (resultado.ok) repassados++;
    } catch (err) {
      console.error(`[ebook] Falha ao repassar o pedido ${order.id}:`, err);
    }
  }
  return { tentados: pendentes.length, repassados };
}

/** Pagamento estornado ou contestado: tira o acesso ao e-book. */
export async function revogarEbooksDoPedido(rows: Order[], motivo: string): Promise<void> {
  const acessos = await prisma.acessoEbook.findMany({ where: { orderId: { in: rows.filter((r) => ehEbook(r.formato)).map((r) => r.id) } } });
  for (const a of acessos) {
    await revogarAcessoEbook({ leitorId: a.leitorId, bookId: a.bookId, motivo });
  }
}
