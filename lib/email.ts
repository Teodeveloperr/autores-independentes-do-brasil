import "server-only";

/**
 * Stub de e-mail transacional. Nenhuma chave de provedor está configurada ainda.
 * Quando o Resend (ou outro provedor) for integrado, trocar o corpo desta função
 * pela chamada real — a assinatura já é a definitiva usada pelo resto do app.
 */
export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  console.log(`[email] (stub) Redefinição de senha para ${to}: ${resetUrl}`);
}
