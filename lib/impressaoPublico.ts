import "server-only";
import crypto from "node:crypto";

// Envio de arquivos de quem não tem conta (página pública /imprimir). Como não há login, o servidor
// só libera o upload depois de confirmar o anti-robô e entrega ao navegador uma "sessão de envio":
// uma pasta aleatória com validade, assinada com o segredo do site. O upload e o pedido só valem
// para a pasta dessa sessão.

export const PASTA_PUBLICA = "publico";
const VALIDADE_MS = 2 * 60 * 60 * 1000;

export type SessaoEnvioPublico = { pasta: string; expira: number; assinatura: string };

function assinar(pasta: string, expira: number): string {
  const segredo = process.env.AUTH_SECRET;
  if (!segredo) throw new Error("AUTH_SECRET não configurado.");
  return crypto.createHmac("sha256", segredo).update(`impressao-publico:${pasta}:${expira}`).digest("hex");
}

export function criarSessaoEnvioPublico(): SessaoEnvioPublico {
  const pasta = crypto.randomBytes(16).toString("hex");
  const expira = Date.now() + VALIDADE_MS;
  return { pasta, expira, assinatura: assinar(pasta, expira) };
}

export function sessaoEnvioPublicoValida(s: Partial<SessaoEnvioPublico> | null | undefined): s is SessaoEnvioPublico {
  if (!s || typeof s.pasta !== "string" || typeof s.assinatura !== "string" || typeof s.expira !== "number") return false;
  if (!/^[a-f0-9]{32}$/.test(s.pasta) || s.expira < Date.now()) return false;
  const esperado = Buffer.from(assinar(s.pasta, s.expira));
  const recebido = Buffer.from(s.assinatura);
  return esperado.length === recebido.length && crypto.timingSafeEqual(esperado, recebido);
}
