import sharp from "sharp";
import { prisma } from "@/lib/db";
import { EBOOK_STATUS_LEITURA } from "@/lib/ebook";
import { getLeitorAtual } from "@/lib/leitorAuth";
import { checkRateLimit } from "@/lib/rateLimit";
import { lerArquivoPrivado } from "@/lib/ebookStorage";
import { gerarMarcaDagua } from "@/lib/marcaDagua";

// Entrega UMA página do e-book, já com a marca d'água do leitor gravada. É a única porta de saída
// das páginas: confere a sessão do leitor, o acesso ao livro e o ritmo de leitura. A resposta
// nunca é guardada em cache (cada leitor recebe a sua versão).

export const dynamic = "force-dynamic";

// Um leitor de verdade vira poucas páginas por minuto; isto só barra quem tenta baixar o livro todo.
const PAGINAS_POR_MINUTO = 90;

const CABECALHOS = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex",
};

function resposta(status: number, mensagem: string) {
  return new Response(mensagem, { status, headers: CABECALHOS });
}

export async function GET(_req: Request, { params }: { params: Promise<{ bookId: string; numero: string }> }) {
  const { bookId, numero } = await params;
  const n = Number(numero);
  if (!Number.isInteger(n) || n < 1 || n > 5000) return resposta(404, "Página não encontrada.");

  const leitor = await getLeitorAtual();
  if (!leitor) return resposta(401, "Sessão expirada. Entre novamente.");

  // Sem acesso, o livro "não existe" para a pessoa: mesma resposta de uma página inexistente.
  const acesso = await prisma.acessoEbook.findFirst({
    where: { leitorId: leitor.id, bookId, revogadoEm: null, book: { formato: "ebook", ebookStatus: { in: EBOOK_STATUS_LEITURA } } },
    select: { id: true },
  });
  if (!acesso) return resposta(404, "Página não encontrada.");

  if (!(await checkRateLimit(`ler:${leitor.id}`, PAGINAS_POR_MINUTO, 1))) {
    return resposta(429, "Muitas páginas em pouco tempo. Aguarde um instante.");
  }

  const pagina = await prisma.ebookPagina.findUnique({ where: { bookId_numero: { bookId, numero: n } }, select: { caminho: true } });
  if (!pagina) return resposta(404, "Página não encontrada.");

  try {
    const original = await lerArquivoPrivado(pagina.caminho);
    if (!original) return resposta(404, "Página não encontrada.");

    // O tamanho da marca d'água sai da imagem de verdade, não do que está gravado no banco.
    const meta = await sharp(original).metadata();
    if (!meta.width || !meta.height) return resposta(500, "Página inválida.");
    const marca = await gerarMarcaDagua({
      largura: meta.width,
      altura: meta.height,
      nome: leitor.nome,
      email: leitor.email,
      codigo: acesso.id.slice(-6).toUpperCase(),
    });

    const saida = await sharp(original).composite([{ input: marca, top: 0, left: 0 }]).webp({ quality: 82 }).toBuffer();
    return new Response(new Uint8Array(saida), { headers: { ...CABECALHOS, "Content-Type": "image/webp" } });
  } catch (err) {
    console.error("[ler] Falha ao entregar a página:", bookId, n, err);
    return resposta(500, "Não foi possível carregar a página.");
  }
}
