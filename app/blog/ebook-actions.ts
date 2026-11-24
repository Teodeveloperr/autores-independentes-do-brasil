"use server";

import { prisma } from "@/lib/db";
import { EBOOK_GUIA, validarLeadEbook, type DadosLeadEbook } from "@/lib/ebookLead";
import { linkDownloadEbook } from "@/lib/ebookLeadLinks";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verificarTurnstile } from "@/lib/turnstile";

/** Cadastro do pop-up do blog: guarda o lead e devolve o link (com validade) para baixar o e-book. */
export async function pedirEbookGuia(
  dados: DadosLeadEbook,
  turnstileToken: string | null,
  origem: string
): Promise<{ error?: string; url?: string }> {
  const erro = validarLeadEbook(dados);
  if (erro) return { error: erro };

  if (!(await verificarTurnstile(turnstileToken))) {
    return { error: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." };
  }

  const email = String(dados.email).trim().toLowerCase();
  const permitido =
    (await checkRateLimit(`ebook-lead-ip:${await getClientIp()}`, 10, 60)) &&
    (await checkRateLimit(`ebook-lead-email:${email}`, 6, 24 * 60));
  if (!permitido) return { error: "Muitos pedidos em pouco tempo. Aguarde um pouco e tente de novo." };

  const limpo = { nome: dados.nome.trim(), whatsapp: dados.whatsapp.trim().slice(0, 30) };
  const origemLimpa = String(origem ?? "").slice(0, 120) || null;
  try {
    await prisma.leadEbook.upsert({
      where: { email_ebook: { email, ebook: EBOOK_GUIA.slug } },
      create: { ebook: EBOOK_GUIA.slug, email, ...limpo, origem: origemLimpa },
      update: { ...limpo, origem: origemLimpa, downloads: { increment: 1 }, ultimoPedidoEm: new Date() },
    });
  } catch (err) {
    console.error("[ebook-lead] Falha ao registrar o lead:", err);
    return { error: "Não conseguimos registrar o seu pedido agora. Tente de novo em alguns minutos." };
  }

  return { url: linkDownloadEbook(EBOOK_GUIA.slug) };
}
