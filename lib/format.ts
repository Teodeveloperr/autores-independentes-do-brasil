export function brl(centavos: number) {
  return "R$ " + (centavos / 100).toFixed(2).replace(".", ",");
}

export function centavosFromInput(value: string) {
  const cleaned = value.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3},)/g, "");
  const normalized = cleaned.replace(",", ".");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function initials(nome: string) {
  const parts = nome.trim().split(/\s+/);
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  return initials || "AA";
}

export function firstName(nome: string) {
  return nome.trim().split(/\s+/)[0] || "Autor(a)";
}

export function formatEventoDia(diaInicio: number, diaFim: number | null | undefined) {
  return diaFim && diaFim > diaInicio ? `${diaInicio}-${diaFim}` : String(diaInicio);
}

// Proporção real da capa de um livro (largura/altura), pra exibi-lo no formato como ele é
// de verdade — retrato, quadrado ou paisagem — em vez de forçar sempre 3:4. Cai no 3:4
// padrão quando a dimensão não foi salva (capas enviadas antes dessa funcionalidade
// existir). Limitada a 1:2–2:1 pra uma capa fora do padrão não distorcer demais a grade.
export function capaAspectRatio(largura: number | null | undefined, altura: number | null | undefined): string {
  if (!largura || !altura) return "3/4";
  return String(Math.min(2, Math.max(0.5, largura / altura)));
}

export function sanitizeExternalUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}
