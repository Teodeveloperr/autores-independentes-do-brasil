export function senhaChecks(senha: string) {
  return {
    tamanho: senha.length >= 8,
    letra: /[a-zA-Z]/.test(senha),
    numero: /[0-9]/.test(senha),
    especial: /[^a-zA-Z0-9]/.test(senha),
  };
}

export function validarSenha(senha: string): string | null {
  const checks = senhaChecks(senha);
  if (!checks.tamanho) return "A senha deve ter pelo menos 8 caracteres.";
  if (!checks.letra) return "A senha deve conter pelo menos uma letra.";
  if (!checks.numero) return "A senha deve conter pelo menos um número.";
  if (!checks.especial) return "A senha deve conter pelo menos um caractere especial (ex: !@#$%).";
  return null;
}
