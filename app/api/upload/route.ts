import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { NextResponse } from "next/server";
import { getCurrentAdmin, getCurrentAuthor } from "@/lib/auth";
import { magicBytesConferem } from "@/lib/uploadValidation";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const [author, admin] = await Promise.all([getCurrentAuthor(), getCurrentAdmin()]);
        if (!author && !admin) {
          throw new Error("Não autorizado.");
        }
        if (pathname.startsWith("videos/")) {
          return {
            allowedContentTypes: ["video/mp4", "video/webm", "video/quicktime"],
            maximumSizeInBytes: 25 * 1024 * 1024,
            addRandomSuffix: true,
          };
        }
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // O Content-Type declarado no upload é só o que o navegador informou — fácil de
        // forjar. Aqui a gente confere os bytes reais do arquivo já salvo e remove o blob
        // se não baterem (ex: alguém renomeou um arquivo malicioso pra passar como imagem).
        const valido = await magicBytesConferem(blob.url, blob.contentType);
        if (!valido) {
          console.error("[upload] Conteúdo do arquivo não bate com o tipo declarado, removendo:", blob.url, blob.contentType);
          await del(blob.url).catch((err) => console.error("[upload] Falha ao remover blob inválido:", err));
        }
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload falhou." },
      { status: 400 }
    );
  }
}
