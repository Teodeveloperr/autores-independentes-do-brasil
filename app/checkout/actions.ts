"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

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

export async function criarPedido(items: CheckoutItem[], comprador: CheckoutComprador, endereco: CheckoutEndereco) {
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

  await prisma.order.createMany({
    data: items.map((item) => ({
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
      status: "Aguardando pagamento",
      grupoPedidoId,
    })),
  });

  revalidatePath("/painel");
}
