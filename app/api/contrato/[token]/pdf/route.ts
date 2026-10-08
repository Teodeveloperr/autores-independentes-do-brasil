import { prisma } from "@/lib/db";
import { formatarNumeroContrato } from "@/lib/contrato/config";

export const dynamic = "force-dynamic";

// PDF do contrato para quem tem o link (o token é longo e aleatório). Só existe depois de assinado.
export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const contrato = await prisma.contratoBienal.findUnique({
    where: { token },
    select: { pdf: true, numero: true, status: true },
  });
  if (!contrato || !contrato.pdf || contrato.status === "rascunho") {
    return new Response("Contrato não encontrado.", { status: 404 });
  }
  const nome = `Contrato ${contrato.numero ? formatarNumeroContrato(contrato.numero).replace("/", "-") : ""}.pdf`;
  return new Response(new Uint8Array(contrato.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nome}"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
