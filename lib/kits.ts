// Kits "Impressão de livros + Lançamento" da Bienal do Livro Rio 2027 (home e /checkout/kit/[kit]).
// Preços e regras de parcelamento ficam aqui, no servidor: o navegador só informa qual kit e quantas
// parcelas, nunca o valor. Usado também no navegador (só dados, sem imports de servidor).

export type KitId = "prata" | "ouro";

export type Kit = {
  id: KitId;
  nome: string;
  valorCentavos: number;
  copias: number;
  paginasMax: number;
  horasLancamento: number;
  /** Especificações do livro incluídas no kit. */
  especificacoes: string;
};

export const KITS: Record<KitId, Kit> = {
  prata: {
    id: "prata",
    nome: "Kit Prata",
    valorCentavos: 159900,
    copias: 40,
    paginasMax: 140,
    horasLancamento: 2,
    especificacoes: "Tamanho A5 / Miolo P&B / Capa colorida / Brochura",
  },
  ouro: {
    id: "ouro",
    nome: "Kit Ouro",
    valorCentavos: 219900,
    copias: 60,
    paginasMax: 140,
    horasLancamento: 4,
    especificacoes: "Tamanho A5 / Miolo P&B / Capa colorida / Brochura",
  },
};

/** Parcelamento no cartão: no máximo 2x, sem juros. */
export const MAX_PARCELAS_KIT = 2;

export function kitPorId(id: string): Kit | null {
  return id === "prata" || id === "ouro" ? KITS[id] : null;
}

export function resumoDoKit(kit: Kit): string {
  return `${kit.nome} - ${kit.copias} cópias (até ${kit.paginasMax} páginas) + lançamento`;
}

export function horasLegiveis(horas: number): string {
  return `${horas} ${horas === 1 ? "hora" : "horas"} de lançamento`;
}

export function rotuloStatusKit(status: string): string {
  return status === "pago" ? "Pago" : status === "cancelado" ? "Cancelado" : "Aguardando pagamento";
}

/** Valor em reais com separador de milhar, como na arte da home ("R$ 2.199,00"). */
export function valorKit(centavos: number): string {
  return "R$ " + (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Parte de cada pagamento de kit que vai para o parceiro (os 10% restantes ficam na plataforma). */
export const KIT_PERCENTUAL_PARCEIRO = 90;

export function valorParceiroKitCentavos(valorPagoCentavos: number): number {
  return Math.round((valorPagoCentavos * KIT_PERCENTUAL_PARCEIRO) / 100);
}

// ── Impressão do livro do kit ─────────────────────────────────────────────────────────────────
// O kit já define as características da impressão: o comprador não escolhe nada, só informa o título
// e o ISBN, envia a capa e o miolo e confirma. Papel do miolo, papel e laminação da capa e orelhas
// não constam da arte do kit e seguem o padrão da gráfica (alterar aqui muda para todos os kits).

export const ESPECIFICACOES_FIXAS_KIT = {
  formato: "A5 (14,8x21 cm)",
  mioloCor: "Preto e branco",
  mioloPapel: "Pólen Natural 80g",
  encadernacao: "Brochura fresada e colada",
  capaPapel: "Cartão triplex 250g",
  capaCor: "4x0 (só frente)",
  laminacao: "Fosca",
  orelhas: false,
} as const;

/** Lista, em palavras, do que o kit já inclui na impressão (para a tela travada). */
export function itensDeImpressaoDoKit(kit: Pick<Kit, "copias" | "paginasMax">): Array<[string, string]> {
  const f = ESPECIFICACOES_FIXAS_KIT;
  return [
    ["Cópias", `${kit.copias} exemplares`],
    ["Páginas do miolo", `até ${kit.paginasMax}`],
    ["Formato", f.formato],
    ["Miolo", `${f.mioloCor}, ${f.mioloPapel}`],
    ["Encadernação", f.encadernacao],
    ["Capa", `colorida, ${f.capaPapel}, laminação ${f.laminacao.toLowerCase()}, sem orelhas`],
  ];
}
