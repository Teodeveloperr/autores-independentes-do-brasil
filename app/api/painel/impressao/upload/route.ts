import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getCurrentAuthor } from "@/lib/auth";
import { tokenArmazenamentoPrivado } from "@/lib/ebookStorage";
import { IMPRESSAO_MAX_CAPA_BYTES, IMPRESSAO_MAX_MIOLO_BYTES, prefixoImpressao } from "@/lib/impressao";
import { PASTA_PUBLICA, sessaoEnvioPublicoValida } from "@/lib/impressaoPublico";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Autoriza o envio dos PDFs de capa e miolo de um pedido de impressão direto do navegador para o
// armazenamento PRIVADO, só PDF e só para a pasta do envio:
// - autor logado: impressao/<authorId>/<pasta>/capa.pdf ou miolo.pdf;
// - visitante sem conta (página /imprimir): impressao/publico/<pasta>/..., só com a sessão de envio
//   assinada que o servidor entrega depois de conferir o anti-robô.
// O conteúdo é conferido de novo ao criar o pedido.

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const resposta = await handleUpload({
      body,
      request,
      token: tokenArmazenamentoPrivado(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const author = await getCurrentAuthor();

        if (author) {
          const esperado = new RegExp(`^${prefixoImpressao(author.id)}[a-f0-9]{32}/(capa|miolo)\\.pdf$`);
          if (!esperado.test(pathname)) throw new Error("Envio inválido.");
          const permitido = await checkRateLimit(`impressao-upload:${author.id}`, 40, 60);
          if (!permitido) throw new Error("Muitos envios em pouco tempo. Aguarde alguns minutos.");
        } else {
          let sessao: unknown = null;
          try {
            sessao = clientPayload ? JSON.parse(clientPayload) : null;
          } catch {
            sessao = null;
          }
          if (!sessaoEnvioPublicoValida(sessao as never)) throw new Error("O envio expirou. Recarregue a página e tente de novo.");
          const { pasta } = sessao as { pasta: string };
          const esperado = new RegExp(`^${prefixoImpressao(PASTA_PUBLICA, pasta)}(capa|miolo)\\.pdf$`);
          if (!esperado.test(pathname)) throw new Error("Envio inválido.");
          const permitido = await checkRateLimit(`impressao-upload-ip:${await getClientIp()}`, 20, 60);
          if (!permitido) throw new Error("Muitos envios em pouco tempo. Aguarde alguns minutos.");
        }

        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: pathname.endsWith("/capa.pdf") ? IMPRESSAO_MAX_CAPA_BYTES : IMPRESSAO_MAX_MIOLO_BYTES,
          addRandomSuffix: false,
          allowOverwrite: true,
        };
      },
    });
    return NextResponse.json(resposta);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Envio falhou." }, { status: 400 });
  }
}
