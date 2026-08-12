export function validarSenha(senha: string): string | null {
  if (senha.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (!/[a-zA-Z]/.test(senha)) return "A senha deve conter pelo menos uma letra.";
  if (!/[0-9]/.test(senha)) return "A senha deve conter pelo menos um número.";
  return null;
}
