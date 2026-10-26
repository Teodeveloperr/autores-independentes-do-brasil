import "server-only";
import { get, put, del } from "@vercel/blob";

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
