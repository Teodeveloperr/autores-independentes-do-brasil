import { getCurrentAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatarNumeroContrato } from "@/lib/contrato/config";

export const dynamic = "force-dynamic";

// PDF de qualquer contrato assinado, só para o administrador logado.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin) return new Response("Não autorizado.", { status: 401 });

  const { id } = await params;
  const contrato = await prisma.contratoBienal.findUnique({ where: { id }, select: { pdf: true, numero: true } });
  if (!contrato?.pdf) return new Response("Contrato não encontrado.", { status: 404 });

  const nome = `Contrato ${contrato.numero ? formatarNumeroContrato(contrato.numero).replace("/", "-") : ""}.pdf`;
  return new Response(new Uint8Array(contrato.pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${nome}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
