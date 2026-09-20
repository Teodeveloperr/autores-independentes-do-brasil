import "server-only";

// Verifica o token do Cloudflare Turnstile enviado pelo formulário. Se a chave secreta não
// estiver configurada (ainda não criada no painel da Cloudflare), deixa passar sem bloquear
// ninguém — mesmo padrão de degradação usado pras outras integrações opcionais do projeto.
export async function verificarTurnstile(token: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY não configurado — verificação pulada.");
    return true;
  }
  if (!token) {
    return false;
  }

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    if (!res.ok) {
      console.error("[turnstile] Falha ao verificar token:", res.status, await res.text());
      return false;
    }
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] Falha ao verificar token:", err);
    return false;
  }
}
