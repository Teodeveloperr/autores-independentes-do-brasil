export const TODOS_PLANOS = ["Iniciante", "Autor Essencial", "Autor Premium", "Autor Premium+"];

export const PLANOS_COM_VENDA = ["Autor Essencial", "Autor Premium", "Autor Premium+"];

export function podeVenderLivros(plano: string) {
  return PLANOS_COM_VENDA.includes(plano);
}

// Comissão da plataforma sobre cada venda de livro, por plano.
export const COMISSAO_PERCENTUAL: Record<string, number> = {
  "Autor Essencial": 25,
  "Autor Premium": 10,
  "Autor Premium+": 10,
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
export const PLANOS_COM_RECURSOS_EXTRAS = ["Autor Essencial", "Autor Premium", "Autor Premium+"];

export function podeUsarRecursosExtras(plano: string) {
  return PLANOS_COM_RECURSOS_EXTRAS.includes(plano);
}

// Restrições do plano Iniciante (perfil "limitado").
export const BIO_MAX_CARACTERES_INICIANTE = 300;
export const PORTFOLIO_EVENTOS_MAX_INICIANTE = 3;

// Ordem de destaque (Autores/Livros/Home) — maior primeiro.
export const PLANO_RANK: Record<string, number> = {
  "Autor Premium+": 3,
  "Autor Premium": 2,
  "Autor Essencial": 1,
  Iniciante: 0,
};

// Planos que dão destaque na home e nas listagens (autores em destaque e seus livros recentes).
export const PLANOS_COM_DESTAQUE = ["Autor Premium", "Autor Premium+"];

export function temDestaque(plano: string) {
  return PLANOS_COM_DESTAQUE.includes(plano);
}

export function temSeloVerificado(plano: string) {
  return plano === "Autor Premium" || plano === "Autor Premium+";
}

export type NivelRelatorioVendas = "nenhum" | "basico" | "detalhado";

export function relatorioVendasNivel(plano: string): NivelRelatorioVendas {
  if (plano === "Autor Premium" || plano === "Autor Premium+") return "detalhado";
  if (plano === "Autor Essencial") return "basico";
  return "nenhum";
}

export type PlanoPagoSlug = "essencial" | "premium" | "premiumPlus";

export const PLANOS_PAGOS: Record<PlanoPagoSlug, { nome: string; valorMensalCentavos: number; valorMensalAnualCentavos: number }> = {
  essencial: { nome: "Autor Essencial", valorMensalCentavos: 2990, valorMensalAnualCentavos: 1990 },
  premium: { nome: "Autor Premium", valorMensalCentavos: 4990, valorMensalAnualCentavos: 3990 },
  // Só vendido no ciclo anual (ver CICLOS_PLANO_PAGO) — valorMensalCentavos não é usado de
  // fato, mantido só por consistência de tipo. valorMensalAnualCentavos * 12 = R$ 900,00.
  premiumPlus: { nome: "Autor Premium+", valorMensalCentavos: 7500, valorMensalAnualCentavos: 7500 },
};

// Premium+ é vendido só no ciclo anual — parte do valor (ver PREMIUM_PLUS_VALOR_*) é
// repassada automaticamente a um parceiro (lib/repasseParceiro.ts), o que só faz sentido
// atrelado a uma cobrança anual fixa, não a mensalidades.
export const CICLOS_PLANO_PAGO: Record<PlanoPagoSlug, CicloAssinatura[]> = {
  essencial: ["mensal", "semestral", "anual"],
  premium: ["mensal", "semestral", "anual"],
  premiumPlus: ["anual"],
};

// Do total anual do Premium+ (R$ 900,00): quanto fica na plataforma e quanto é repassado
// automaticamente via Pix pra conta de terceiro configurada pelo admin.
export const PREMIUM_PLUS_VALOR_BASE_CENTAVOS = 47880;
export const PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS = 42120;

export type CicloAssinatura = "mensal" | "semestral" | "anual";

// OFERTA (Black Friday): desconto no Premium+ para quem paga por Pix ou cartão à vista (as duas formas que renovam
// sozinhas). O parcelado no cartão fica sem desconto. O valor com desconto vale para a assinatura
// enquanto ela estiver ativa. PARA ENCERRAR A OFERTA: troque o número abaixo por 0 e faça o deploy; quem
// já assinou com desconto continua pagando o valor que contratou.
export const PREMIUM_PLUS_DESCONTO_PERCENTUAL = 10;
// Nome da oferta mostrado nas telas junto do desconto (só aparece enquanto o percentual for maior que 0).
export const PREMIUM_PLUS_OFERTA_NOME = "Black Friday";

export type MetodoPagamentoPlano = "pix" | "cartao" | "parcelado";

/** Desconto (%) que vale para esse plano, ciclo e forma de pagamento. */
export function descontoPlanoPercentual(slug: PlanoPagoSlug, ciclo: CicloAssinatura, metodo: MetodoPagamentoPlano): number {
  return slug === "premiumPlus" && ciclo === "anual" && (metodo === "pix" || metodo === "cartao") ? PREMIUM_PLUS_DESCONTO_PERCENTUAL : 0;
}

/** Valor total cobrado no ciclo para a forma de pagamento escolhida (já com o desconto, se houver). */
export function valorPlanoPorMetodoCentavos(slug: PlanoPagoSlug, ciclo: CicloAssinatura, metodo: MetodoPagamentoPlano): number {
  const cheio = valorCicloCentavos(PLANOS_PAGOS[slug], ciclo);
  const desconto = descontoPlanoPercentual(slug, ciclo, metodo);
  return desconto > 0 ? Math.round((cheio * (100 - desconto)) / 100) : cheio;
}

/**
 * Parte de um pagamento do Premium+ que vai para o parceiro: a mesma proporção do valor cheio
 * (R$ 421,20 de R$ 900,00 = 46,8%) aplicada ao valor que foi de fato pago. Vale para o pagamento à vista
 * com desconto, para cada parcela do cartão e para as renovações.
 */
export function valorParceiroPremiumPlusCentavos(valorPagoCentavos: number): number {
  return Math.round((valorPagoCentavos * PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS) / (PREMIUM_PLUS_VALOR_BASE_CENTAVOS + PREMIUM_PLUS_VALOR_PARCEIRO_CENTAVOS));
}

export const CICLO_MESES: Record<CicloAssinatura, number> = { mensal: 1, semestral: 6, anual: 12 };

// Quantidade de parcelas que a pessoa pode escolher ao pagar parcelado no cartão — de 1 até
// o número de meses do ciclo (6 no semestral, 12 no anual). Usado tanto pra montar o
// seletor na UI quanto pra validar no servidor o valor que veio do formulário.
export function parcelasDisponiveis(ciclo: CicloAssinatura): number[] {
  return Array.from({ length: CICLO_MESES[ciclo] }, (_, i) => i + 1);
}

// Ciclos aceitos numa concessão manual de plano pelo admin (sem cobrança real por trás) —
// não inclui "mensal" porque não faz sentido conceder um plano gratuito por só um mês.
export type CicloConcessaoAdmin = "semestral" | "anual";

export function planoAdminExpiraEm(ciclo: CicloConcessaoAdmin, desde: Date = new Date()): Date {
  const expira = new Date(desde);
  expira.setMonth(expira.getMonth() + CICLO_MESES[ciclo]);
  return expira;
}

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

