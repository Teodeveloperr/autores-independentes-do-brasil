import type { Prisma } from "@/app/generated/prisma/client";

// Regras comuns do e-book (venda, vitrine e acesso). Sem dependências de servidor: pode ser usado
// em qualquer lugar.

export type FormatoLivro = "fisico" | "ebook";

export function ehEbook(formato: string | null | undefined): boolean {
  return formato === "ebook";
}

/**
 * Livros que podem aparecer na vitrine e ser comprados: os físicos sempre; os e-books só depois que a
 * conversão do PDF terminou ("pronto"). Evita vender um e-book que o leitor ainda não consegue abrir.
 */
export const LIVRO_VENDAVEL_WHERE: Prisma.BookWhereInput = {
  OR: [{ formato: "fisico" }, { formato: "ebook", ebookStatus: "pronto" }],
};
