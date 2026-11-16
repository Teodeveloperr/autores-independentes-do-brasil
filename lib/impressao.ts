// Pedido de impressão de livro ("Imprimir meu livro", no painel do autor): opções do formulário,
// limites e validação. Usado no navegador e no servidor, por isso não importa nada de servidor.

export const FORMATOS = ["9x13 cm", "12x19 cm", "13x20 cm", "14x21 cm", "15x21 cm", "15x22 cm", "15,5x23 cm", "16x23 cm", "17x24 cm", "20x20 cm", "21x21 cm", "23x23 cm", "25x25 cm", "21x25 cm", "21x28 cm", "21x29,7 cm"] as const;
export const MIOLO_CORES = ["Preto e branco", "Colorido (inkjet)", "Colorido (dry toner)"] as const;
export const MIOLO_PAPEIS = ["Offset 75g", "Offset 90g", "Offset 120g", "Offset 150g", "Pólen Natural 70g", "Pólen Natural 80g", "Pólen Soft 80g", "Pólen Bold 90g", "Couché Fosco 90g", "Couché Fosco 115g", "Couché Fosco 150g", "Chambril Avena 80g"] as const;
export const ENCADERNACOES = ["Brochura fresada e colada", "Brochura costurada e colada", "Brochura grampeada", "Espiral", "Capa dura (com costura)", "Capa dura (sem costura)", "Wire-o capa cartão", "Wire-o capa dura", "Costura na espinha"] as const;
export const CAPA_PAPEIS = ["Cartão triplex 250g", "Cartão triplex 300g", "Couché 170g", "Percalux"] as const;
export const CAPA_CORES = ["4x0 (só frente)", "4x4 (frente e verso)"] as const;
export const LAMINACOES = ["Fosca", "Brilho", "Soft touch"] as const;
export const ACABAMENTOS = ["Verniz UV localizado", "Hot-stamping na capa", "Marcador de páginas", "Fita de cetim", "Sobrecapa", "Embalagem individual (shrink)", "Prova física antes da tiragem", "Verificação profissional dos arquivos"] as const;

export const IMPRESSAO_MAX_CAPA_BYTES = 100 * 1024 * 1024;
export const IMPRESSAO_MAX_MIOLO_BYTES = 200 * 1024 * 1024;
export const IMPRESSAO_MAX_PAGINAS = 2000;
export const IMPRESSAO_MAX_TIRAGEM = 100000;

/** Rótulo de cada situação do pedido, como o autor vê no painel. */
export const STATUS_IMPRESSAO: Record<string, string> = {
  enviado: "Enviado",
  em_conferencia: "Em conferência",
  prova_disponivel: "Prova disponível",
  aprovado: "Aprovado",
  em_producao: "Em produção",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export type EspecificacoesImpressao = {
  titulo: string;
  formato: string;
  paginas: number;
  tiragem: number;
  temIsbn: boolean;
  mioloCor: string;
  mioloPapel: string;
  encadernacao: string;
  capaPapel: string;
  capaCor: string;
  laminacao: string;
  orelhas: boolean;
  acabamentos: string[];
  observacoes: string;
};

export const ESPECIFICACOES_PADRAO: EspecificacoesImpressao = {
  titulo: "",
  formato: "14x21 cm",
  paginas: 0,
  tiragem: 0,
  temIsbn: true,
  mioloCor: "Preto e branco",
  mioloPapel: "Pólen Natural 80g",
  encadernacao: "Brochura fresada e colada",
  capaPapel: "Cartão triplex 250g",
  capaCor: "4x0 (só frente)",
  laminacao: "Fosca",
  orelhas: false,
  acabamentos: [],
  observacoes: "",
};

/** Confere as especificações. Devolve a mensagem do primeiro problema, ou null se está tudo certo. */
export function validarEspecificacoes(e: EspecificacoesImpressao): string | null {
  const dentro = (lista: readonly string[], valor: string) => lista.includes(valor);
  if (!e.titulo.trim()) return "Informe o título do livro.";
  if (e.titulo.trim().length > 200) return "O título pode ter até 200 caracteres.";
  if (!dentro(FORMATOS, e.formato)) return "Escolha o formato do livro.";
  if (!Number.isInteger(e.paginas) || e.paginas < 1 || e.paginas > IMPRESSAO_MAX_PAGINAS) return "Informe o número de páginas do miolo.";
  if (!Number.isInteger(e.tiragem) || e.tiragem < 1 || e.tiragem > IMPRESSAO_MAX_TIRAGEM) return "Informe a tiragem (quantidade de exemplares).";
  if (!dentro(MIOLO_CORES, e.mioloCor)) return "Escolha a cor da impressão do miolo.";
  if (!dentro(MIOLO_PAPEIS, e.mioloPapel)) return "Escolha o papel do miolo.";
  if (!dentro(ENCADERNACOES, e.encadernacao)) return "Escolha a encadernação.";
  if (!dentro(CAPA_PAPEIS, e.capaPapel)) return "Escolha o papel da capa.";
  if (!dentro(CAPA_CORES, e.capaCor)) return "Escolha a impressão da capa.";
  if (!dentro(LAMINACOES, e.laminacao)) return "Escolha a laminação da capa.";
  if (e.acabamentos.some((a) => !dentro(ACABAMENTOS, a))) return "Acabamento inválido.";
  if (e.observacoes.length > 2000) return "As observações podem ter até 2000 caracteres.";
  return null;
}

/** Largura e altura, em centímetros, de um formato como "15,5x23 cm". */
export function medidasDoFormato(formato: string): { largura: number; altura: number } | null {
  const partes = formato.replace(" cm", "").split("x").map((p) => Number(p.replace(",", ".")));
  if (partes.length !== 2 || partes.some((n) => !Number.isFinite(n) || n <= 0)) return null;
  return { largura: partes[0], altura: partes[1] };
}

/** Pasta dos arquivos de um pedido no armazenamento privado. */
export function prefixoImpressao(authorId: string, pasta?: string): string {
  return pasta ? `impressao/${authorId}/${pasta}/` : `impressao/${authorId}/`;
}

export function tamanhoLegivel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export function numeroDoPedidoImpressao(numero: number): string {
  return `IMP-${String(numero).padStart(4, "0")}`;
}
