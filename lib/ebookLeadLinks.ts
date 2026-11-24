import "server-only";
import crypto from "node:crypto";

// Link de download do e-book gratuito, entregue logo depois do cadastro. É assinado com o segredo do site
// (slug do e-book + validade): não dá para adivinhar nem alterar, e expira. O arquivo em si fica no
// armazenamento privado e é lido pela rota app/api/ebook/download.

const VALIDADE_MS = 2 * 60 * 60 * 1000;

function assinar(slug: string, expira: number): string {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo) throw new Error("AUTH_SECRET não configurado.");
  return crypto.createHmac("sha256", segredo).update(`ebook-lead:${slug}:${expira}`).digest("hex");
}

export function linkDownloadEbook(slug: string): string {
  const expira = Date.now() + VALIDADE_MS;
  return `/api/ebook/download?b=${encodeURIComponent(slug)}&e=${expira}&s=${assinar(slug, expira)}`;
}

export function linkDownloadEbookValido(slug: string, expira: number, assinatura: string): boolean {
  if (!Number.isFinite(expira) || expira < Date.now()) return false;
  const esperado = Buffer.from(assinar(slug, expira));
  const recebido = Buffer.from(assinatura);
  return esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido);
}
