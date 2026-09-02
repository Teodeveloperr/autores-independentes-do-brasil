export const TODOS_PLANOS = ["Iniciante", "Autor Essencial", "Autor Premium"];

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
 *
 * Essa é uma ESTIMATIVA sobre o valor bruto — não desconta a tarifa da Asaas na
 * cobrança. Usada como aproximação antes do pagamento confirmar (ainda não existe
 * valor líquido real da Asaas pra essa venda). Depois que o pagamento confirma, usa
 * [[valorRepasseCentavosLiquido]] em vez disso, que reflete o valor líquido real.
 */
export function valorRepasseCentavos(plano: string, valorVendaCentavos: number, freteCentavos: number): number {
  const comissao = COMISSAO_PERCENTUAL[plano] ?? 100;
  const liquidoVenda = Math.round(valorVendaCentavos * (1 - comissao / 100));
  return liquidoVenda + freteCentavos;
}

/**
 * Mesmo cálculo de valorRepasseCentavos, mas a partir do valor líquido REAL que a
 * Asaas devolveu pra essa cobrança (já descontada a tarifa dela) — garante que a
 * comissão do plano incida sobre o que realmente entrou, não sobre o valor bruto.
 * A tarifa da Asaas é distribuída proporcionalmente entre livro e frete.
 */
export function valorRepasseCentavosLiquido(
  plano: string,
  valorVendaCentavos: number,
  freteCentavos: number,
  valorLiquidoTotalCentavos: number
): number {
  const totalBruto = valorVendaCentavos + freteCentavos;
  if (totalBruto <= 0) return 0;
  const comissao = COMISSAO_PERCENTUAL[plano] ?? 100;
  const proporcaoLiquida = valorLiquidoTotalCentavos / totalBruto;
  const vendaLiquida = Math.round(valorVendaCentavos * proporcaoLiquida);
  const freteLiquido = Math.round(freteCentavos * proporcaoLiquida);
  return Math.round(vendaLiquida * (1 - comissao / 100)) + freteLiquido;
}

// Galeria de fotos completa (categorizada) e agenda de eventos.
export const PLANOS_COM_RECURSOS_EXTRAS = ["Autor Essencial", "Autor Premium"];

export function podeUsarRecursosExtras(plano: string) {
  return PLANOS_COM_RECURSOS_EXTRAS.includes(plano);
}

// Restrições do plano Iniciante (perfil "limitado").
export const BIO_MAX_CARACTERES_INICIANTE = 300;
export const PORTFOLIO_EVENTOS_MAX_INICIANTE = 3;

// Ordem de destaque (Autores/Livros/Home) — maior primeiro.
export const PLANO_RANK: Record<string, number> = {
  "Autor Premium": 2,
  "Autor Essencial": 1,
  Iniciante: 0,
};

export function temDestaque(plano: string) {
  return plano === "Autor Premium";
}

export function temSeloVerificado(plano: string) {
  return plano === "Autor Premium";
}

export type NivelRelatorioVendas = "nenhum" | "basico" | "detalhado";

export function relatorioVendasNivel(plano: string): NivelRelatorioVendas {
  if (plano === "Autor Premium") return "detalhado";
  if (plano === "Autor Essencial") return "basico";
  return "nenhum";
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

// Desconto de fidelidade no upgrade de plano: quanto mais cedo o autor trocar
// de plano (menos tempo no plano atual), maior o desconto permanente no novo.
const DESCONTO_FIDELIDADE_TIERS = [
  { meses: 3, percentual: 50 },
  { meses: 6, percentual: 35 },
  { meses: 9, percentual: 20 },
];
const DESCONTO_FIDELIDADE_PADRAO = 10;

export function descontoFidelidade(planoIniciadoEm: Date | null): number {
  if (!planoIniciadoEm) return 0;
  const meses = (Date.now() - planoIniciadoEm.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  for (const tier of DESCONTO_FIDELIDADE_TIERS) {
    if (meses < tier.meses) return tier.percentual;
  }
  return DESCONTO_FIDELIDADE_PADRAO;
}
