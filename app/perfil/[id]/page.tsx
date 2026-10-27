import { notFound, permanentRedirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { garantirSlug } from "@/lib/autorSlug";

export const dynamic = "force-dynamic";

// Endereço antigo do perfil (/perfil/código). Continua funcionando pra não quebrar links já
// divulgados: leva, com redirecionamento permanente, pro endereço novo (/autor/nome-do-autor).
// Se o autor ainda não tiver o endereço novo, ele é gerado agora.
export default async function PerfilAntigoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const autor = await prisma.author.findUnique({ where: { id }, select: { status: true } });
  if (!autor || autor.status !== "ativo") notFound();

  const slug = await garantirSlug(id);
  if (!slug) notFound();
  permanentRedirect(`/autor/${slug}`);
}
