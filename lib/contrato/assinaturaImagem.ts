// Valida uma imagem de assinatura enviada pelo navegador como data URL. Aceita só PNG ou JPEG
// de verdade (confere os primeiros bytes) e com tamanho limitado, porque o valor vira parte
// do PDF e fica guardado no banco.
export function validarImagemAssinatura(valor: unknown, maxBytes = 400_000): string | null {
  if (typeof valor !== "string" || valor.length > maxBytes * 1.4) return null;
  const m = /^data:image\/(png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/.exec(valor);
  if (!m) return null;
  const buf = Buffer.from(m[2], "base64");
  if (buf.length < 100 || buf.length > maxBytes) return null;
  const ehPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const ehJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if ((m[1] === "png" && !ehPng) || (m[1] === "jpeg" && !ehJpeg)) return null;
  return valor;
}
