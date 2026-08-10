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
