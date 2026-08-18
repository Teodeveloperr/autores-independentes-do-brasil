export const PLANOS_COM_VENDA = ["Gratuito", "Autor Essencial", "Autor Premium"];

export function podeVenderLivros(plano: string) {
  return PLANOS_COM_VENDA.includes(plano);
}

export const PLANOS_COM_RECURSOS_EXTRAS = ["Gratuito", "Autor Essencial", "Autor Premium"];

export function podeUsarRecursosExtras(plano: string) {
  return PLANOS_COM_RECURSOS_EXTRAS.includes(plano);
}

export type PlanoPagoSlug = "essencial" | "premium";

export const PLANOS_PAGOS: Record<PlanoPagoSlug, { nome: string; valorMensalCentavos: number }> = {
  essencial: { nome: "Autor Essencial", valorMensalCentavos: 2990 },
  premium: { nome: "Autor Premium", valorMensalCentavos: 4990 },
};

export type CicloAssinatura = "mensal" | "semestral" | "anual";

export const CICLO_MESES: Record<CicloAssinatura, number> = { mensal: 1, semestral: 6, anual: 12 };

/** Desconto aplicado ao valor mensal em cada ciclo (semestral 10%, anual 20%), cobrado antecipado no ciclo inteiro. */
export function valorCicloCentavos(valorMensalCentavos: number, ciclo: CicloAssinatura): number {
  const meses = CICLO_MESES[ciclo];
  const desconto = ciclo === "semestral" ? 0.9 : ciclo === "anual" ? 0.8 : 1;
  return Math.round(valorMensalCentavos * meses * desconto);
}
