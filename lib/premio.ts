// Inscrição no 1º Prêmio Literário Autores do Brasil – 2027: campos do formulário, arquivos aceitos e
// validação. Usado no navegador e no servidor, por isso não importa nada de servidor.
// Os dados da inscrição ficam no banco (contador e lista do admin); os arquivos vão para o armazenamento
// privado e são apagados PREMIO_ARQUIVOS_DIAS dias depois do envio (ou do pagamento, no cartão). A organização
// recebe tudo por e-mail (ver app/premio/actions.ts, lib/premioPagamento.ts e docs/fluxos-de-dinheiro.md).

/** Taxa de inscrição por categoria (regulamento, cláusula 4.3), em centavos. */
export const PREMIO_VALOR_CENTAVOS = 18700;

/** Estorno do pagamento feito pela plataforma: a pessoa fala com a organização por este WhatsApp. */
export const PREMIO_WHATSAPP_ESTORNO = "(79) 99182-1546";
export const PREMIO_WHATSAPP_ESTORNO_LINK = "https://wa.me/5579991821546";

/**
 * Conta que recebe a taxa. Pix direto: vai para esta chave. Pagamento pela plataforma: a Asaas recebe e o
 * sistema repassa o valor LÍQUIDO (já sem a tarifa) para a mesma chave. Pode ser trocada pelas variáveis de
 * ambiente PREMIO_PIX_CHAVE e PREMIO_PIX_TIPO (CPF, CNPJ, EMAIL, PHONE ou EVP).
 */
export const PREMIO_PIX_INSTITUTO = { chave: "institutopalavraqueliberta@gmail.com", tipo: "EMAIL", favorecido: "Instituto Palavra que Liberta" } as const;

/** Como a taxa foi/será paga: Pix direto com comprovante, ou cartão de crédito à vista pela plataforma. */
export type FormaPagamentoPremio = "comprovante" | "cartao";

/** Situação do pagamento: "comprovante" (a organização confere), ou, no cartão: aguardando, pago, cancelado, estornado. */
export type PagamentoStatusPremio = "comprovante" | "aguardando" | "pago" | "cancelado" | "estornado";

/** Para onde vão as inscrições. Pode ser trocado pela variável de ambiente PREMIO_EMAIL_DESTINO. */
export const PREMIO_EMAIL_PADRAO = "drdenireis@gmail.com";

/** Cópia de segurança de cada inscrição. Pode ser trocada pela variável de ambiente PREMIO_EMAIL_COPIA. */
export const PREMIO_EMAIL_COPIA = "magisterrapha@gmail.com";

/** Dias que os arquivos enviados ficam no armazenamento antes de serem apagados. */
export const PREMIO_ARQUIVOS_DIAS = 7;

/** Categorias, na ordem e com os nomes do formulário oficial. */
export const PREMIO_CATEGORIAS = [
  "Conto",
  "Crônica",
  "Escritor(a) Estreante - Poesia",
  "Escritor(a) Estreante – Romance",
  "Histórias em Quadrinhos",
  "Infantil / Juvenil",
  "Não ficção / Temas sociais",
  "Poesia",
  "Romance de Entretenimento",
  "Romance Literário",
] as const;

export type ArquivoPremio = "capa" | "miolo" | "comprovante" | "foto";

export const PREMIO_ARQUIVOS: Record<ArquivoPremio, { rotulo: string; extensoes: string[]; maxBytes: number; dica: string }> = {
  capa: { rotulo: "Arquivo de Capa", extensoes: ["pdf", "jpg", "png"], maxBytes: 100 * 1024 * 1024, dica: "PDF, JPG ou PNG, até 100 MB" },
  miolo: { rotulo: "Arquivo de miolo", extensoes: ["pdf", "doc", "docx"], maxBytes: 200 * 1024 * 1024, dica: "PDF, DOC ou DOCX, até 200 MB" },
  comprovante: { rotulo: "Comprovante de pagamento", extensoes: ["pdf", "jpg", "png"], maxBytes: 10 * 1024 * 1024, dica: "PDF, JPG ou PNG, até 10 MB" },
  foto: { rotulo: "Foto do Autor", extensoes: ["jpg", "png", "webp"], maxBytes: 10 * 1024 * 1024, dica: "JPG, PNG ou WEBP, até 10 MB" },
};

export const PREMIO_ORDEM_ARQUIVOS: ArquivoPremio[] = ["capa", "miolo", "comprovante", "foto"];

/** Arquivos que a pessoa envia: quem paga pela plataforma não manda comprovante (a Asaas confirma o pagamento). */
export function arquivosDaForma(forma: FormaPagamentoPremio): ArquivoPremio[] {
  return forma === "cartao" ? PREMIO_ORDEM_ARQUIVOS.filter((a) => a !== "comprovante") : PREMIO_ORDEM_ARQUIVOS;
}

const TIPOS: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export function tipoDaExtensao(extensao: string): string | null {
  return TIPOS[extensao] ?? null;
}

/** Extensão normalizada do nome do arquivo ("Capa.JPEG" → "jpg"), ou null. */
export function extensaoDoArquivo(nome: string): string | null {
  const m = nome.toLowerCase().match(/\.([a-z0-9]+)$/);
  if (!m) return null;
  return m[1] === "jpeg" ? "jpg" : m[1];
}

/** Confere um arquivo escolhido: devolve a mensagem do problema, ou null. */
export function validarArquivoPremio(tipo: ArquivoPremio, nome: string, bytes: number): string | null {
  const regra = PREMIO_ARQUIVOS[tipo];
  const ext = extensaoDoArquivo(nome);
  if (!ext || !regra.extensoes.includes(ext)) return `${regra.rotulo}: formato não aceito (${regra.dica}).`;
  if (bytes <= 0) return `${regra.rotulo}: o arquivo está vazio.`;
  if (bytes > regra.maxBytes) return `${regra.rotulo}: o arquivo passa do limite (${regra.dica}).`;
  return null;
}

export function prefixoPremio(pasta: string): string {
  return `premio/${pasta}/`;
}

export type DadosInscricaoPremio = {
  nome: string;
  nomeArtistico: string;
  telefone: string;
  email: string;
  titulo: string;
  categoria: string;
};

/** Confere os campos de texto. Devolve a mensagem do primeiro problema, ou null. */
export function validarDadosPremio(d: DadosInscricaoPremio): string | null {
  const nome = String(d.nome ?? "").trim();
  const nomeArtistico = String(d.nomeArtistico ?? "").trim();
  const telefone = String(d.telefone ?? "").trim();
  const email = String(d.email ?? "").trim();
  const titulo = String(d.titulo ?? "").trim();
  if (nome.length < 2 || nome.length > 150) return "Informe o seu nome completo.";
  if (nomeArtistico.length < 1 || nomeArtistico.length > 150) return "Informe o seu nome artístico.";
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13 || telefone.length > 30) return "Informe um telefone de contato com DDD.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return "Informe um e-mail de contato válido.";
  if (titulo.length < 1 || titulo.length > 200) return "Informe o título do livro.";
  if (!(PREMIO_CATEGORIAS as readonly string[]).includes(d.categoria)) return "Escolha uma categoria.";
  return null;
}
