import { z } from "zod";
import { validarCpf } from "@/lib/cpf";
import { validarSenha } from "@/lib/password";

// Schemas reutilizáveis pra validar em runtime dados que chegam de fora (formulários,
// query params, webhooks) — tipos do TypeScript somem em runtime, então não bastam sozinhos.
// Email/Cpf usam .brand() pra marcar, no tipo, que aquela string já passou por aqui: uma
// string qualquer não validada não é aceita onde se espera um Email ou Cpf, só pelo tipo.

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Informe um e-mail.")
  .email("Informe um e-mail válido.")
  .brand<"Email">();
export type Email = z.infer<typeof emailSchema>;

export const cpfSchema = z
  .string()
  .trim()
  .refine(validarCpf, "CPF inválido.")
  .brand<"Cpf">();
export type Cpf = z.infer<typeof cpfSchema>;

export const senhaNovaSchema = z.string().superRefine((senha, ctx) => {
  const erro = validarSenha(senha);
  if (erro) ctx.addIssue({ code: "custom", message: erro });
});

export const nomeSchema = z.string().trim().min(1, "Informe seu nome.").max(120, "Nome muito longo.");

export function textoSchema(max: number, obrigatorio = true) {
  const base = z.string().trim().max(max, `Máximo de ${max} caracteres.`);
  return obrigatorio ? base.min(1, "Campo obrigatório.") : base;
}

/** Extrai a primeira mensagem de erro de um resultado inválido do Zod, pronta pra exibir. */
export function primeiroErroZod(erro: z.ZodError): string {
  return erro.issues[0]?.message || "Dados inválidos.";
}
