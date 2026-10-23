import "server-only";
import { del } from "@vercel/blob";
import { BYTES_PARA_RECONHECER, MENSAGEM_HEIC, MENSAGEM_NAO_IMAGEM, detectarTipoImagem, ehHeicOuAvif } from "@/lib/imagemTipo";

// O upload vai direto do navegador pro Vercel Blob (nunca passa pelo nosso servidor), então
// só dá pra checar o conteúdo real do arquivo DEPOIS que ele já foi salvo. O tipo declarado no
// upload (allowedContentTypes) só olha o Content-Type que o navegador manda, que é fácil de
// forjar; aqui a gente lê os primeiros bytes reais do arquivo (magic bytes / file signature)
// pra confirmar de verdade.
//
// A conferência vale pela FAMÍLIA do tipo (imagem ou vídeo), não pelo formato exato: um JPEG
// que veio com nome ".png" é uma imagem legítima e não deve ser apagado. O que se barra é
// arquivo que não é imagem (ou vídeo) nenhum — por exemplo um executável renomeado.

type Verificador = (bytes: Uint8Array) => boolean;

const VERIFICADORES_VIDEO: Record<string, Verificador> = {
  "video/mp4": (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70, // "ftyp"
  "video/quicktime": (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70, // "ftyp"
  "video/webm": (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
};

async function baixarBytesIniciais(blobUrl: string): Promise<{ bytes: Uint8Array } | { status: number }> {
  const res = await fetch(blobUrl, { headers: { Range: `bytes=0-${BYTES_PARA_RECONHECER - 1}` }, signal: AbortSignal.timeout(6000) });
  if (!res.ok && res.status !== 206) return { status: res.status };
  return { bytes: new Uint8Array(await res.arrayBuffer()) };
}

/**
 * Baixa só os primeiros bytes do blob (Range request, sem baixar o arquivo inteiro) e confere
 * se eles batem com a assinatura real de algum formato da mesma família do tipo declarado.
 */
export async function magicBytesConferem(blobUrl: string, contentType: string): Promise<boolean> {
  try {
    const resultado = await baixarBytesIniciais(blobUrl);
    if (!("bytes" in resultado)) return false;
    if (contentType.startsWith("image/")) return detectarTipoImagem(resultado.bytes) !== null;
    if (contentType.startsWith("video/")) return Object.values(VERIFICADORES_VIDEO).some((v) => v(resultado.bytes));
    return false;
  } catch (err) {
    console.error("[uploadValidation] Falha ao baixar bytes do blob pra verificação:", err);
    return false;
  }
}

const HOST_BLOB = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//i;

/**
 * Confere, ANTES de gravar no banco, que a imagem enviada existe e é uma imagem de verdade.
 * Evita guardar o endereço de um arquivo que já não existe (o autor veria uma imagem quebrada
 * sem saber o motivo) e devolve uma mensagem clara pro formulário. Imagem inválida é apagada.
 * Endereço vazio é aceito (campo opcional).
 */
export async function validarImagemEnviada(url: string | null | undefined): Promise<{ ok: true } | { ok: false; erro: string }> {
  if (!url) return { ok: true };
  if (!HOST_BLOB.test(url)) return { ok: false, erro: "Endereço de imagem inválido. Envie a imagem novamente." };

  try {
    const resultado = await baixarBytesIniciais(url);
    if (!("bytes" in resultado)) {
      if (resultado.status === 404) return { ok: false, erro: "A imagem enviada não foi encontrada. Envie o arquivo novamente." };
      return { ok: false, erro: "Não foi possível conferir a imagem enviada. Tente enviar de novo." };
    }
    if (detectarTipoImagem(resultado.bytes)) return { ok: true };

    await del(url).catch((err) => console.error("[uploadValidation] Falha ao remover imagem inválida:", url, err));
    return { ok: false, erro: ehHeicOuAvif(resultado.bytes) ? MENSAGEM_HEIC : MENSAGEM_NAO_IMAGEM };
  } catch (err) {
    console.error("[uploadValidation] Falha ao validar a imagem:", url, err);
    return { ok: false, erro: "Não foi possível conferir a imagem enviada. Tente enviar de novo." };
  }
}

/** Valida várias imagens de uma vez e devolve o primeiro erro encontrado. */
export async function validarImagensEnviadas(urls: Array<string | null | undefined>): Promise<{ ok: true } | { ok: false; erro: string }> {
  const resultados = await Promise.all(urls.map((u) => validarImagemEnviada(u)));
  return resultados.find((r) => !r.ok) ?? { ok: true };
}
