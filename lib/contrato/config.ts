// Regras fixas do contrato de participação na Bienal do Livro Rio 2027: pacotes, preços,
// descontos, janela de horários e dados da contratada. Sem dependência de servidor, pra
// poder ser usado tanto na tela (pré-visualização, grade de horários) quanto no PDF.

export const TEXTO_VERSAO = "bienal-rio-2027-v1";

export const SERIE_NUMERO = "SITE";
export const SUFIXO_NUMERO = "BIENALRJ";

export function formatarNumeroContrato(numero: number): string {
  return `${SERIE_NUMERO}-${String(numero).padStart(3, "0")}/${SUFIXO_NUMERO}`;
}

export const WHATSAPP_NEGOCIADO_NUMERO = "5585999566375";
export const WHATSAPP_NEGOCIADO_EXIBIDO = "(85) 99956-6375";
export const WHATSAPP_NEGOCIADO_URL = `https://wa.me/${WHATSAPP_NEGOCIADO_NUMERO}?text=${encodeURIComponent(
  "Olá! Quero contratar a participação na Bienal do Livro Rio 2027 com uma condição negociada."
)}`;

// Grupo de WhatsApp que aparece em popup depois do pagamento. Enquanto não for informado,
// o popup não é exibido.
export const LINK_GRUPO_WHATSAPP_BIENAL = "https://chat.whatsapp.com/Ba4M6STlemvDYEFXGRxyKa?mode=gi_t";

export const CONTRATADA = {
  razaoSocial: "LIGA DOS ILUSTRADORES, ESCRITORES E POETAS DE EUSÉBIO",
  nomeFantasia: "INSTITUTO PALAVRA QUE LIBERTA",
  cnpj: "34.465.218/0001-33",
  endereco: "Av. Coronel Cícero Sá, nº 1400, Centro, Eusébio/CE",
  representante: "AUTORES INDEPENDENTES DO BRASIL",
  email: process.env.EMAIL_CONTATO || "contato@autoresdobrasil.com.br",
};

export const PACOTES_CONTRATO = ["lancamento", "single", "standard"] as const;
export type PacoteContrato = (typeof PACOTES_CONTRATO)[number];

// Todos os pacotes do texto do contrato (cláusula 2). Só os de PACOTES_CONTRATO são vendidos
// pelo site; os outros continuam listados porque o texto do advogado não pode ser alterado.
export const PACOTES_TEXTO = [
  { chave: "premium", rotulo: "PACOTE PREMIUM", valorCentavos: 550000 },
  { chave: "standard", rotulo: "PACOTE STANDARD", valorCentavos: 350000 },
  { chave: "single", rotulo: "PACOTE SINGLE", valorCentavos: 160000 },
  { chave: "auditorio", rotulo: "ESPAÇO DE AUDITÓRIO", valorCentavos: 120000 },
  { chave: "lancamento", rotulo: "PACOTE LANÇAMENTO", valorCentavos: 60000 },
] as const;

export type DireitosPacote = {
  nome: string;
  tabelaCentavos: number;
  // Quantos períodos de balcão (2h) e de auditório (1h) o contratante escolhe.
  balcao: number;
  auditorio: number;
  resumo: string;
};

export const PACOTES: Record<PacoteContrato, DireitosPacote> = {
  lancamento: {
    nome: "Lançamento",
    tabelaCentavos: 60000,
    balcao: 1,
    auditorio: 0,
    resumo: "2 horas de atividade no balcão do estande (lançamento, autógrafos e vendas).",
  },
  single: {
    nome: "Single",
    tabelaCentavos: 160000,
    balcao: 2,
    auditorio: 0,
    resumo: "2 períodos de 2 horas no balcão, no mesmo dia ou em dias diferentes.",
  },
  standard: {
    nome: "Standard",
    tabelaCentavos: 350000,
    balcao: 3,
    auditorio: 1,
    resumo: "3 períodos de 2 horas no balcão e 1 hora no auditório.",
  },
};

export function pacoteValido(valor: string): valor is PacoteContrato {
  return (PACOTES_CONTRATO as readonly string[]).includes(valor);
}

export type FormaPagamentoContrato = "pix" | "cartao";

export function formaPagamentoValida(valor: string): valor is FormaPagamentoContrato {
  return valor === "pix" || valor === "cartao";
}

export const DESCONTO_PIX_PERCENTUAL = 10;

// Desconto por plano de assinatura (soma com o do Pix).
export const DESCONTO_PLANO_PERCENTUAL: Record<string, number> = {
  "Autor Premium": 10,
  "Autor Premium+": 20,
};

export type PrecoContrato = {
  tabelaCentavos: number;
  descontoPercentual: number;
  valorCentavos: number;
};

/** Calcula o preço sempre no servidor: o valor que vem do navegador nunca é usado. */
export function calcularPrecoContrato(
  pacote: PacoteContrato,
  forma: FormaPagamentoContrato,
  planoAutor: string | null | undefined
): PrecoContrato {
  const tabelaCentavos = PACOTES[pacote].tabelaCentavos;
  const descontoPlano = (planoAutor && DESCONTO_PLANO_PERCENTUAL[planoAutor]) || 0;
  const descontoPercentual = descontoPlano + (forma === "pix" ? DESCONTO_PIX_PERCENTUAL : 0);
  const valorCentavos = Math.round(tabelaCentavos * (1 - descontoPercentual / 100));
  return { tabelaCentavos, descontoPercentual, valorCentavos };
}

// Agenda: dias da Bienal, janela de funcionamento e capacidade de cada espaço.
export const DIAS_BIENAL = [
  "2027-09-03",
  "2027-09-04",
  "2027-09-05",
  "2027-09-06",
  "2027-09-07",
  "2027-09-08",
  "2027-09-09",
  "2027-09-10",
  "2027-09-11",
  "2027-09-12",
] as const;

export const HORA_ABERTURA = 10;
export const HORA_FECHAMENTO = 20;

export type TipoEspaco = "balcao" | "auditorio";

export const ESPACOS: Record<TipoEspaco, { rotulo: string; duracaoHoras: number; capacidade: number }> = {
  balcao: { rotulo: "Balcão", duracaoHoras: 2, capacidade: 4 },
  auditorio: { rotulo: "Auditório", duracaoHoras: 1, capacidade: 1 },
};

export function horasInicioDoEspaco(tipo: TipoEspaco): number[] {
  const { duracaoHoras } = ESPACOS[tipo];
  const horas: number[] = [];
  for (let h = HORA_ABERTURA; h + duracaoHoras <= HORA_FECHAMENTO; h += duracaoHoras) horas.push(h);
  return horas;
}

export const MINUTOS_RESERVA_ANTES_ASSINAR = 30;
export const HORAS_RESERVA_APOS_ASSINAR = 24;

export type HorarioEscolhido = { tipo: TipoEspaco; dia: string; horaInicio: number };

export function chaveHorario(h: HorarioEscolhido): string {
  return `${h.tipo}|${h.dia}|${h.horaInicio}`;
}

export function rotuloHorario(h: HorarioEscolhido): string {
  const { duracaoHoras, rotulo } = ESPACOS[h.tipo];
  const [ano, mes, dia] = h.dia.split("-");
  return `${rotulo}: ${dia}/${mes}/${ano}, das ${String(h.horaInicio).padStart(2, "0")}h às ${String(h.horaInicio + duracaoHoras).padStart(2, "0")}h`;
}

export const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export const FRASE_ACEITE =
  "Li o contrato por inteiro e concordo com todas as suas cláusulas. Reconheço a validade desta assinatura eletrônica e aceito assinar por este meio.";
