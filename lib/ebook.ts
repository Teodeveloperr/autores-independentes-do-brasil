import type { Prisma } from "@/app/generated/prisma/client";

// Regras comuns do e-book (venda, vitrine e acesso). Sem dependências de servidor: pode ser usado
// em qualquer lugar.

// Limites do envio do PDF. O PDF é lido e convertido no navegador do autor (nunca sobe inteiro para o
// servidor); só as páginas, já em imagem, são enviadas.
export const EBOOK_MAX_PDF_BYTES = 200 * 1024 * 1024;
export const EBOOK_MAX_PAGINAS = 600;
// Uma página convertida precisa caber no limite de corpo de uma função da Vercel (4,5 MB).
export const EBOOK_MAX_PAGINA_BYTES = 4_000_000;

export type FormatoLivro = "fisico" | "ebook";

export function ehEbook(formato: string | null | undefined): boolean {
  return formato === "ebook";
}

/**
 * Estados do e-book em que quem já comprou consegue ler. "retirado" = o autor tirou o livro da venda,
 * mas quem comprou mantém o acesso à leitura online.
 */
export const EBOOK_STATUS_LEITURA = ["pronto", "retirado"];

/**
 * Livros que podem aparecer na vitrine e ser comprados: os físicos sempre; os e-books só depois que a
 * conversão do PDF terminou ("pronto"). Evita vender um e-book que o leitor ainda não consegue abrir.
 */
export const LIVRO_VENDAVEL_WHERE: Prisma.BookWhereInput = {
  OR: [{ formato: "fisico" }, { formato: "ebook", ebookStatus: "pronto" }],
};
