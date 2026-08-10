"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { calcularFrete } from "@/lib/melhorEnvio";

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

  const porAutor = new Map<string, CheckoutItem[]>();
  for (const item of items) {
    const arr = porAutor.get(item.authorId) ?? [];
    arr.push(item);
    porAutor.set(item.authorId, arr);
  }

  const resultados: FreteAutor[] = [];

  for (const [authorId, itensAutor] of porAutor) {
    const author = await prisma.author.findUnique({ where: { id: authorId } });
    if (!author) continue;

    const books = await prisma.book.findMany({ where: { id: { in: itensAutor.map((i) => i.bookId) } } });

    const produtos = itensAutor
      .map((item) => {
        const book = books.find((b) => b.id === item.bookId);
        if (!book || !book.pesoGramas || !book.alturaCm || !book.larguraCm || !book.comprimentoCm) return null;
        return {
          id: item.bookId,
          pesoGramas: book.pesoGramas,
          alturaCm: book.alturaCm,
          larguraCm: book.larguraCm,
          comprimentoCm: book.comprimentoCm,
          precoCentavos: item.precoCentavos,
          quantidade: item.quantidade,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    if (!author.enderecoCep || produtos.length !== itensAutor.length) {
      console.error(
        `[frete] ${author.nome} indisponível: enderecoCep=${author.enderecoCep ?? "ausente"}, livros com dimensões completas=${produtos.length}/${itensAutor.length}`
      );
      resultados.push({ authorId, autorNome: author.nome, disponivel: false, precoCentavos: 0, servico: null, prazoDias: null });
      continue;
    }

    const cotacao = await calcularFrete(author.enderecoCep, cepLimpo, produtos);
    if (!cotacao) {
      console.error(`[frete] ${author.nome} indisponível: calcularFrete retornou null (ver logs de [melhorenvio] acima).`);
      resultados.push({ authorId, autorNome: author.nome, disponivel: false, precoCentavos: 0, servico: null, prazoDias: null });
      continue;
    }

    resultados.push({
      authorId,
      autorNome: author.nome,
      disponivel: true,
      precoCentavos: cotacao.precoCentavos,
      servico: [cotacao.nomeTransportadora, cotacao.nomeServico].filter(Boolean).join(" "),
      prazoDias: cotacao.prazoDias,
    });
  }

  return resultados;
}

export async function criarPedido(
  items: CheckoutItem[],
  comprador: CheckoutComprador,
  endereco: CheckoutEndereco,
  fretes: FreteAutor[]
) {
  if (items.length === 0) {
    throw new Error("Carrinho vazio.");
  }
  if (!comprador.nome.trim() || !comprador.email.trim()) {
    throw new Error("Nome e e-mail são obrigatórios.");
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

  const grupoPedidoId = crypto.randomUUID();
  const freteJaAplicado = new Set<string>();

  await prisma.order.createMany({
    data: items.map((item) => {
      const frete = fretes.find((f) => f.authorId === item.authorId && f.disponivel);
      const aplicarFrete = frete && !freteJaAplicado.has(item.authorId);
      if (aplicarFrete) freteJaAplicado.add(item.authorId);

      return {
        authorId: item.authorId,
        bookId: item.bookId,
        livro: item.titulo,
        comprador: comprador.nome.trim(),
        compradorEmail: comprador.email.trim(),
        compradorTelefone: comprador.telefone.trim() || null,
        compradorCep: endereco.cep.trim(),
        compradorRua: endereco.rua.trim(),
        compradorNumero: endereco.numero.trim(),
        compradorComplemento: endereco.complemento.trim() || null,
        compradorBairro: endereco.bairro.trim(),
        compradorCidade: endereco.cidade.trim(),
        compradorUf: endereco.uf.trim().toUpperCase(),
        quantidade: item.quantidade,
        valorCentavos: item.precoCentavos * item.quantidade,
        freteCentavos: aplicarFrete ? frete!.precoCentavos : null,
        freteServico: aplicarFrete ? frete!.servico : null,
        status: "Aguardando pagamento",
        grupoPedidoId,
      };
    }),
  });

  revalidatePath("/painel");
}
