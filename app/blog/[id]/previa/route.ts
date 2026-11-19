import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/db";
import { urlPreviaBlog, versaoPreviaBlog } from "@/lib/previaBlog";

// Imagem de prévia do artigo (1200x630): é o que aparece quando o link /blog/código é colado no
// WhatsApp, Instagram, Facebook, X etc. Usa a imagem de destaque do artigo, inteira e sem corte
// (as imagens têm proporções variadas), sobre um fundo desfocado da própria imagem. Sai em JPEG
// leve, porque o WhatsApp ignora prévias muito pesadas. O endereço leva ?v=<versão da imagem>, então
// a imagem pode ficar em cache pra sempre e, se a imagem de destaque mudar, o endereço muda.

export const maxDuration = 30;

const LARGURA = 1200;
const ALTURA = 630;

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const artigo = await prisma.article.findUnique({ where: { id }, select: { capaUrl: true } });
  if (!artigo) return new Response("Artigo não encontrado", { status: 404 });

  // Sem imagem de destaque, usa a prévia padrão do site.
  if (!artigo.capaUrl) {
    return NextResponse.redirect(new URL("/og-default.jpg", request.url), { status: 302, headers: { "Cache-Control": "public, max-age=300" } });
  }

  // Só gera (e guarda em cache) a versão correta. Qualquer outro ?v= é redirecionado, pra ninguém
  // conseguir forçar a geração de infinitas imagens trocando o parâmetro.
  const v = new URL(request.url).searchParams.get("v");
  if (v !== versaoPreviaBlog(artigo.capaUrl)) {
    return NextResponse.redirect(new URL(urlPreviaBlog(id, artigo.capaUrl) as string, request.url), {
      status: 307,
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  try {
    const u = new URL(artigo.capaUrl);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".public.blob.vercel-storage.com")) throw new Error("Endereço de imagem não permitido");
    const res = await fetch(u, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`Imagem respondeu ${res.status}`);
    const original = Buffer.from(await res.arrayBuffer());
    if (original.length > 25 * 1024 * 1024) throw new Error("Imagem grande demais");

    const base = sharp(original).rotate().flatten({ background: "#ffffff" });
    const fundo = await base.clone().resize(LARGURA, ALTURA, { fit: "cover" }).blur(30).modulate({ brightness: 0.75 }).jpeg({ quality: 70 }).toBuffer();
    const frente = await base.clone().resize(LARGURA, ALTURA, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
    const jpeg = await sharp(fundo)
      .composite([{ input: frente, gravity: "center" }])
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[previa-blog] Falha ao gerar a imagem do artigo:", id, err);
    return NextResponse.redirect(new URL("/og-default.jpg", request.url), { status: 302, headers: { "Cache-Control": "no-store" } });
  }
}
