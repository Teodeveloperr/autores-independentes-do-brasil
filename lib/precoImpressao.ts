// Preço do pedido de impressão de livros ("Imprimir meu livro"), calculado a partir da tabela da
// Gráfica Viena Press (planilha "BASE VP") e conferido, passo a passo, com o simulador do site deles.
//
// Fórmula (confirmada em testes nas duas faixas de tiragem):
//   [ (valor do papel + valor da cor) × páginas × cópias
//     + (encadernação + capa + laminação + orelhas) × cópias ] × 1,34
//
// O fator 1,34 é o que o simulador da gráfica soma sobre os valores da planilha. A plataforma mostra
// o mesmo preço do simulador e recebe o valor integral; a parte da gráfica é repassada depois.
//
// Tudo aqui é cálculo puro (sem importar nada de servidor), então roda no navegador e no servidor.
// Os valores monetários da tabela ficam em reais; as contas são feitas em inteiros (décimos de
// milésimo de real) para não acumular erro de ponto flutuante.

import type { EspecificacoesImpressao } from "./impressao";

/** Fator que o simulador da gráfica aplica sobre os valores da planilha. */
export const PRECO_FATOR_TABELA_GRAFICA = 1.34;
/** Margem própria da plataforma, em %, somada por cima do preço da gráfica. Hoje: nenhuma. */
export const PRECO_MARGEM_PLATAFORMA_PERCENTUAL = 0;

export const TIRAGEM_MINIMA = 30;
export const TIRAGEM_MAXIMA = 500;
/** A partir desta tiragem vale a segunda faixa de preços da gráfica (30 a 49 usa a primeira). */
const TIRAGEM_INICIO_FAIXA_GRANDE = 50;

// ── Encadernações e capas ──────────────────────────────────────────────────────────────────────

/** Encadernações em capa dura: só combinam com papéis de capa dura (Couché 170g e Percalux). */
const ENCADERNACOES_CAPA_DURA = ["Capa dura (com costura)", "Capa dura (sem costura)", "Wire-o capa dura"];
const CAPAS_SO_DURA = ["Percalux"];
const CAPAS_SO_BROCHURA = ["Cartão triplex 250g", "Cartão triplex 300g"];

// Papéis de miolo que o simulador da gráfica oferece para cada encadernação (papel grosso não vai em
// brochura fresada e colada, por exemplo). Informado a partir do simulador em 19/11/2026.
const PAPEIS_MIOLO_BASE = ["Offset 75g", "Offset 90g", "Offset 120g", "Pólen Natural 70g", "Pólen Natural 80g", "Pólen Soft 80g", "Pólen Bold 90g", "Couché Fosco 90g"];
const PAPEIS_MIOLO_FRESADA = [...PAPEIS_MIOLO_BASE, "Couché Fosco 115g"];
const PAPEIS_MIOLO_POR_ENCADERNACAO: Record<string, string[]> = {
  "Brochura fresada e colada": PAPEIS_MIOLO_FRESADA,
  "Brochura costurada e colada": [...PAPEIS_MIOLO_FRESADA, "Offset 150g", "Couché Fosco 150g"],
  "Espiral": [...PAPEIS_MIOLO_BASE, "Offset 150g", "Couché Fosco 150g"],
  "Capa dura (com costura)": [...PAPEIS_MIOLO_FRESADA, "Offset 150g", "Couché Fosco 150g"],
  // Capa dura (sem costura), Wire-o (cartão e dura) e Costura na espinha usam a lista base.
};

/** Papéis que o simulador oferece no miolo colorido inkjet (vistos com a brochura fresada e colada). */
const PAPEIS_MIOLO_INKJET = ["Offset 75g", "Offset 90g", "Offset 120g", "Chambril Avena 80g"];

/** O papel do miolo está disponível para esta encadernação (e, se informada, para esta cor de miolo)? */
export function mioloPapelCompativel(encadernacao: string, mioloPapel: string, mioloCor?: string): boolean {
  if (mioloCor === "Colorido (inkjet)") return PAPEIS_MIOLO_INKJET.includes(mioloPapel);
  return (PAPEIS_MIOLO_POR_ENCADERNACAO[encadernacao] ?? PAPEIS_MIOLO_BASE).includes(mioloPapel);
}

/** Encadernação em capa dura? No simulador da gráfica ela não tem escolha de 4x0/4x4 e o papel da capa não muda o preço. */
export function ehCapaDura(encadernacao: string): boolean {
  return ENCADERNACOES_CAPA_DURA.includes(encadernacao);
}

/**
 * Capa de uma encadernação em capa dura, por exemplar, na faixa de 50 a 500. Medido no simulador:
 * Couché 170g e Percalux deram o mesmo valor (a planilha traz 3,80 para o Percalux, mas o simulador
 * não o cobra), e a laminação escolhida continua somando por cima.
 */
const CAPA_DURA_FAIXA_50 = 1.6;
/** Capa de uma encadernação em capa dura na faixa de 30 a 49, por exemplar (medido no simulador com 40 cópias). */
const CAPA_DURA_FAIXA_30 = 2.5;

/** Diz se o papel da capa combina com a encadernação (a planilha amarra um ao outro). */
export function capaCompativel(encadernacao: string, capaPapel: string): boolean {
  const dura = ENCADERNACOES_CAPA_DURA.includes(encadernacao);
  if (dura) return !CAPAS_SO_BROCHURA.includes(capaPapel);
  return !CAPAS_SO_DURA.includes(capaPapel);
}

type TabelaFaixa = {
  /** Valor por exemplar de cada encadernação. */
  encadernacao: Record<string, number>;
  /** Papel da capa (por exemplar); a impressão é somada à parte. */
  capaPapel: Record<string, number>;
  /** Impressão da capa por exemplar, somada ao papel. */
  capaImpressao: Record<string, number>;
  laminacao: Record<string, number>;
  orelhas: number;
};

const ENCADERNACOES_50: Record<string, number> = {
  "Brochura fresada e colada": 4,
  "Brochura costurada e colada": 12,
  "Espiral": 9,
  "Capa dura (com costura)": 20,
  "Capa dura (sem costura)": 18,
  "Wire-o capa cartão": 12,
  "Wire-o capa dura": 18,
  "Costura na espinha": 6,
};

const ENCADERNACOES_30: Record<string, number> = {
  "Brochura fresada e colada": 6.5,
  "Brochura costurada e colada": 16,
  "Espiral": 12,
  "Capa dura (com costura)": 26,
  "Capa dura (sem costura)": 23,
  "Wire-o capa cartão": 17,
  "Wire-o capa dura": 24,
  "Costura na espinha": 8.5,
};

// Faixa de 50 a 500 exemplares. Medido no simulador: a capa 4x0 sai por (papel + 1,60) e a 4x4 por
// (papel + 3,20), por exemplar; a planilha traz só o papel, e a linha 4x4 = papel + 3,20.
const FAIXA_50: TabelaFaixa = {
  encadernacao: ENCADERNACOES_50,
  capaPapel: { "Cartão triplex 250g": 1.6, "Cartão triplex 300g": 2.5, "Couché 170g": 1.6, "Percalux": 3.8 },
  capaImpressao: { "4x0 (só frente)": 1.6, "4x4 (frente e verso)": 3.2 },
  laminacao: { "Fosca": 2.2 },
  orelhas: 1.5,
};

// Faixa de 30 a 49 exemplares. Medido no simulador: a capa 4x0 sai pelo valor da planilha (4,80 no
// triplex 250g) e as orelhas custam 3,00 por exemplar (a aba da planilha não traz esse valor).
const FAIXA_30: TabelaFaixa = {
  encadernacao: ENCADERNACOES_30,
  capaPapel: { "Cartão triplex 250g": 4.8, "Cartão triplex 300g": 6.3, "Couché 170g": 5, "Percalux": 8.7 },
  capaImpressao: { "4x0 (só frente)": 0, "4x4 (frente e verso)": 2.5 },
  laminacao: { "Fosca": 3.6 },
  orelhas: 3,
};

// ── Miolo ──────────────────────────────────────────────────────────────────────────────────────

/** Formato normalizado ("15,5x23 cm" → "15.5x23"). "A5 (14,8x21 cm)" é tratado como 15x21. */
export function chaveFormato(formato: string): string {
  if (/^A5\b/i.test(formato.trim())) return "15x21";
  const m = formato.match(/(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)/i);
  if (!m) return "";
  return `${m[1].replace(",", ".")}x${m[2].replace(",", ".")}`;
}

const GRUPO_6 = ["12x19", "13x20", "14x21", "15x21", "15x22", "15.5x23"];
const GRUPO_5 = ["17x24", "20x20", "21x21", "21x25", "21x28"];

/** Monta a tabela de um papel: 9x13, o grupo de 12x19 a 15,5x23, 16x23, o grupo de 17x24 a 21x28 e os maiores. */
function papel(p9x13: number, g6: number, p16x23: number, g5: number, p21x297: number, p23x23: number, p25x25: number): Record<string, number> {
  const t: Record<string, number> = { "9x13": p9x13, "16x23": p16x23, "21x29.7": p21x297, "23x23": p23x23, "25x25": p25x25 };
  for (const f of GRUPO_6) t[f] = g6;
  for (const f of GRUPO_5) t[f] = g5;
  return t;
}

/** Valor adicional do papel do miolo, por página, por formato (planilha, impressão dry toner). */
const PAPEIS_MIOLO: Record<string, Record<string, number>> = {
  "Offset 75g": papel(0.0223, 0.0484, 0.0546, 0.0926, 0.0968, 0.0968, 0.0982),
  "Offset 90g": papel(0.0238, 0.0521, 0.0596, 0.0993, 0.1043, 0.1043, 0.1637),
  // Offset 120g: não está na planilha; valores medidos no simulador (160 págs, 100 cópias, brochura
  // fresada, capa triplex 250g 4x0, sem laminação).
  "Offset 120g": {
    "9x13": 0.0356,
    ...Object.fromEntries(GRUPO_6.map((f) => [f, 0.0774])),
    "16x23": 0.0873,
    ...Object.fromEntries(GRUPO_5.map((f) => [f, 0.1481])),
    "21x29.7": 0.1548,
    "23x23": 0.1548,
    "25x25": 0.1571,
  },
  "Offset 150g": papel(0.0298, 0.0671, 0.0796, 0.1259, 0.1491, 0.1342, 0.1936),
  "Pólen Natural 70g": papel(0.0228, 0.0496, 0.0563, 0.0948, 0.0993, 0.0993, 0.1587),
  "Pólen Natural 80g": papel(0.0239, 0.0525, 0.0601, 0.0999, 0.105, 0.105, 0.1644),
  "Pólen Soft 80g": papel(0.0245, 0.0539, 0.062, 0.1024, 0.1078, 0.1078, 0.1672),
  "Pólen Bold 90g": papel(0.0257, 0.0569, 0.066, 0.1078, 0.1139, 0.1139, 0.1733),
  "Couché Fosco 90g": papel(0.0251, 0.0553, 0.0639, 0.105, 0.1107, 0.1107, 0.1701),
  "Couché Fosco 115g": papel(0.0279, 0.0624, 0.0734, 0.1176, 0.1249, 0.1249, 0.1843),
  "Couché Fosco 150g": papel(0.0319, 0.0724, 0.0867, 0.1354, 0.1449, 0.1449, 0.2043),
};

/**
 * Miolo colorido inkjet, medido no simulador (160 págs, 50 e 100 cópias): vale por classe de formato,
 * a menor que 15,8x23 ("pequeno") e a maior ("grande"). O valor por página já inclui a cor e o Offset 75g;
 * os outros papéis somam um acréscimo. Não segue a fórmula (papel + base) da planilha.
 */
const INKJET_POR_PAGINA = { pequeno: 0.0968, grande: 0.19 };
const INKJET_ACRESCIMO_PAPEL: Record<string, { pequeno: number; grande: number }> = {
  "Offset 75g": { pequeno: 0, grande: 0 },
  "Offset 90g": { pequeno: 0.007, grande: 0.014 },
  "Offset 120g": { pequeno: 0.0093, grande: 0.0186 },
  "Chambril Avena 80g": { pequeno: 0.0085, grande: 0.018 },
};

/** Classe de formato do inkjet: pequeno quando largura < 15,8 e altura <= 23; senão, grande. */
function classeInkjet(chave: string): "pequeno" | "grande" | null {
  const m = chave.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)$/);
  if (!m) return null;
  return Number(m[1]) < 15.8 && Number(m[2]) <= 23 ? "pequeno" : "grande";
}

/** Valor da cor do miolo, por página (dry toner). `null` = a planilha não traz o valor. */
function valorCorMiolo(cor: string, chave: string): number | null {
  if (cor === "Preto e branco") return 0.02; // confirmado pela gráfica (a planilha antiga trazia 0,2 por engano)
  if (cor === "Colorido (dry toner)") {
    if (chave === "9x13") return 0.12;
    if (["12x19", "13x20", "14x21", "15x21", "15x22", "15.5x23", "16x23"].includes(chave)) return 0.188;
    // 23x23 e 25x25 não estão na planilha; medidos no simulador (160 págs, 100 cópias): também 0,35.
    if (["17x24", "20x20", "21x21", "21x25", "21x28", "21x29.7", "23x23", "25x25"].includes(chave)) return 0.35;
    return null;
  }
  return null; // colorido inkjet ainda sem valor conferido
}

// ── Resultado ──────────────────────────────────────────────────────────────────────────────────

export type LinhaPreco = { rotulo: string; centavos: number };

export type ResultadoPreco =
  | {
      ok: true;
      /** Total do pedido, em centavos (sem frete). */
      totalCentavos: number;
      /** Total dividido pela tiragem, em centavos. */
      porExemplarCentavos: number;
      faixa: "30 a 49" | "50 a 500";
      linhas: LinhaPreco[];
    }
  | {
      ok: false;
      /** incompleto: faltam dados; invalido: combinação que não existe; consulta: sem preço automático. */
      motivo: "incompleto" | "invalido" | "consulta";
      mensagem: string;
    };

type EntradaPreco = Pick<EspecificacoesImpressao, "formato" | "paginas" | "tiragem" | "mioloCor" | "mioloPapel" | "encadernacao" | "capaPapel" | "capaCor" | "laminacao" | "orelhas">;

const e4 = (reais: number) => Math.round(reais * 10000);

/** Calcula o preço do pedido. Não valida o que o formulário já valida (ISBN, título etc.). */
export function calcularPrecoImpressao(e: EntradaPreco): ResultadoPreco {
  if (!(e.paginas > 0) || !(e.tiragem > 0)) {
    return { ok: false, motivo: "incompleto", mensagem: "Informe o número de páginas e a tiragem para ver o valor." };
  }
  if (e.tiragem < TIRAGEM_MINIMA) {
    return { ok: false, motivo: "invalido", mensagem: `A tiragem mínima é de ${TIRAGEM_MINIMA} exemplares.` };
  }
  if (e.tiragem > TIRAGEM_MAXIMA) {
    return { ok: false, motivo: "consulta", mensagem: `Para tiragens acima de ${TIRAGEM_MAXIMA} exemplares o valor é negociado direto com a nossa equipe. Fale com a gente.` };
  }

  const faixa = e.tiragem >= TIRAGEM_INICIO_FAIXA_GRANDE ? FAIXA_50 : FAIXA_30;
  const chave = chaveFormato(e.formato);
  const consulta = (mensagem: string): ResultadoPreco => ({ ok: false, motivo: "consulta", mensagem });

  if (!capaCompativel(e.encadernacao, e.capaPapel)) {
    return {
      ok: false,
      motivo: "invalido",
      mensagem: ENCADERNACOES_CAPA_DURA.includes(e.encadernacao)
        ? "Na capa dura, o papel da capa deve ser Couché 170g ou Percalux."
        : "O Percalux só é usado em capa dura. Escolha outro papel de capa ou outra encadernação.",
    };
  }

  if (!mioloPapelCompativel(e.encadernacao, e.mioloPapel, e.mioloCor)) {
    return {
      ok: false,
      motivo: "invalido",
      mensagem:
        e.mioloCor === "Colorido (inkjet)"
          ? "Este papel de miolo não está disponível no miolo colorido inkjet."
          : "Este papel de miolo não está disponível para a encadernação escolhida.",
    };
  }

  // Valor do miolo por página, em duas parcelas (décimos de milésimo) para não somar decimais.
  let mioloPorPaginaE4: number;
  if (e.mioloCor === "Colorido (inkjet)") {
    const classe = classeInkjet(chave);
    const acrescimo = classe ? INKJET_ACRESCIMO_PAPEL[e.mioloPapel]?.[classe] : undefined;
    if (!classe || acrescimo === undefined) return consulta("Esta combinação de formato e papel no miolo inkjet ainda não tem valor automático. Peça o orçamento por e-mail.");
    mioloPorPaginaE4 = e4(INKJET_POR_PAGINA[classe]) + e4(acrescimo);
  } else {
    const tabelaPapel = PAPEIS_MIOLO[e.mioloPapel];
    if (!tabelaPapel) return consulta(`O papel ${e.mioloPapel} ainda não tem valor automático. Peça o orçamento por e-mail.`);
    const valorPapel = tabelaPapel[chave];
    const valorCor = valorCorMiolo(e.mioloCor, chave);
    if (valorPapel === undefined || valorCor === null) return consulta("Esta combinação de formato, papel e cor ainda não tem valor automático. Peça o orçamento por e-mail.");
    mioloPorPaginaE4 = e4(valorPapel) + e4(valorCor);
  }

  const dura = ehCapaDura(e.encadernacao);

  const encadernacao = faixa.encadernacao[e.encadernacao];
  const capaPapel = dura ? (faixa === FAIXA_50 ? CAPA_DURA_FAIXA_50 : CAPA_DURA_FAIXA_30) : faixa.capaPapel[e.capaPapel];
  const capaImpressao = dura ? 0 : faixa.capaImpressao[e.capaCor];
  const laminacao = faixa.laminacao[e.laminacao];
  if ([encadernacao, capaPapel, capaImpressao, laminacao].some((v) => v === undefined)) {
    return consulta("Alguma opção escolhida ainda não tem valor automático. Peça o orçamento por e-mail.");
  }

  const exemplares = e.tiragem;
  const partes: Array<[string, number]> = [
    ["Miolo", mioloPorPaginaE4 * e.paginas * exemplares],
    ["Encadernação", e4(encadernacao) * exemplares],
    ["Capa", (e4(capaPapel) + e4(capaImpressao)) * exemplares],
    ["Laminação da capa", e4(laminacao) * exemplares],
  ];
  if (e.orelhas) partes.push(["Orelhas", e4(faixa.orelhas) * exemplares]);

  // O fator da gráfica (e a margem, se houver) entra uma vez sobre a soma, como no simulador. Cada
  // linha é a diferença entre dois acumulados arredondados, para as linhas somarem exatamente o total.
  const fator = PRECO_FATOR_TABELA_GRAFICA * (1 + PRECO_MARGEM_PLATAFORMA_PERCENTUAL / 100);
  const emCentavos = (acumuladoE4: number) => Math.round((acumuladoE4 * fator) / 100);

  const linhas: LinhaPreco[] = [];
  let acumuladoE4 = 0;
  let acumuladoCentavos = 0;
  for (const [rotulo, valorE4] of partes) {
    acumuladoE4 += valorE4;
    const novo = emCentavos(acumuladoE4);
    linhas.push({ rotulo, centavos: novo - acumuladoCentavos });
    acumuladoCentavos = novo;
  }

  return {
    ok: true,
    totalCentavos: acumuladoCentavos,
    porExemplarCentavos: Math.round(acumuladoCentavos / exemplares),
    faixa: faixa === FAIXA_50 ? "50 a 500" : "30 a 49",
    linhas,
  };
}

/** "R$ 1.234,56" a partir de centavos. */
export function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
