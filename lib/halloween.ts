// Tema sazonal de Halloween. Liga e desliga sozinho por data, no navegador do visitante: assim
// as páginas continuam em cache e não precisam de novo deploy pra "virar" no dia 28/10 nem pra
// voltar ao normal depois. Fora do período (e fora das rotas públicas) nada do tema aparece.

export const HALLOWEEN = {
  // Datas no formato AAAA-MM-DD, comparadas com a data local do visitante (inclusive nas pontas).
  inicio: "2026-10-28",
  fim: "2026-11-03",
  // Rotas onde o tema NÃO entra: áreas logadas, pagamento e fluxos sensíveis.
  rotasExcluidas: ["/painel", "/admin", "/checkout", "/carrinho", "/login", "/cadastro", "/recuperar-senha", "/redefinir-senha", "/assinatura", "/contrato-bienal", "/entrar", "/estante", "/ler", "/api"],
  chaveForcar: "hw-tema",
} as const;

export function rotaPublica(pathname: string): boolean {
  return !HALLOWEEN.rotasExcluidas.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

export function dataLocalISO(d: Date = new Date()): string {
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function dentroDoPeriodo(d: Date = new Date()): boolean {
  const hoje = dataLocalISO(d);
  return hoje >= HALLOWEEN.inicio && hoje <= HALLOWEEN.fim;
}

/**
 * Decide se o tema está ligado nesta página. Para conferir antes da data (e mostrar ao sócio),
 * "?tema=halloween" liga só para quem abriu o link (fica guardado na aba) e "?tema=normal" desliga.
 */
export function temaAtivo(pathname: string, search: string): boolean {
  if (!rotaPublica(pathname)) return false;
  let forcado: string | null = null;
  try {
    const q = new URLSearchParams(search).get("tema");
    if (q === "halloween" || q === "normal") window.sessionStorage.setItem(HALLOWEEN.chaveForcar, q);
    forcado = window.sessionStorage.getItem(HALLOWEEN.chaveForcar);
  } catch {
    // Sem armazenamento (janela privada, por exemplo): vale só a data.
  }
  if (forcado === "halloween") return true;
  if (forcado === "normal") return false;
  return dentroDoPeriodo();
}

/**
 * Script que roda no <head> antes da primeira pintura e liga a classe no <html>, pra não haver
 * "piscada" do site normal. A mesma lógica de temaAtivo, em texto (roda antes do React carregar).
 */
export function scriptInicial(): string {
  const cfg = JSON.stringify({ i: HALLOWEEN.inicio, f: HALLOWEEN.fim, ex: HALLOWEEN.rotasExcluidas, k: HALLOWEEN.chaveForcar });
  return `(function(){try{var c=${cfg};var p=location.pathname;for(var n=0;n<c.ex.length;n++){var r=c.ex[n];if(p===r||p.indexOf(r+"/")===0)return}var q=new URLSearchParams(location.search).get("tema");if(q==="halloween"||q==="normal")sessionStorage.setItem(c.k,q);var s=sessionStorage.getItem(c.k);var on;if(s==="halloween")on=true;else if(s==="normal")on=false;else{var d=new Date(),m=("0"+(d.getMonth()+1)).slice(-2),dd=("0"+d.getDate()).slice(-2),h=d.getFullYear()+"-"+m+"-"+dd;on=h>=c.i&&h<=c.f}if(on)document.documentElement.classList.add("tema-halloween")}catch(e){}})();`;
}
