import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { abrirArquivoPrivado } from "@/lib/ebookStorage";
import { numeroDoPedidoImpressao } from "@/lib/impressao";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Capa ou miolo de qualquer pedido de impressão, só para o administrador logado (a tela de pedidos
// do admin usa esta rota; os links dos e-mails usam a rota com token).
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; arquivo: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Não autorizado.", { status: 401 });

  const { id, arquivo } = await params;
  if (arquivo !== "capa" && arquivo !== "miolo") return new Response("Arquivo inválido.", { status: 400 });

  const pedido = await prisma.pedidoImpressao.findUnique({
    where: { id },
    select: { numero: true, capaPath: true, mioloPath: true, capaBytes: true, mioloBytes: true },
  });
  if (!pedido) return new Response("Pedido não encontrado.", { status: 404 });

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
