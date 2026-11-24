// E-book gratuito do blog (pop-up de captação): quem preenche nome, e-mail e WhatsApp recebe o link do
// PDF. Usado no navegador e no servidor, por isso não importa nada de servidor.
// O PDF NÃO fica em public/: vive no armazenamento privado e só sai por um link assinado e com validade
// (ver lib/ebookLeadLinks.ts e app/api/ebook/download), emitido depois do cadastro.

export const EBOOK_GUIA = {
  slug: "guia-do-autor-independente",
  titulo: "Guia do Autor Independente",
  /** Caminho do PDF no armazenamento privado (subido por scripts/subir-ebook-guia.mts). */
  arquivo: "ebook-leads/Guia-do-Autor-Independente.pdf",
  nomeDownload: "Guia-do-Autor-Independente.pdf",
} as const;

export type DadosLeadEbook = {
  nome: string;
  email: string;
  whatsapp: string;
  /** Aceite do contato por e-mail e WhatsApp (LGPD). */
  aceite: boolean;
};

/** Confere os campos. Devolve a mensagem do primeiro problema, ou null. */
export function validarLeadEbook(d: DadosLeadEbook): string | null {
  const nome = String(d.nome ?? "").trim();
  const email = String(d.email ?? "").trim();
  const whatsapp = String(d.whatsapp ?? "").trim();
  if (nome.length < 2 || nome.length > 150) return "Informe o seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return "Informe um e-mail válido.";
  const digitos = whatsapp.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13 || whatsapp.length > 30) return "Informe um WhatsApp com DDD.";
  if (d.aceite !== true) return "Marque a caixa para autorizar o envio do e-book e o contato do coletivo.";
  return null;
}
