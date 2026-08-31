import "server-only";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";

export async function excluirAutorCompletamente(id: string): Promise<void> {
  const author = await prisma.author.findUnique({
    where: { id },
    include: { books: true, fotos: true },
  });

  const blobUrls = [
    author?.fotoUrl,
    author?.bannerUrl,
    ...(author?.books.map((b) => b.capaUrl) ?? []),
    ...(author?.fotos.map((f) => f.url) ?? []),
  ].filter((url): url is string => !!url && url.includes(".blob.vercel-storage.com"));

  await prisma.author.delete({ where: { id } });

  if (blobUrls.length > 0) {
    try {
      await del(blobUrls);
    } catch (err) {
      // Registros já foram apagados; falha ao limpar arquivos não deve impedir a exclusão.
      console.error("[authorDeletion] Falha ao apagar arquivos do autor removido:", err);
    }
  }
}
