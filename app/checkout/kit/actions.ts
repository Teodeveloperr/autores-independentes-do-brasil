"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { getCurrentAuthor } from "@/lib/auth";
import { criarOuBuscarCliente, criarCobranca, criarCobrancaParcelada } from "@/lib/asaas";
import { validarCpf } from "@/lib/cpf";
import { emailSchema } from "@/lib/validation";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verificarTurnstile } from "@/lib/turnstile";
import { MAX_PARCELAS_KIT, kitPorId, resumoDoKit } from "@/lib/kits";

export type CriarPedidoKitResult = { invoiceUrl: string } | { error: string };

/**
 * Checkout dos kits da Bienal (sem login): cria o pedido e a cobrança na Asaas e devolve o link do
 * pagamento. O valor sai da tabela em lib/kits.ts; do navegador vêm só o kit e o número de parcelas.
 * 1 parcela = à vista (Pix, cartão ou boleto, a pessoa escolhe na Asaas); 2 parcelas = cartão, sem juros.
 */
export async function criarPedidoKit(
  kitId: string,
  comprador: { nome: string; email: string; telefone: string; cpf: string },
  parcelas: number,
  turnstileToken: string | null
): Promise<CriarPedidoKitResult> {
  // Sempre retorna { error } em vez de lançar: erros lançados em Server Actions são redigidos em produção.
  const kit = kitPorId(kitId);
  if (!kit) return { error: "Kit não encontrado." };
  if (!Number.isInteger(parcelas) || parcelas < 1 || parcelas > MAX_PARCELAS_KIT) return { error: "Escolha a forma de pagamento." };

  const nome = String(comprador.nome ?? "").trim();
  const telefone = String(comprador.telefone ?? "").trim();
  if (nome.length < 3 || nome.length > 120) return { error: "Informe o nome completo." };
  const email = emailSchema.safeParse(String(comprador.email ?? "").trim().slice(0, 160));
  if (!email.success) return { error: "Informe um e-mail válido." };
  const digitosTelefone = telefone.replace(/\D/g, "");
  if (digitosTelefone.length < 10 || digitosTelefone.length > 11) return { error: "Informe um telefone com DDD." };
  if (!validarCpf(comprador.cpf)) return { error: "CPF inválido." };
  const cpf = comprador.cpf.replace(/\D/g, "");

  if (!(await verificarTurnstile(turnstileToken))) {
    return { error: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." };
  }
  const permitido =
    (await checkRateLimit(`kit-pedido-ip:${await getClientIp()}`, 8, 60)) && (await checkRateLimit(`kit-pedido-email:${email.data as string}`, 5, 60));
  if (!permitido) return { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };

  const token = crypto.randomBytes(24).toString("base64url");
  // Se quem compra está logado como autor, o painel dele passa a avisar do kit pendente de envio.
  const autor = await getCurrentAuthor();
  const pedido = await prisma.pedidoKit.create({
    data: { token, authorId: autor?.id ?? null, kit: kit.id, valorCentavos: kit.valorCentavos, parcelas, nome, email: email.data as string, telefone, cpf },
  });

  const desfazer = async (mensagem: string): Promise<CriarPedidoKitResult> => {
    await prisma.pedidoKit.delete({ where: { id: pedido.id } }).catch(() => undefined);
    return { error: mensagem };
  };

  const customerId = await criarOuBuscarCliente({ nome, cpf, email: email.data as string, telefone });
  if (!customerId) return desfazer("Não foi possível iniciar o pagamento. Tente novamente em instantes.");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";
  const successUrl = `${siteUrl}/kit/obrigado?pedido=${token}`;
  const descricao = `${resumoDoKit(kit)} - Bienal do Livro Rio 2027 (pedido ${pedido.numero})`.slice(0, 500);
  const base = { customerId, description: descricao, externalReference: `kit-${pedido.id}` };

  let cobranca: { id: string; invoiceUrl: string; installment?: string } | null;
  if (parcelas > 1) {
    cobranca = await criarCobrancaParcelada({ ...base, totalValueCentavos: kit.valorCentavos, installmentCount: parcelas, successUrl });
    if (!cobranca) cobranca = await criarCobrancaParcelada({ ...base, totalValueCentavos: kit.valorCentavos, installmentCount: parcelas });
  } else {
    cobranca = await criarCobranca({ ...base, valueCentavos: kit.valorCentavos, successUrl });
    // Se a Asaas recusar o endereço de retorno, cria sem ele.
    if (!cobranca) cobranca = await criarCobranca({ ...base, valueCentavos: kit.valorCentavos });
  }
  if (!cobranca) return desfazer("Não foi possível iniciar o pagamento. Tente novamente em instantes.");

  await prisma.pedidoKit.update({
    where: { id: pedido.id },
    data: { asaasCustomerId: customerId, asaasPaymentId: cobranca.id, asaasInstallmentId: cobranca.installment ?? null, asaasInvoiceUrl: cobranca.invoiceUrl },
  });

  return { invoiceUrl: cobranca.invoiceUrl };
}
