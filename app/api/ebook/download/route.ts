import { abrirArquivoPrivado } from "@/lib/ebookStorage";
import { EBOOK_GUIA } from "@/lib/ebookLead";
import { linkDownloadEbookValido } from "@/lib/ebookLeadLinks";

// Entrega o PDF do e-book gratuito. Só abre com o link assinado que o cadastro (pop-up do blog) emite.

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("b") ?? "";
  const expira = Number(url.searchParams.get("e"));
  const assinatura = url.searchParams.get("s") ?? "";
  if (slug !== EBOOK_GUIA.slug || !linkDownloadEbookValido(slug, expira, assinatura)) {
    return new Response("Link inválido ou expirado. Peça o e-book de novo pelo blog.", { status: 403 });
  }

  const fluxo = await abrirArquivoPrivado(EBOOK_GUIA.arquivo);
  if (!fluxo) return new Response("Arquivo não encontrado.", { status: 404 });

  return new Response(fluxo, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${EBOOK_GUIA.nomeDownload}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
