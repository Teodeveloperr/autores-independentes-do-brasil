"use client";

import { upload } from "@vercel/blob/client";
import { BYTES_PARA_RECONHECER, EXTENSAO_POR_TIPO, MENSAGEM_HEIC, MENSAGEM_NAO_IMAGEM, detectarTipoImagem, ehHeicOuAvif } from "@/lib/imagemTipo";

// Erro com mensagem pronta pra mostrar ao usuário (arquivo que não é uma imagem aceita).
export class ImagemInvalidaError extends Error {}

export async function uploadImage(file: File, folder: string) {
  // O tipo que o navegador informa vem do NOME do arquivo ("foto.png" vira image/png mesmo que o
  // conteúdo seja JPEG). Aqui lemos o conteúdo real e enviamos com o tipo e a extensão certos.
  const inicio = new Uint8Array(await file.slice(0, BYTES_PARA_RECONHECER).arrayBuffer());
  const tipo = detectarTipoImagem(inicio);
  if (!tipo) throw new ImagemInvalidaError(ehHeicOuAvif(inicio) ? MENSAGEM_HEIC : MENSAGEM_NAO_IMAGEM);

  const semExtensao = file.name.replace(/\.[^.]*$/, "");
  const safeName = semExtensao.replace(/[^a-zA-Z0-9._-]/g, "-") + EXTENSAO_POR_TIPO[tipo];
  const blob = await upload(`${folder}/${Date.now()}-${safeName}`, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    contentType: tipo,
  });
  return blob.url;
}
