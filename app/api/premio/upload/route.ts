import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { tokenArmazenamentoPrivado } from "@/lib/ebookStorage";
import { sessaoEnvioPublicoValida } from "@/lib/impressaoPublico";
import { PREMIO_ARQUIVOS, prefixoPremio, tipoDaExtensao, type ArquivoPremio } from "@/lib/premio";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Autoriza o envio dos arquivos da inscrição do prêmio direto do navegador para o armazenamento
// PRIVADO, só para a pasta da sessão de envio (assinada pelo servidor depois do anti-robô):
// premio/<pasta>/(capa|miolo|comprovante|foto).<extensão aceita>

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const resposta = await handleUpload({
      body,
      request,
      token: tokenArmazenamentoPrivado(),
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let sessao: unknown = null;
        try {
          sessao = clientPayload ? JSON.parse(clientPayload) : null;
        } catch {
          sessao = null;
        }
        if (!sessaoEnvioPublicoValida(sessao as never)) throw new Error("O envio expirou. Recarregue a página e tente de novo.");
        const { pasta } = sessao as { pasta: string };
        const m = pathname.match(/^premio\/[a-f0-9]{32}\/(capa|miolo|comprovante|foto)\.([a-z0-9]+)$/);
        if (!m || !pathname.startsWith(prefixoPremio(pasta))) throw new Error("Envio inválido.");
        const regra = PREMIO_ARQUIVOS[m[1] as ArquivoPremio];
        const tipo = tipoDaExtensao(m[2]);
        if (!regra.extensoes.includes(m[2]) || !tipo) throw new Error("Formato de arquivo não aceito.");
        const permitido = await checkRateLimit(`premio-upload-ip:${await getClientIp()}`, 30, 60);
        if (!permitido) throw new Error("Muitos envios em pouco tempo. Aguarde alguns minutos.");

        return {
          allowedContentTypes: [tipo],
          maximumSizeInBytes: regra.maxBytes,
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
