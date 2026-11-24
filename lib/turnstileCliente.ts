// Utilidades do anti-robô (Cloudflare Turnstile) para os formulários do navegador.

const EXPRESSAO = /turnstile/i;

/**
 * Pede outro token ao widget depois de uma tentativa (o token vale uma única vez). Se o widget não existir (script
 * bloqueado por extensão, ainda carregando, widget já removido), a Cloudflare LANÇA um erro; aqui ele é engolido, para
 * nunca esconder a resposta verdadeira do servidor.
 */
export function reiniciarTurnstile(): void {
  try {
    (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
  } catch {
    /* sem widget para reiniciar */
  }
}

/** Token do widget que está na página (campo escondido que a Cloudflare preenche), ou null se ainda não há. */
export function tokenTurnstile(): string | null {
  return document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value || null;
}

/** true se o erro veio da biblioteca da Cloudflare (mensagem em inglês, sem utilidade para a pessoa). */
export function erroDoTurnstile(err: unknown): boolean {
  return err instanceof Error && EXPRESSAO.test(err.message);
}

export const MENSAGEM_VERIFICACAO_INDISPONIVEL =
  "Não conseguimos carregar a verificação anti-robô. Aguarde alguns segundos e tente de novo; se continuar, desative bloqueadores de anúncios ou extensões de privacidade para este site, ou tente outro navegador.";
