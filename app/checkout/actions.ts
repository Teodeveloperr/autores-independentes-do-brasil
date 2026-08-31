"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { criarOuBuscarCliente, criarCobranca } from "@/lib/asaas";
import { validarCpf } from "@/lib/cpf";
import { podeVenderLivros } from "@/lib/plans";
import { precoComDescontoCentavos } from "@/lib/desconto";

// Valor fixo provisório por autor (frete via Correios, Registro Módico) — ainda a definir o valor final.
const FRETE_FIXO_CENTAVOS = 1500;

export type CheckoutItem = {
  bookId: string;
  authorId: string;
  titulo: string;
  precoCentavos: number;
  quantidade: number;
};

export type CheckoutComprador = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
};

export type CheckoutEndereco = {
  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type FreteAutor = {
  authorId: string;
  autorNome: string;
  disponivel: boolean;
  precoCentavos: number;
  servico: string | null;
  prazoDias: number | null;
};

export async function calcularFreteCarrinho(items: CheckoutItem[], cepDestino: string): Promise<FreteAutor[]> {
  const cepLimpo = cepDestino.replace(/\D/g, "");
  if (cepLimpo.length !== 8 || items.length === 0) return [];

  const authorIds = [...new Set(items.map((i) => i.authorId))];
  const authors = await prisma.author.findMany({ where: { id: { in: authorIds } } });

  return authorIds.map((authorId) => {
    const author = authors.find((a) => a.id === authorId);
    return {
      authorId,
      autorNome: author?.nome ?? "",
      disponivel: true,
      precoCentavos: FRETE_FIXO_CENTAVOS,
      servico: "Correios — Registro Módico",
      prazoDias: null,
    };
  });
}

export async function criarPedido(
  items: CheckoutItem[],
  comprador: CheckoutComprador,
  endereco: CheckoutEndereco
): Promise<{ invoiceUrl: string }> {
  if (items.length === 0) {
    throw new Error("Carrinho vazio.");
  }
  if (!comprador.nome.trim() || !comprador.email.trim()) {
    throw new Error("Nome e e-mail são obrigatórios.");
  }
  if (!validarCpf(comprador.cpf)) {
    throw new Error("CPF inválido.");
  }
  if (
    !endereco.cep.trim() ||
    !endereco.rua.trim() ||
    !endereco.numero.trim() ||
    !endereco.bairro.trim() ||
    !endereco.cidade.trim() ||
    !endereco.uf.trim()
  ) {
    throw new Error("Endereço de entrega incompleto.");
  }

  // Nunca confiar em preço/vendedor/título vindos do cliente (o carrinho vive no
  // localStorage e pode ser adulterado) — busca cada livro de verdade no banco e usa só
  // esses dados pra montar o pedido e a cobrança. Do cliente, só aceitamos bookId e quantidade.
  const bookIds = [...new Set(items.map((i) => i.bookId))];
  const books = await prisma.book.findMany({
    where: { id: { in: bookIds } },
    include: { author: true },
  });

  const grupoPedidoId = crypto.randomUUID();
  const freteJaAplicado = new Set<string>();

  const rows = items.map((item) => {
    const book = books.find((b) => b.id === item.bookId);
    if (!book) {
      throw new Error("Um dos livros do carrinho não foi encontrado.");
    }
    if (book.author.status !== "ativo" || !podeVenderLivros(book.author.plano)) {
      throw new Error(`"${book.titulo}" não está disponível para venda no momento.`);
    }

    const quantidade = Math.max(1, Math.floor(item.quantidade) || 1);
    const precoUnitarioCentavos = precoComDescontoCentavos(book.precoCentavos, book.descontoPercentual);

    const aplicarFrete = !freteJaAplicado.has(book.authorId);
    if (aplicarFrete) freteJaAplicado.add(book.authorId);

    return {
      authorId: book.authorId,
      bookId: book.id,
      livro: book.titulo,
      comprador: comprador.nome.trim(),
      compradorEmail: comprador.email.trim(),
      compradorTelefone: comprador.telefone.trim() || null,
      compradorCpf: comprador.cpf.replace(/\D/g, ""),
      compradorCep: endereco.cep.trim(),
      compradorRua: endereco.rua.trim(),
      compradorNumero: endereco.numero.trim(),
      compradorComplemento: endereco.complemento.trim() || null,
      compradorBairro: endereco.bairro.trim(),
      compradorCidade: endereco.cidade.trim(),
      compradorUf: endereco.uf.trim().toUpperCase(),
      quantidade,
      valorCentavos: precoUnitarioCentavos * quantidade,
      freteCentavos: aplicarFrete ? FRETE_FIXO_CENTAVOS : null,
      freteServico: aplicarFrete ? "Correios — Registro Módico" : null,
      status: "Aguardando pagamento",
      grupoPedidoId,
    };
  });

  const freteTotalCentavos = rows.reduce((sum, r) => sum + (r.freteCentavos ?? 0), 0);
  const totalCentavos = rows.reduce((sum, r) => sum + r.valorCentavos, 0) + freteTotalCentavos;

  await prisma.order.createMany({ data: rows });

  const customerId = await criarOuBuscarCliente({
    nome: comprador.nome.trim(),
    cpf: comprador.cpf,
    email: comprador.email.trim(),
  });

  const cobranca = customerId
    ? await criarCobranca({
        customerId,
        valueCentavos: totalCentavos,
        description: `Compra de livro(s) — Autores Independentes do Brasil (${rows.map((r) => r.livro).join(", ")})`.slice(0, 500),
        externalReference: grupoPedidoId,
      })
    : null;

  if (!cobranca) {
    // Rollback: sem cobrança real, não faz sentido manter o pedido registrado.
    await prisma.order.deleteMany({ where: { grupoPedidoId } });
    throw new Error("Não foi possível iniciar o pagamento. Tente novamente em instantes.");
  }

  await prisma.order.updateMany({
    where: { grupoPedidoId },
    data: { asaasCustomerId: customerId, asaasPaymentId: cobranca.id },
  });

  revalidatePath("/painel");

  return { invoiceUrl: cobranca.invoiceUrl };
}
