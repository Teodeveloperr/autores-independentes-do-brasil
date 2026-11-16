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
