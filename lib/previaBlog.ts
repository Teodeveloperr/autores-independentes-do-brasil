import { createHash } from "node:crypto";

// Imagem de prévia de um artigo do blog (a que aparece quando o link /blog/código é colado no
// WhatsApp, Instagram, Facebook, X etc.): a imagem de destaque do artigo, ajustada a 1200x630.
// O endereço leva ?v=<versão da imagem>, então, se a imagem de destaque for trocada, o endereço
// muda e as redes buscam a nova (elas guardam a prévia por endereço).

/** Identificador curto da imagem de destaque, usado na URL da prévia. */
export function versaoPreviaBlog(capaUrl: string): string {
  return createHash("sha1").update(capaUrl).digest("hex").slice(0, 10);
}

/** Endereço da prévia do artigo (relativo ao site), ou null se ele não tem imagem de destaque. */
export function urlPreviaBlog(id: string, capaUrl: string | null): string | null {
  return capaUrl ? `/blog/${id}/previa?v=${versaoPreviaBlog(capaUrl)}` : null;
}
