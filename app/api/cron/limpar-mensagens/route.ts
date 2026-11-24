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

  // Dados temporários que só crescem: tentativas do limitador de envios (a janela mais longa do sistema é de 24 h; só
  // se apagam sozinhas por chave, então sobrariam para sempre) e códigos de recuperação de senha já usados ou vencidos.
  let limitadorLimpo = 0;
  let codigosSenhaLimpos = 0;
  try {
    const umDia = 24 * 60 * 60 * 1000;
    limitadorLimpo = (await prisma.rateLimitAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 2 * umDia) } } })).count;
    codigosSenhaLimpos = (
      await prisma.passwordResetToken.deleteMany({ where: { OR: [{ expiresAt: { lt: new Date(Date.now() - umDia) } }, { usedAt: { not: null } }] } })
    ).count;
  } catch (err) {
    console.error("[cron] Falha ao limpar dados temporários:", err);
  }

  // Arquivos das inscrições do prêmio: apagados 7 dias depois do envio (ou da confirmação do pagamento, no cartão);
  // os dados da inscrição ficam no banco.
  let premioArquivosApagados = 0;
  try {
    premioArquivosApagados = await limparArquivosPremio();
  } catch (err) {
    console.error("[cron] Falha ao limpar os arquivos do prêmio:", err);
  }

  return NextResponse.json({ deleted: result.count, limitadorLimpo, codigosSenhaLimpos, premioArquivosApagados });
}
