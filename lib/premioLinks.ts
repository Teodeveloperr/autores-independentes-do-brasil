import "server-only";
import crypto from "node:crypto";

// Links de download (sem login) dos arquivos de uma inscrição do prêmio, enviados no e-mail da
// organização. Como a inscrição não fica no banco, o link leva o caminho do arquivo e uma validade,
// assinados com o segredo do site: não dá para adivinhar nem alterar.

const VALIDADE_MS = 120 * 24 * 60 * 60 * 1000;

function assinar(caminho: string, expira: number): string {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo) throw new Error("AUTH_SECRET não configurado.");
  return crypto.createHmac("sha256", segredo).update(`premio-arquivo:${caminho}:${expira}`).digest("hex");
}

export function linkArquivoPremio(caminho: string): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";
  const expira = Date.now() + VALIDADE_MS;
  return `${siteUrl}/api/premio/arquivo?p=${encodeURIComponent(caminho)}&e=${expira}&s=${assinar(caminho, expira)}`;
}

export function linkArquivoPremioValido(caminho: string, expira: number, assinatura: string): boolean {
  if (!Number.isFinite(expira) || expira < Date.now()) return false;
  const esperado = Buffer.from(assinar(caminho, expira));
  const recebido = Buffer.from(assinatura);
  return esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido);
}
