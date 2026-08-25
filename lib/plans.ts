export const PLANOS_COM_VENDA = ["Autor Essencial", "Autor Premium"];

export function podeVenderLivros(plano: string) {
  return PLANOS_COM_VENDA.includes(plano);
}

// Comissão da plataforma sobre cada venda de livro, por plano.
export const COMISSAO_PERCENTUAL: Record<string, number> = {
  "Autor Essencial": 25,
  "Autor Premium": 10,
};

/**
 * Valor líquido repassado ao autor numa venda: valor do(s) livro(s) já descontada
 * a comissão do plano, mais o frete (o frete não sofre desconto de comissão).
 */
export function valorRepasseCentavos(plano: string, valorVendaCentavos: number, freteCentavos: number): number {
  const comissao = COMISSAO_PERCENTUAL[plano] ?? 100;
  const liquidoVenda = Math.round(valorVendaCentavos * (1 - comissao / 100));
  return liquidoVenda + freteCentavos;
}

export const PLANOS_COM_RECURSOS_EXTRAS = ["Gratuito", "Autor Essencial", "Autor Premium"];

export function podeUsarRecursosExtras(plano: string) {
  return PLANOS_COM_RECURSOS_EXTRAS.includes(plano);
}

export type PlanoPagoSlug = "essencial" | "premium";

export const PLANOS_PAGOS: Record<PlanoPagoSlug, { nome: string; valorMensalCentavos: number; valorMensalAnualCentavos: number }> = {
  essencial: { nome: "Autor Essencial", valorMensalCentavos: 2990, valorMensalAnualCentavos: 1990 },
  premium: { nome: "Autor Premium", valorMensalCentavos: 4990, valorMensalAnualCentavos: 3990 },
};

export type CicloAssinatura = "mensal" | "semestral" | "anual";

export const CICLO_MESES: Record<CicloAssinatura, number> = { mensal: 1, semestral: 6, anual: 12 };

/**
 * Valor total cobrado no ciclo (antecipado, no ciclo inteiro).
 * Semestral: 10% de desconto sobre o valor mensal. Anual: valor mensal fixo promocional do plano.
 */
export function valorCicloCentavos(plano: { valorMensalCentavos: number; valorMensalAnualCentavos: number }, ciclo: CicloAssinatura): number {
  const meses = CICLO_MESES[ciclo];
  if (ciclo === "anual") return plano.valorMensalAnualCentavos * meses;
  if (ciclo === "semestral") return Math.round(plano.valorMensalCentavos * meses * 0.9);
  return plano.valorMensalCentavos;
}
