"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { sendOrderConfirmationEmail, sendNewSaleEmail } from "@/lib/email";

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

  const rows = items.map((item) => {
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
  });

  await prisma.order.createMany({ data: rows });

  revalidatePath("/painel");

  const authorIds = [...new Set(items.map((i) => i.authorId))];
  const authors = await prisma.author.findMany({ where: { id: { in: authorIds } } });
  const enderecoTexto = `${endereco.rua.trim()}, ${endereco.numero.trim()}${
    endereco.complemento.trim() ? ` - ${endereco.complemento.trim()}` : ""
  } - ${endereco.bairro.trim()}, ${endereco.cidade.trim()}/${endereco.uf.trim().toUpperCase()} - CEP ${endereco.cep.trim()}`;

  const freteTotalCentavos = rows.reduce((sum, r) => sum + (r.freteCentavos ?? 0), 0);
  const totalCentavos = rows.reduce((sum, r) => sum + r.valorCentavos, 0) + freteTotalCentavos;

  await Promise.all([
    sendOrderConfirmationEmail(comprador.email.trim(), {
      itens: items.map((item) => ({
        titulo: item.titulo,
        autorNome: authors.find((a) => a.id === item.authorId)?.nome ?? "",
        quantidade: item.quantidade,
        precoCentavos: item.precoCentavos,
      })),
      freteCentavos: freteTotalCentavos,
      totalCentavos,
    }).catch((err) => console.error("[checkout] Falha ao enviar e-mail de confirmação ao comprador:", err)),
    ...authorIds.map((authorId) => {
      const author = authors.find((a) => a.id === authorId);
      if (!author) return Promise.resolve();
      const rowFrete = rows.find((r) => r.authorId === authorId && r.freteCentavos != null);
      return sendNewSaleEmail(author.email, {
        comprador: comprador.nome.trim(),
        compradorEmail: comprador.email.trim(),
        compradorTelefone: comprador.telefone.trim() || null,
        endereco: enderecoTexto,
        itens: items
          .filter((item) => item.authorId === authorId)
          .map((item) => ({ titulo: item.titulo, quantidade: item.quantidade, precoCentavos: item.precoCentavos })),
        freteCentavos: rowFrete?.freteCentavos ?? null,
        freteServico: rowFrete?.freteServico ?? null,
      }).catch((err) => console.error(`[checkout] Falha ao enviar e-mail de nova venda para ${author.email}:`, err));
    }),
  ]);
}
