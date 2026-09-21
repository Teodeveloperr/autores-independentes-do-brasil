import "server-only";

// O upload vai direto do navegador pro Vercel Blob (nunca passa pelo nosso servidor), então
// só dá pra checar o conteúdo real do arquivo DEPOIS que ele já foi salvo — por isso essa
// checagem roda em onUploadCompleted, não antes. O tipo declarado no upload (allowedContentTypes)
// só olha o Content-Type que o navegador manda, que é fácil de forjar; aqui a gente lê os
// primeiros bytes reais do arquivo (magic bytes / file signature) pra confirmar de verdade.

type Verificador = (bytes: Uint8Array) => boolean;

const VERIFICADORES: Record<string, Verificador> = {
  "image/png": (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/gif": (b) => b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  "image/webp": (b) =>
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && // "RIFF"
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50, // "WEBP"
  "video/mp4": (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70, // "ftyp"
  "video/quicktime": (b) => b[4] === 0x66 && b[5] === 0x74 && b[6] === 0x79 && b[7] === 0x70, // "ftyp"
  "video/webm": (b) => b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3,
};

/**
 * Baixa só os primeiros bytes do blob (Range request, sem baixar o arquivo inteiro) e
 * confere se eles batem com a assinatura real do tipo declarado no upload.
 */
export async function magicBytesConferem(blobUrl: string, contentType: string): Promise<boolean> {
  const verificar = VERIFICADORES[contentType];
  if (!verificar) return false;

  try {
    const res = await fetch(blobUrl, { headers: { Range: "bytes=0-15" } });
    if (!res.ok && res.status !== 206) return false;
    const bytes = new Uint8Array(await res.arrayBuffer());
    return verificar(bytes);
  } catch (err) {
    console.error("[uploadValidation] Falha ao baixar bytes do blob pra verificação:", err);
    return false;
  }
}
