import "server-only";
import { cpfSchema, cnpjSchema, emailSchema } from "@/lib/validation";

export const TIPOS_CHAVE_PIX = new Set(["CPF", "CNPJ", "EMAIL", "PHONE", "EVP"]);

// Chave Pix "EVP" (aleatória) é sempre um UUID gerado pelo banco/instituição.
const EVP_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function chavePixValida(tipo: string, chave: string): boolean {
  switch (tipo) {
    case "CPF":
      return cpfSchema.safeParse(chave).success;
    case "CNPJ":
      return cnpjSchema.safeParse(chave).success;
    case "EMAIL":
      return emailSchema.safeParse(chave).success;
    case "PHONE":
      return /^\+?\d{10,13}$/.test(chave.replace(/[^\d+]/g, ""));
    case "EVP":
      return EVP_REGEX.test(chave);
    default:
      return false;
  }
}
