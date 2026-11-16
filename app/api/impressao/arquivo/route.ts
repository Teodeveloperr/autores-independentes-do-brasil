import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { abrirArquivoPrivado } from "@/lib/ebookStorage";
import { numeroDoPedidoImpressao } from "@/lib/impressao";

// Download dos PDFs de um pedido de impressão pelos links do e-mail enviado à equipe. Não exige
// login: quem tem o token do pedido (aleatório, guardado só como hash) baixa a capa e o miolo.

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";
  const arquivo = url.searchParams.get("arquivo");
  if (!/^[a-f0-9]{64}$/.test(token) || (arquivo !== "capa" && arquivo !== "miolo")) {
    return new Response("Link inválido.", { status: 400 });
  }

  const pedido = await prisma.pedidoImpressao.findUnique({
    where: { tokenHash: crypto.createHash("sha256").update(token).digest("hex") },
    select: { numero: true, capaPath: true, mioloPath: true, capaBytes: true, mioloBytes: true },
  });
  if (!pedido) return new Response("Link inválido.", { status: 404 });

  const fluxo = await abrirArquivoPrivado(arquivo === "capa" ? pedido.capaPath : pedido.mioloPath);
  if (!fluxo) return new Response("Arquivo não encontrado.", { status: 404 });

  return new Response(fluxo, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(arquivo === "capa" ? pedido.capaBytes : pedido.mioloBytes),
      "Content-Disposition": `attachment; filename="${numeroDoPedidoImpressao(pedido.numero)}-${arquivo}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
