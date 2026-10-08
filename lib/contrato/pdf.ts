import crypto from "node:crypto";
import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import ContratoDocument, { type ComprovacaoAssinatura } from "@/components/contrato/ContratoDocument";
import { FRASE_ACEITE, TEXTO_VERSAO } from "./config";
import { montarContrato, formatarCnpj, formatarCpf, textoPlanoDoContrato, type DadosContratoTexto } from "./texto";

// Só roda no servidor (renderToBuffer). Não tem "server-only" no topo de propósito: assim dá
// pra gerar um PDF de teste por script (tsx) sem subir o site.

export function formatarDataHoraBrasilia(data: Date): string {
  return data.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium" });
}

export function descreverDispositivo(userAgent: string | null): string {
  if (!userAgent) return "não informado";
  const navegador = /Edg\//.test(userAgent)
    ? "Edge"
    : /OPR\//.test(userAgent)
      ? "Opera"
      : /Chrome\//.test(userAgent)
        ? "Chrome"
        : /Firefox\//.test(userAgent)
          ? "Firefox"
          : /Safari\//.test(userAgent)
            ? "Safari"
            : "navegador desconhecido";
  const sistema = /Android/.test(userAgent)
    ? "Android"
    : /iPhone|iPad|iOS/.test(userAgent)
      ? "iOS"
      : /Windows/.test(userAgent)
        ? "Windows"
        : /Mac OS X|Macintosh/.test(userAgent)
          ? "macOS"
          : /Linux/.test(userAgent)
            ? "Linux"
            : "sistema desconhecido";
  return `${navegador} em ${sistema}`;
}

export type AssinaturaRegistrada = { assinadoEm: Date; ip: string; userAgent: string | null };

export type GerarPdfInput = {
  dados: DadosContratoTexto;
  assinaturaContratantePng: string | null;
  assinaturaContratadaPng: string | null;
  // Sem isso, gera o PDF sem o quadro de comprovação (pré-visualização de teste).
  registro: AssinaturaRegistrada | null;
};

export async function gerarPdfContrato(input: GerarPdfInput): Promise<{ pdf: Buffer; pdfHash: string; codigoVerificacao: string }> {
  const contrato = montarContrato(input.dados);
  const codigoVerificacao = crypto.createHash("sha256").update(textoPlanoDoContrato(contrato)).digest("hex");

  const comprovacao: ComprovacaoAssinatura | null = input.registro
    ? {
        nomeSignatario: input.dados.tipoPessoa === "juridica" ? (input.dados.representanteNome ?? input.dados.nome) : input.dados.nome,
        documento:
          input.dados.tipoPessoa === "juridica"
            ? `CPF ${formatarCpf(input.dados.representanteCpf ?? "")}, pelo CNPJ ${formatarCnpj(input.dados.cpfCnpj)}`
            : `CPF ${formatarCpf(input.dados.cpfCnpj)}`,
        email: input.dados.email,
        assinadoEmTexto: formatarDataHoraBrasilia(input.registro.assinadoEm),
        ip: input.registro.ip,
        dispositivo: descreverDispositivo(input.registro.userAgent),
        frasesAceite: FRASE_ACEITE,
        codigoVerificacao,
        versaoTexto: TEXTO_VERSAO,
      }
    : null;

  const elemento = createElement(ContratoDocument, {
    contrato,
    assinaturaContratantePng: input.assinaturaContratantePng,
    assinaturaContratadaPng: input.assinaturaContratadaPng,
    nomeContratante:
      input.dados.tipoPessoa === "juridica" && input.dados.representanteNome
        ? `${input.dados.nome} (representada por ${input.dados.representanteNome})`
        : input.dados.nome,
    comprovacao,
  }) as unknown as ReactElement<DocumentProps>;

  const pdf = await renderToBuffer(elemento);
  const pdfHash = crypto.createHash("sha256").update(pdf).digest("hex");
  return { pdf, pdfHash, codigoVerificacao };
}
