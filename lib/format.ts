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
