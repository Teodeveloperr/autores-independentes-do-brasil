import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentAdmin, getCurrentAuthor } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const [author, admin] = await Promise.all([getCurrentAuthor(), getCurrentAdmin()]);
        if (!author && !admin) {
          throw new Error("Não autorizado.");
        }
        return {
          allowedContentTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
          maximumSizeInBytes: 5 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      onUploadCompleted: async () => {
        // A URL final do blob é devolvida ao cliente e persistida por uma Server Action
        // específica (perfil, livro, evento, foto etc.) — nada a fazer aqui.
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
