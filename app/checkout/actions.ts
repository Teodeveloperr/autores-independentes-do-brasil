"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { criarOuBuscarCliente, criarCobranca } from "@/lib/asaas";
import { validarCpf } from "@/lib/cpf";
import { podeVenderLivros } from "@/lib/plans";
import { precoComDescontoCentavos } from "@/lib/desconto";

// Frete por autor (Correios, Registro Módico): R$12 pelo 1º livro + R$6 por livro
// adicional do mesmo autor no carrinho.
const FRETE_BASE_CENTAVOS = 1200;
const FRETE_ADICIONAL_CENTAVOS = 600;

function calcularFreteCentavos(quantidadeLivros: number): number {
  return FRETE_BASE_CENTAVOS + FRETE_ADICIONAL_CENTAVOS * (quantidadeLivros - 1);
}

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
    const quantidadeLivros = items
      .filter((i) => i.authorId === authorId)
      .reduce((sum, i) => sum + Math.max(1, Math.floor(i.quantidade) || 1), 0);
    return {
      authorId,
      autorNome: author?.nome ?? "",
      disponivel: true,
      precoCentavos: calcularFreteCentavos(quantidadeLivros),
      servico: "Correios — Registro Módico",
      prazoDias: null,
    };
  });
}

export type CriarPedidoResult = { invoiceUrl: string } | { error: string };

export async function criarPedido(
  items: CheckoutItem[],
  comprador: CheckoutComprador,
  endereco: CheckoutEndereco
): Promise<CriarPedidoResult> {
  // Erros lançados com throw numa Server Action são redigidos pelo Next.js em produção
  // (a mensagem some, só sobra um digest genérico) — por isso essa função sempre retorna
  // { error } em vez de lançar.
  if (items.length === 0) {
    return { error: "Carrinho vazio." };
  }
  if (!comprador.nome.trim() || !comprador.email.trim()) {
    return { error: "Nome e e-mail são obrigatórios." };
  }
  if (!validarCpf(comprador.cpf)) {
    return { error: "CPF inválido." };
  }
  if (
    !endereco.cep.trim() ||
    !endereco.rua.trim() ||
    !endereco.numero.trim() ||
    !endereco.bairro.trim() ||
    !endereco.cidade.trim() ||
    !endereco.uf.trim()
  ) {
    return { error: "Endereço de entrega incompleto." };
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

  const quantidadePorAutor = new Map<string, number>();
  for (const item of items) {
    const quantidade = Math.max(1, Math.floor(item.quantidade) || 1);
    quantidadePorAutor.set(item.authorId, (quantidadePorAutor.get(item.authorId) ?? 0) + quantidade);
  }

  let rows;
  try {
    rows = items.map((item) => {
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
      freteCentavos: aplicarFrete ? calcularFreteCentavos(quantidadePorAutor.get(book.authorId) ?? quantidade) : null,
      freteServico: aplicarFrete ? "Correios — Registro Módico" : null,
      status: "Aguardando pagamento",
      grupoPedidoId,
    };
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível montar o pedido." };
  }

  const freteTotalCentavos = rows.reduce((sum, r) => sum + (r.freteCentavos ?? 0), 0);
  const totalCentavos = rows.reduce((sum, r) => sum + r.valorCentavos, 0) + freteTotalCentavos;

  await prisma.order.createMany({ data: rows });

  const customerId = await criarOuBuscarCliente({
    nome: comprador.nome.trim(),
    cpf: comprador.cpf,
    email: comprador.email.trim(),
    telefone: comprador.telefone.trim(),
    cep: endereco.cep.trim(),
    numero: endereco.numero.trim(),
    complemento: endereco.complemento.trim(),
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
    return { error: "Não foi possível iniciar o pagamento. Tente novamente em instantes." };
  }

  await prisma.order.updateMany({
    where: { grupoPedidoId },
    data: { asaasCustomerId: customerId, asaasPaymentId: cobranca.id },
  });

  revalidatePath("/painel");

  return { invoiceUrl: cobranca.invoiceUrl };
}
