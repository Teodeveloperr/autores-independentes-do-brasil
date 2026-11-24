import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { limparArquivosPremio } from "@/lib/premioPagamento";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await prisma.conversation.deleteMany({
    where: { createdAt: { lt: seteDiasAtras } },
  });

  // Arquivos das inscrições do prêmio: apagados 7 dias depois do envio (ou da confirmação do pagamento, no cartão);
  // os dados da inscrição ficam no banco.
  let premioArquivosApagados = 0;
  try {
    premioArquivosApagados = await limparArquivosPremio();
  } catch (err) {
    console.error("[cron] Falha ao limpar os arquivos do prêmio:", err);
  }

  return NextResponse.json({ deleted: result.count, premioArquivosApagados });
}
