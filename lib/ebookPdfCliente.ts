// Conversão do PDF do e-book em imagens de página, feita no NAVEGADOR do autor (só roda no cliente).
// O PDF original não sobe para o servidor: cada página é desenhada, comprimida em WebP e enviada sozinha.
import { EBOOK_MAX_PAGINAS, EBOOK_MAX_PAGINA_BYTES, EBOOK_MAX_PDF_BYTES } from "@/lib/ebook";

export type ProgressoEnvio = { fase: "lendo" | "enviando" | "finalizando"; atual: number; total: number };

export class ErroEnvioEbook extends Error {}

// Largura da imagem de cada página: boa para ler com zoom sem gerar arquivos enormes.
const LARGURA_MIN = 1000;
const LARGURA_MAX = 1600;
const ALTURA_MAX = 2600;

function paraBlob(canvas: HTMLCanvasElement, tipo: string, qualidade: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, qualidade));
}

/** WebP quando o navegador sabe gerar; JPEG nos que não sabem (o servidor converte para WebP). */
async function paginaEmImagem(canvas: HTMLCanvasElement): Promise<Blob> {
  for (const qualidade of [0.82, 0.65, 0.5]) {
    let blob = await paraBlob(canvas, "image/webp", qualidade);
    if (!blob || blob.type !== "image/webp") blob = await paraBlob(canvas, "image/jpeg", qualidade + 0.05);
    if (blob && blob.size <= EBOOK_MAX_PAGINA_BYTES) return blob;
  }
  throw new ErroEnvioEbook("Uma das páginas ficou pesada demais para ser enviada. Reduza as imagens do PDF e tente de novo.");
}

async function enviarPagina(bookId: string, versao: string, numero: number, imagem: Blob, sinal: AbortSignal): Promise<void> {
  let ultimoErro = "";
  for (let tentativa = 1; tentativa <= 3; tentativa++) {
    if (sinal.aborted) throw new ErroEnvioEbook("Envio cancelado.");
    try {
      const res = await fetch(`/api/painel/ebook/${bookId}/pagina?versao=${versao}&numero=${numero}`, {
        method: "POST",
        headers: { "Content-Type": imagem.type || "image/webp" },
        body: imagem,
        credentials: "same-origin",
        signal: sinal,
      });
      if (res.ok) return;
      const corpo = (await res.json().catch(() => null)) as { error?: string } | null;
      ultimoErro = corpo?.error ?? `Erro ${res.status} ao enviar a página ${numero}.`;
      // Erros que repetir não resolve.
      if (res.status === 401 || res.status === 404 || res.status === 413 || res.status === 415) throw new ErroEnvioEbook(ultimoErro);
    } catch (e) {
      if (e instanceof ErroEnvioEbook) throw e;
      if (sinal.aborted) throw new ErroEnvioEbook("Envio cancelado.");
      ultimoErro = "Falha de conexão ao enviar a página.";
    }
    await new Promise((r) => setTimeout(r, 600 * tentativa));
  }
  throw new ErroEnvioEbook(`${ultimoErro} (página ${numero})`);
}

/**
 * Lê o PDF, converte cada página e envia. Devolve o total de páginas enviadas. Quem chama fecha o envio
 * (finalizarEnvioEbook) depois, para a versão nova passar a valer.
 */
export async function converterEEnviarPdf(params: {
  arquivo: File;
  bookId: string;
  versao: string;
  sinal: AbortSignal;
  onProgresso: (p: ProgressoEnvio) => void;
}): Promise<number> {
  const { arquivo, bookId, versao, sinal, onProgresso } = params;
  if (arquivo.size > EBOOK_MAX_PDF_BYTES) throw new ErroEnvioEbook(`O PDF tem mais de ${Math.round(EBOOK_MAX_PDF_BYTES / 1024 / 1024)} MB.`);

  onProgresso({ fase: "lendo", atual: 0, total: 0 });
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

  let doc;
  const tarefa = pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()), verbosity: 0 });
  try {
    doc = await tarefa.promise;
  } catch (e) {
    const nome = e instanceof Error ? e.name : "";
    if (nome === "PasswordException") throw new ErroEnvioEbook("Este PDF tem senha. Remova a senha e envie de novo.");
    throw new ErroEnvioEbook("Não foi possível abrir este PDF. Confira se o arquivo não está corrompido.");
  }

  const total = doc.numPages;
  if (total < 1) throw new ErroEnvioEbook("O PDF não tem páginas.");
  if (total > EBOOK_MAX_PAGINAS) throw new ErroEnvioEbook(`O PDF tem ${total} páginas. O limite é ${EBOOK_MAX_PAGINAS}.`);

  const canvas = document.createElement("canvas");
  let envioAnterior: Promise<void> = Promise.resolve();
  try {
    for (let n = 1; n <= total; n++) {
      if (sinal.aborted) throw new ErroEnvioEbook("Envio cancelado.");
      onProgresso({ fase: "enviando", atual: n - 1, total });

      const pagina = await doc.getPage(n);
      const base = pagina.getViewport({ scale: 1 });
      let escala = Math.min(LARGURA_MAX, Math.max(LARGURA_MIN, base.width * 2)) / base.width;
      if (base.height * escala > ALTURA_MAX) escala = ALTURA_MAX / base.height;
      const viewport = pagina.getViewport({ scale: escala });
      canvas.width = Math.max(100, Math.round(viewport.width));
      canvas.height = Math.max(100, Math.round(viewport.height));

      await pagina.render({ canvas, viewport, background: "#ffffff" }).promise;
      pagina.cleanup();
      const imagem = await paginaEmImagem(canvas);

      // Enquanto esta página sobe, a próxima já está sendo desenhada.
      await envioAnterior;
      envioAnterior = enviarPagina(bookId, versao, n, imagem, sinal);
      envioAnterior.catch(() => undefined); // a falha é tratada quando a próxima volta (ou o fim) aguardar este envio
    }
    await envioAnterior;
  } catch (e) {
    await envioAnterior.catch(() => undefined);
    throw e;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
    void tarefa.destroy();
  }

  onProgresso({ fase: "finalizando", atual: total, total });
  return total;
}
