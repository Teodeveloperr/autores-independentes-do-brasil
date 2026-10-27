import sharp from "sharp";
import { prisma } from "@/lib/db";
import { getCurrentAuthor } from "@/lib/auth";
import { EBOOK_MAX_PAGINAS, EBOOK_MAX_PAGINA_BYTES } from "@/lib/ebook";
import { prefixoEbook, salvarArquivoPrivado } from "@/lib/ebookStorage";

// Recebe UMA página já convertida (imagem) do navegador do autor e a grava no armazenamento privado,
// no caminho ebooks/<livro>/<versao>/<n>-<largura>x<altura>.webp. A largura e a altura vão no nome para
// o fim do envio montar a lista de páginas sem reabrir cada arquivo.

export const dynamic = "force-dynamic";

const LIMITE_LADO = 4000;

function erro(status: number, mensagem: string) {
  return Response.json({ error: mensagem }, { status });
}

export async function POST(req: Request, { params }: { params: Promise<{ bookId: string }> }) {
  const author = await getCurrentAuthor();
  if (!author) return erro(401, "Sessão expirada. Entre novamente.");

  const { bookId } = await params;
  const url = new URL(req.url);
  const versao = url.searchParams.get("versao") ?? "";
  const numero = Number(url.searchParams.get("numero"));
  if (!/^[a-f0-9]{16}$/.test(versao)) return erro(400, "Envio inválido.");
  if (!Number.isInteger(numero) || numero < 1 || numero > EBOOK_MAX_PAGINAS) return erro(400, "Página inválida.");

  const tamanhoDeclarado = Number(req.headers.get("content-length") ?? 0);
  if (tamanhoDeclarado > EBOOK_MAX_PAGINA_BYTES) return erro(413, "A página convertida ficou grande demais.");

  const livro = await prisma.book.findFirst({ where: { id: bookId, authorId: author.id, formato: "ebook", NOT: { ebookStatus: "retirado" } }, select: { id: true } });
  if (!livro) return erro(404, "E-book não encontrado.");

  const bruto = Buffer.from(await req.arrayBuffer());
  if (bruto.length === 0 || bruto.length > EBOOK_MAX_PAGINA_BYTES) return erro(413, "A página convertida ficou grande demais.");

  try {
    const imagem = sharp(bruto, { limitInputPixels: 24_000_000 });
    const meta = await imagem.metadata();
    if (!meta.width || !meta.height || !meta.format || !["webp", "jpeg", "png"].includes(meta.format)) return erro(415, "Imagem inválida.");
    if (meta.width > LIMITE_LADO || meta.height > LIMITE_LADO || meta.width < 100 || meta.height < 100) return erro(415, "Tamanho de página inválido.");

    // Sempre WebP no armazenamento. Se o navegador já mandou WebP, mantém como veio (sem recomprimir).
    const webp = meta.format === "webp" ? bruto : await imagem.webp({ quality: 85 }).toBuffer();
    const caminho = `${prefixoEbook(bookId, versao)}${String(numero).padStart(4, "0")}-${meta.width}x${meta.height}.webp`;
    await salvarArquivoPrivado(caminho, webp, "image/webp");
    return Response.json({ ok: true, largura: meta.width, altura: meta.height });
  } catch (err) {
    console.error("[ebook] Falha ao guardar a página:", bookId, numero, err);
    return erro(500, "Não foi possível guardar a página. Tente de novo.");
  }
}
