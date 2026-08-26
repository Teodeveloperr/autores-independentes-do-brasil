export const REGIOES = ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"] as const;
export type Regiao = (typeof REGIOES)[number];

export const UF_REGIAO: Record<string, Regiao> = {
  AC: "Norte",
  AP: "Norte",
  AM: "Norte",
  PA: "Norte",
  RO: "Norte",
  RR: "Norte",
  TO: "Norte",
  AL: "Nordeste",
  BA: "Nordeste",
  CE: "Nordeste",
  MA: "Nordeste",
  PB: "Nordeste",
  PE: "Nordeste",
  PI: "Nordeste",
  RN: "Nordeste",
  SE: "Nordeste",
  DF: "Centro-Oeste",
  GO: "Centro-Oeste",
  MT: "Centro-Oeste",
  MS: "Centro-Oeste",
  ES: "Sudeste",
  MG: "Sudeste",
  RJ: "Sudeste",
  SP: "Sudeste",
  PR: "Sul",
  RS: "Sul",
  SC: "Sul",
};

/**
 * Extrai a sigla de UF de um texto livre tipo "Fortaleza, CE", "São Paulo - SP" ou "Recife/PE".
 * Retorna null quando não reconhece um UF válido no final do texto.
 */
export function extrairUf(cidade: string | null | undefined): string | null {
  if (!cidade) return null;
  const match = cidade.trim().match(/(?:^|[,/-]|\s)\s*([A-Za-z]{2})\s*$/);
  if (!match) return null;
  const uf = match[1].toUpperCase();
  return uf in UF_REGIAO ? uf : null;
}

export function extrairRegiao(cidade: string | null | undefined): Regiao | null {
  const uf = extrairUf(cidade);
  return uf ? UF_REGIAO[uf] : null;
}
