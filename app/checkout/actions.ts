"use server";

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

export async function criarPedido(items: CheckoutItem[], comprador: CheckoutComprador) {
  if (items.length === 0) {
    throw new Error("Carrinho vazio.");
  }
  if (!comprador.nome.trim() || !comprador.email.trim()) {
    throw new Error("Nome e e-mail são obrigatórios.");
  }

  await prisma.order.createMany({
    data: items.map((item) => ({
      authorId: item.authorId,
      bookId: item.bookId,
      livro: item.titulo,
      comprador: comprador.nome.trim(),
      compradorEmail: comprador.email.trim(),
      compradorTelefone: comprador.telefone.trim() || null,
      quantidade: item.quantidade,
      valorCentavos: item.precoCentavos * item.quantidade,
      status: "Aguardando pagamento",
    })),
  });

  revalidatePath("/painel");
}
