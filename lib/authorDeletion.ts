import "server-only";
import { del } from "@vercel/blob";
import { prisma } from "@/lib/db";
import { apagarEbookDoArmazenamento } from "@/lib/ebookStorage";

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
  for (const b of author?.books ?? []) {
    if (b.formato === "ebook") await apagarEbookDoArmazenamento(b.id);
  }

  if (blobUrls.length > 0) {
    try {
      await del(blobUrls);
    } catch (err) {
      // Registros já foram apagados; falha ao limpar arquivos não deve impedir a exclusão.
      console.error("[authorDeletion] Falha ao apagar arquivos do autor removido:", err);
    }
  }
}

const URL_BLOB = ".blob.vercel-storage.com";

async function apagarArquivos(urls: (string | null | undefined)[]) {
  const alvo = urls.filter((url): url is string => !!url && url.includes(URL_BLOB));
  if (alvo.length === 0) return;
  try {
    await del(alvo);
  } catch (err) {
    // Os registros já foram apagados; falha ao limpar arquivos não deve impedir a exclusão.
    console.error("[authorDeletion] Falha ao apagar arquivos do autor:", err);
  }
}

/**
 * Exclui a conta do autor. Se ele tem e-books com leitores ativos, a conta é ENCERRADA em vez de apagada:
 * todos os dados pessoais saem e só ficam o nome (crédito da obra), o registro dos e-books vendidos e os
 * pedidos deles, para quem comprou continuar lendo. Devolve o que aconteceu.
 */
export async function excluirOuEncerrarAutor(id: string): Promise<"excluido" | "encerrado"> {
  const retidos = await prisma.book.findMany({
    where: { authorId: id, formato: "ebook", acessosEbook: { some: { revogadoEm: null } } },
    select: { id: true, capaUrl: true },
  });
  if (retidos.length === 0) {
    await excluirAutorCompletamente(id);
    return "excluido";
  }

  const author = await prisma.author.findUnique({ where: { id }, include: { books: true, fotos: true } });
  if (!author) return "excluido";
  const idsRetidos = retidos.map((b) => b.id);
  const capasRetidas = new Set(retidos.map((b) => b.capaUrl));

  await prisma.$transaction([
    prisma.book.updateMany({ where: { id: { in: idsRetidos } }, data: { ebookStatus: "retirado", ebookAtualizadoEm: new Date() } }),
    prisma.order.deleteMany({ where: { authorId: id, OR: [{ bookId: null }, { bookId: { notIn: idsRetidos } }] } }),
    prisma.book.deleteMany({ where: { authorId: id, id: { notIn: idsRetidos } } }),
    prisma.authorEvent.deleteMany({ where: { authorId: id } }),
    prisma.authorPhoto.deleteMany({ where: { authorId: id } }),
    prisma.conversation.deleteMany({ where: { authorId: id } }),
    prisma.review.deleteMany({ where: { authorId: id } }),
    prisma.passwordResetToken.deleteMany({ where: { authorId: id } }),
    prisma.authorPasskey.deleteMany({ where: { authorId: id } }),
    prisma.authorMercadoPagoToken.deleteMany({ where: { authorId: id } }),
    prisma.subscriptionPayment.deleteMany({ where: { authorId: id } }),
    prisma.portfolioEvento.deleteMany({ where: { authorId: id } }),
    prisma.chatMensagem.deleteMany({ where: { authorId: id } }),
    prisma.author.update({
      where: { id },
      data: {
        status: "encerrado",
        // Sem e-mail utilizável, senha nem login social: ninguém entra nesta conta.
        email: `encerrado-${id}@autoresdobrasil.invalid`,
        senhaHash: null,
        googleId: null,
        cidade: null,
        bio: null,
        fotoUrl: null,
        bannerUrl: null,
        instagramUrl: null,
        twitterUrl: null,
        siteUrl: null,
        enderecoCep: null,
        enderecoRua: null,
        enderecoNumero: null,
        enderecoComplemento: null,
        enderecoBairro: null,
        enderecoCidade: null,
        enderecoUf: null,
        plano: "Iniciante",
        planoCiclo: null,
        planoValorCentavos: null,
        planoIniciadoEm: null,
        planoConcedidoAdminCiclo: null,
        planoConcedidoAdminAte: null,
        mpPreapprovalId: null,
        mpSubscriptionStatus: null,
        cpf: null,
        asaasPixCustomerId: null,
        asaasPixAutoAuthorizationId: null,
        asaasPixAutoStatus: null,
        planoPendente: null,
        asaasCustomerId: null,
        asaasSubscriptionId: null,
        asaasSubscriptionStatus: null,
        asaasCheckoutReference: null,
        asaasParceladoInstallmentId: null,
        planoParceladoAte: null,
        planoParceladoLembreteEnviadoEm: null,
        portfolioFormacao: null,
        portfolioPremios: null,
        portfolioCitacao: null,
        portfolioObraDestaqueId: null,
        portfolioCapaUrl: null,
        pixKey: null,
        pixKeyType: null,
        fraseApresentacao: null,
        profissoes: null,
        videoUrl: null,
        avaliacaoMedia: null,
        avaliacoesQtd: 0,
        verificado: false,
      },
    }),
  ]);

  for (const b of author.books) {
    if (b.formato === "ebook" && !idsRetidos.includes(b.id)) await apagarEbookDoArmazenamento(b.id);
  }
  await apagarArquivos([
    author.fotoUrl,
    author.bannerUrl,
    author.portfolioCapaUrl,
    ...author.books.filter((b) => !idsRetidos.includes(b.id) && !capasRetidas.has(b.capaUrl)).map((b) => b.capaUrl),
    ...author.fotos.map((f) => f.url),
  ]);
  return "encerrado";
}
