import "server-only";
import { prisma } from "@/lib/db";
import { criarLinkLeitor } from "@/lib/leitorLinks";
import { sendLeitorAcessoEmail } from "@/lib/email";

// Concessão e revogação do direito de ler um e-book. É isto que a venda (webhook do pagamento)
// e o admin chamam: cria o leitor se ele ainda não existe e liga o leitor ao livro.

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function liberarAcessoEbook(params: { email: string; nome?: string | null; bookId: string; orderId?: string | null }) {
  const email = normalizarEmail(params.email);

  let leitor = await prisma.leitor.findUnique({ where: { email } });
  if (!leitor) {
    leitor = await prisma.leitor.create({ data: { email, nome: params.nome?.trim() || null } });
  } else if (!leitor.nome && params.nome?.trim()) {
    leitor = await prisma.leitor.update({ where: { id: leitor.id }, data: { nome: params.nome.trim() } });
  }

  const acesso = await prisma.acessoEbook.upsert({
    where: { leitorId_bookId: { leitorId: leitor.id, bookId: params.bookId } },
    // Uma nova compra do mesmo livro reativa um acesso que tinha sido revogado.
    update: { revogadoEm: null, motivoRevogacao: null, ...(params.orderId ? { orderId: params.orderId } : {}) },
    create: { leitorId: leitor.id, bookId: params.bookId, orderId: params.orderId ?? null },
  });

  return { leitor, acesso, precisaCriarSenha: !leitor.senhaHash };
}

export async function revogarAcessoEbook(params: { leitorId: string; bookId: string; motivo: string }) {
  await prisma.acessoEbook.updateMany({
    where: { leitorId: params.leitorId, bookId: params.bookId, revogadoEm: null },
    data: { revogadoEm: new Date(), motivoRevogacao: params.motivo.slice(0, 300) },
  });
}

/**
 * Avisa o leitor por e-mail que o e-book foi liberado. Quem ainda não tem senha recebe um link para
 * criá-la; quem já tem recebe o endereço da estante.
 */
export async function enviarEmailAcessoLiberado(leitor: { id: string; email: string; nome: string | null; senhaHash: string | null }, livroTitulo: string) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const primeiroAcesso = !leitor.senhaHash;
  const url = primeiroAcesso ? await criarLinkLeitor(leitor.id, "primeiro_acesso") : `${siteUrl}/entrar`;
  await sendLeitorAcessoEmail(leitor.email, { nome: leitor.nome, livro: livroTitulo, url, primeiroAcesso });
}
