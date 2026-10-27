"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireAuthor } from "@/lib/auth";
import { podeVenderLivros } from "@/lib/plans";
import { EBOOK_MAX_PAGINAS } from "@/lib/ebook";
import { apagarArquivosPrivados, listarArquivosPrivados, prefixoEbook } from "@/lib/ebookStorage";

// Envio do PDF do e-book: o navegador converte as páginas e manda uma a uma (rota /api/painel/ebook/...);
// estas ações abrem e fecham o envio. Cada envio grava numa "versão" (subpasta) nova, então trocar o PDF
// de um e-book já pronto não derruba a leitura de quem comprou: a versão nova só vale no final.

const NOME_PAGINA = /^(\d{4})-(\d{2,5})x(\d{2,5})\.webp$/;

async function livroDoAutor(bookId: string, authorId: string) {
  return prisma.book.findFirst({ where: { id: bookId, authorId, formato: "ebook", NOT: { ebookStatus: "retirado" } }, select: { id: true, ebookStatus: true } });
}

export async function iniciarEnvioEbook(bookId: string): Promise<{ error?: string; versao?: string }> {
  const author = await requireAuthor();
  if (!podeVenderLivros(author.plano)) return { error: "Para vender e-books você precisa de um plano Essencial ou superior." };
  const livro = await livroDoAutor(bookId, author.id);
  if (!livro) return { error: "E-book não encontrado." };

  // Só um e-book que ainda não está pronto volta a "processando"; um pronto continua lido normalmente.
  if (livro.ebookStatus !== "pronto") {
    await prisma.book.update({ where: { id: bookId }, data: { ebookStatus: "processando", ebookErro: null } });
  }
  return { versao: crypto.randomBytes(8).toString("hex") };
}

export async function finalizarEnvioEbook(bookId: string, versao: string, totalPaginas: number): Promise<{ error?: string; paginas?: number }> {
  const author = await requireAuthor();
  if (!/^[a-f0-9]{16}$/.test(versao)) return { error: "Envio inválido." };
  if (!Number.isInteger(totalPaginas) || totalPaginas < 1 || totalPaginas > EBOOK_MAX_PAGINAS) return { error: "Número de páginas inválido." };
  const livro = await livroDoAutor(bookId, author.id);
  if (!livro) return { error: "E-book não encontrado." };

  const prefixo = prefixoEbook(bookId, versao);
  const caminhos = await listarArquivosPrivados(prefixo);
  const paginas = new Map<number, { caminho: string; largura: number; altura: number }>();
  for (const caminho of caminhos) {
    const m = NOME_PAGINA.exec(caminho.slice(prefixo.length));
    if (m) paginas.set(Number(m[1]), { caminho, largura: Number(m[2]), altura: Number(m[3]) });
  }
  for (let n = 1; n <= totalPaginas; n++) {
    if (!paginas.has(n)) return { error: `A página ${n} não chegou ao servidor. Envie o PDF de novo.` };
  }

  await prisma.$transaction([
    prisma.ebookPagina.deleteMany({ where: { bookId } }),
    prisma.ebookPagina.createMany({
      data: Array.from({ length: totalPaginas }, (_, i) => ({ bookId, numero: i + 1, ...paginas.get(i + 1)! })),
    }),
    prisma.book.update({
      where: { id: bookId },
      data: { ebookStatus: "pronto", ebookPaginas: totalPaginas, ebookErro: null, ebookPrefixo: prefixo, ebookAtualizadoEm: new Date() },
    }),
  ]);

  // Versão anterior (ou envios abandonados): sai do armazenamento só depois de a nova estar valendo.
  try {
    const sobras = (await listarArquivosPrivados(prefixoEbook(bookId))).filter((c) => !c.startsWith(prefixo));
    await apagarArquivosPrivados(sobras);
  } catch (err) {
    console.error("[ebook] Falha ao limpar versões antigas do e-book:", bookId, err);
  }

  revalidatePath("/painel");
  revalidatePath("/livros");
  revalidatePath("/");
  return { paginas: totalPaginas };
}

/** O envio falhou no meio: se o e-book ainda não estava pronto, marca o erro para o autor ver. */
export async function registrarFalhaEnvioEbook(bookId: string, mensagem: string): Promise<void> {
  const author = await requireAuthor();
  const livro = await livroDoAutor(bookId, author.id);
  if (!livro || livro.ebookStatus === "pronto") return;
  await prisma.book.update({ where: { id: bookId }, data: { ebookStatus: "erro", ebookErro: mensagem.slice(0, 300) } });
  revalidatePath("/painel");
}
