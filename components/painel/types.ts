import type { Prisma } from "@/app/generated/prisma/client";

import type { HorarioEscolhido } from "@/lib/contrato/config";

/** Dados da agenda da Bienal para o painel do autor Premium+ (só carregados para esse plano). */
export type DadosBienalPainel = {
  reserva: HorarioEscolhido | null;
  // Vagas já ocupadas por horário, sem contar a do próprio autor.
  ocupacao: Record<string, number>;
  podeEscolher: boolean;
};

/** Pedido de impressão, como aparece na lista do painel. */
export type PedidoImpressaoResumo = { id: string; numero: number; titulo: string; tiragem: number; status: string; enviadoEm: string };

export type PainelView = "imprimir" | "bienal" | "dash" | "perfil" | "livros" | "pedidos" | "eventos" | "galeria" | "mensagens" | "chat" | "avaliacoes" | "vendas" | "portfolio" | "divulgacao" | "configuracoes";

export type AuthorWithRelations = Prisma.AuthorGetPayload<{
  omit: { senhaHash: true };
  include: {
    books: true;
    eventos: true;
    fotos: true;
    portfolioEventos: true;
    orders: { include: { book: { select: { capaUrl: true } } } };
    conversas: { include: { mensagens: true } };
    avaliacoes: true;
    passkeys: { omit: { publicKey: true } };
  };
}>;
