export const DESCONTOS_DISPONIVEIS = [5, 10, 15];

export function precoComDescontoCentavos(precoCentavos: number, descontoPercentual: number | null): number {
  if (!descontoPercentual) return precoCentavos;
  return Math.round(precoCentavos * (1 - descontoPercentual / 100));
}
