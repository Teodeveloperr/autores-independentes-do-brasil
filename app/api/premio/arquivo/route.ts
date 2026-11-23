import { abrirArquivoPrivado } from "@/lib/ebookStorage";
import { extensaoDoArquivo, tipoDaExtensao } from "@/lib/premio";
import { linkArquivoPremioValido } from "@/lib/premioLinks";

// Download dos arquivos de uma inscrição do prêmio pelos links do e-mail da organização. Não exige
// login: o link é assinado (caminho + validade), ver lib/premioLinks.ts.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const caminho = url.searchParams.get("p") ?? "";
  const expira = Number(url.searchParams.get("e"));
  const assinatura = url.searchParams.get("s") ?? "";
  if (!/^premio\/[a-f0-9]{32}\/(capa|miolo|comprovante|foto)\.[a-z0-9]+$/.test(caminho) || !linkArquivoPremioValido(caminho, expira, assinatura)) {
    return new Response("Link inválido ou expirado.", { status: 403 });
  }

  const fluxo = await abrirArquivoPrivado(caminho);
  if (!fluxo) return new Response("Arquivo não encontrado.", { status: 404 });

  const ext = extensaoDoArquivo(caminho) ?? "";
  return new Response(fluxo, {
    headers: {
      "Content-Type": tipoDaExtensao(ext) ?? "application/octet-stream",
      "Content-Disposition": `attachment; filename="premio-${caminho.split("/").pop()}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
