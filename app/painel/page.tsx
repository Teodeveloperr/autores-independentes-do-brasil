import type { Metadata } from "next";
import { requireAuthor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import PainelApp from "@/components/painel/PainelApp";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Meu Painel" };

export default async function PainelPage({ searchParams }: { searchParams: Promise<{ assinatura?: string; mercadopago?: string }> }) {
  const authorSession = await requireAuthor();
  const { assinatura, mercadopago } = await searchParams;

  const author = await prisma.author.findUniqueOrThrow({
    where: { id: authorSession.id },
    omit: { senhaHash: true },
    include: {
      books: { orderBy: { createdAt: "desc" } },
      eventos: { orderBy: { createdAt: "desc" } },
      fotos: { orderBy: { createdAt: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
      conversas: {
        orderBy: { createdAt: "desc" },
        include: { mensagens: { orderBy: { createdAt: "asc" } } },
      },
      avaliacoes: { orderBy: { createdAt: "desc" } },
      passkeys: { orderBy: { createdAt: "desc" }, omit: { publicKey: true } },
    },
  });

  const temSenha = authorSession.senhaHash != null;
  const mercadoPagoToken = await prisma.authorMercadoPagoToken.findUnique({ where: { authorId: author.id } });

  return (
    <PainelApp
      author={author}
      temSenha={temSenha}
      assinaturaPendente={assinatura === "pendente"}
      mercadoPagoConectado={!!mercadoPagoToken}
      mercadoPagoStatus={mercadopago}
    />
  );
}
