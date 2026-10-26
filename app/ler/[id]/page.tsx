import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireLeitor } from "@/lib/leitorAuth";
import LeitorEbook from "@/components/leitor/LeitorEbook";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Leitura", robots: { index: false, follow: false } };

export default async function LerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const leitor = await requireLeitor();

  const acesso = await prisma.acessoEbook.findFirst({
    where: { leitorId: leitor.id, bookId: id, revogadoEm: null, book: { formato: "ebook", ebookStatus: "pronto" } },
    select: { book: { select: { id: true, titulo: true, author: { select: { nome: true } } } } },
  });
  if (!acesso) notFound();

  const paginas = await prisma.ebookPagina.findMany({
    where: { bookId: id },
    orderBy: { numero: "asc" },
    select: { numero: true, largura: true, altura: true },
  });
  if (paginas.length === 0) notFound();

  return <LeitorEbook livroId={acesso.book.id} titulo={acesso.book.titulo} autor={acesso.book.author.nome} paginas={paginas} />;
}
