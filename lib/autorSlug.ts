import "server-only";
import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { slugBase } from "@/lib/slug";

/**
 * Garante que o autor tenha seu endereço (slug) e devolve ele. O slug sai do nome, e se já
 * houver outro igual ganha um número no final (maria-silva, maria-silva-2...). Depois de
 * criado, nunca muda: o link fica fixo mesmo que o autor troque de nome.
 */
export async function garantirSlug(authorId: string): Promise<string | null> {
  const autor = await prisma.author.findUnique({ where: { id: authorId }, select: { nome: true, slug: true } });
  if (!autor) return null;
  if (autor.slug) return autor.slug;

  const base = slugBase(autor.nome);
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    const existentes = await prisma.author.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } });
    const usados = new Set(existentes.map((e) => e.slug));
    let candidato = base;
    for (let n = 2; usados.has(candidato); n++) candidato = `${base}-${n}`;

    try {
      // Só grava se o autor ainda não tiver slug (duas chamadas ao mesmo tempo não se atropelam).
      const gravado = await prisma.author.updateMany({ where: { id: authorId, slug: null }, data: { slug: candidato } });
      if (gravado.count === 0) {
        const atual = await prisma.author.findUnique({ where: { id: authorId }, select: { slug: true } });
        return atual?.slug ?? null;
      }
      return candidato;
    } catch (err) {
      // Outro autor pegou o mesmo endereço no meio tempo: recalcula e tenta de novo.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
      throw err;
    }
  }
  return null;
}

/** Gera o endereço de todo autor que ainda não tem (cadastros novos). Os mais antigos pegam o nome sem número. */
export async function atribuirSlugsFaltantes(): Promise<number> {
  const faltantes = await prisma.author.findMany({ where: { slug: null }, orderBy: { createdAt: "asc" }, select: { id: true } });
  let atribuidos = 0;
  for (const f of faltantes) {
    if (await garantirSlug(f.id)) atribuidos++;
  }
  return atribuidos;
}
