// Reconhecimento do tipo REAL de uma imagem pelos primeiros bytes do arquivo (a assinatura, ou
// "magic bytes"). Usado no navegador (antes do upload) e no servidor (antes de salvar), sem
// depender do nome nem do tipo que o navegador informa: um JPEG chamado "foto.png" é um JPEG.

export type TipoImagem = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

export const EXTENSAO_POR_TIPO: Record<TipoImagem, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
};

// Quantos bytes iniciais bastam para reconhecer qualquer um dos formatos abaixo.
export const BYTES_PARA_RECONHECER = 16;

export function detectarTipoImagem(b: Uint8Array): TipoImagem | null {
  if (b.length >= 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 4 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return "image/gif";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50 // "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

// Formatos de foto de celular que o site não aceita: ficam em "ftyp" + uma marca (HEIC/HEIF/AVIF).
export function ehHeicOuAvif(b: Uint8Array): boolean {
  if (b.length < 12 || b[4] !== 0x66 || b[5] !== 0x74 || b[6] !== 0x79 || b[7] !== 0x70) return false; // "ftyp"
  const marca = String.fromCharCode(b[8], b[9], b[10], b[11]);
  return ["heic", "heix", "hevc", "hevx", "heim", "heis", "mif1", "msf1", "avif", "avis"].includes(marca);
}

export const MENSAGEM_HEIC = "Imagens no formato HEIC (comum em iPhone) ou AVIF não são aceitas. Salve a foto como JPG e envie de novo.";
export const MENSAGEM_NAO_IMAGEM = "Este arquivo não parece ser uma imagem válida. Envie uma imagem em JPG, PNG, WebP ou GIF (se ela vier de um app, abra e salve como JPG antes de enviar).";
