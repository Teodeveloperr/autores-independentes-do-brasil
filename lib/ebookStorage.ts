import "server-only";
import { get, put, del, list } from "@vercel/blob";

// Armazenamento PRIVADO dos e-books (Vercel Blob, store "ebooks"). Nada aqui tem endereço público:
// toda leitura passa pelo servidor, que antes confere se a pessoa tem acesso ao livro.
//
// IMPORTANTE: o projeto tem DOIS stores do Blob: o público (capas e fotos, credencial padrão
// BLOB_READ_WRITE_TOKEN) e este privado. Por isso toda chamada leva o token do e-book de forma
// EXPLÍCITA: sem isso a biblioteca poderia usar o store errado.

function tokenEbooks(): string {
  const token = process.env.EBOOKS_READ_WRITE_TOKEN;
  if (!token) throw new Error("EBOOKS_READ_WRITE_TOKEN não está configurada.");
  return token;
}

/** Lê um arquivo do armazenamento privado. Devolve null se ele não existir. */
export async function lerArquivoPrivado(pathname: string): Promise<Buffer | null> {
  const resultado = await get(pathname, { access: "private", token: tokenEbooks() });
  if (!resultado || resultado.statusCode !== 200) return null;
  return Buffer.from(await new Response(resultado.stream).arrayBuffer());
}

/** Grava um arquivo no armazenamento privado, exatamente no caminho pedido (sem sufixo aleatório). */
export async function salvarArquivoPrivado(pathname: string, conteudo: Buffer | Uint8Array, contentType: string): Promise<void> {
  await put(pathname, Buffer.from(conteudo), {
    access: "private",
    token: tokenEbooks(),
    contentType,
    addRandomSuffix: false,
    allowOverwrite: true,
  });
}

export async function apagarArquivoPrivado(pathname: string): Promise<void> {
  await del(pathname, { token: tokenEbooks() });
}

/** Caminhos (pathname) de todos os arquivos sob um prefixo do armazenamento privado. */
export async function listarArquivosPrivados(prefixo: string): Promise<string[]> {
  const caminhos: string[] = [];
  let cursor: string | undefined;
  do {
    const pagina = await list({ prefix: prefixo, limit: 1000, cursor, token: tokenEbooks() });
    caminhos.push(...pagina.blobs.map((b) => b.pathname));
    cursor = pagina.hasMore ? pagina.cursor : undefined;
  } while (cursor);
  return caminhos;
}

export async function apagarArquivosPrivados(caminhos: string[]): Promise<void> {
  for (let i = 0; i < caminhos.length; i += 100) {
    await del(caminhos.slice(i, i + 100), { token: tokenEbooks() });
  }
}

/** Pasta de um e-book no armazenamento: uma subpasta por versão enviada. */
export function prefixoEbook(bookId: string, versao?: string): string {
  return versao ? `ebooks/${bookId}/${versao}/` : `ebooks/${bookId}/`;
}

/** Apaga todas as páginas guardadas de um e-book. Falha ao limpar não deve impedir quem chamou. */
export async function apagarEbookDoArmazenamento(bookId: string): Promise<void> {
  try {
    await apagarArquivosPrivados(await listarArquivosPrivados(prefixoEbook(bookId)));
  } catch (err) {
    console.error("[ebook] Falha ao apagar as páginas do e-book:", bookId, err);
  }
}

// ── Pedidos de impressão (PDFs de capa e miolo, pasta impressao/) ───────────────────────────────

/** Credencial do armazenamento privado, para a rota que autoriza o envio direto do navegador. */
export function tokenArmazenamentoPrivado(): string {
  return tokenEbooks();
}

/** Tamanho (bytes) de um arquivo do armazenamento privado, ou null se ele não existir. */
export async function tamanhoArquivoPrivado(pathname: string): Promise<number | null> {
  const pagina = await list({ prefix: pathname, limit: 10, token: tokenEbooks() });
  return pagina.blobs.find((b) => b.pathname === pathname)?.size ?? null;
}

/** Abre um arquivo do armazenamento privado para leitura em fluxo (sem carregar tudo na memória). */
export async function abrirArquivoPrivado(pathname: string): Promise<ReadableStream<Uint8Array> | null> {
  const resultado = await get(pathname, { access: "private", token: tokenEbooks() });
  if (!resultado || resultado.statusCode !== 200) return null;
  return resultado.stream as ReadableStream<Uint8Array>;
}

/** Confere se o arquivo começa com a assinatura de um PDF ("%PDF"). */
export async function arquivoPrivadoEhPdf(pathname: string): Promise<boolean> {
  const fluxo = await abrirArquivoPrivado(pathname);
  if (!fluxo) return false;
  const leitor = fluxo.getReader();
  try {
    const { value } = await leitor.read();
    return !!value && value.length >= 4 && value[0] === 0x25 && value[1] === 0x50 && value[2] === 0x44 && value[3] === 0x46;
  } finally {
    await leitor.cancel().catch(() => undefined);
  }
}

/** Apaga os PDFs de todos os pedidos de impressão de um autor. Falha ao limpar não impede quem chamou. */
export async function apagarImpressaoDoArmazenamento(authorId: string): Promise<void> {
  try {
    await apagarArquivosPrivados(await listarArquivosPrivados(`impressao/${authorId}/`));
  } catch (err) {
    console.error("[impressao] Falha ao apagar os arquivos de impressão do autor:", authorId, err);
  }
}
