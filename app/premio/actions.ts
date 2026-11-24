"use server";

import crypto from "node:crypto";
import { prisma } from "@/lib/db";
import { criarCobrancaContrato, criarOuBuscarCliente } from "@/lib/asaas";
import { validarCpf } from "@/lib/cpf";
import { sendInscricaoPremioEquipeEmail, sendInscricaoPremioParticipanteEmail } from "@/lib/email";
import { tamanhoArquivoPrivado } from "@/lib/ebookStorage";
import { criarSessaoEnvioPublico, sessaoEnvioPublicoValida, type SessaoEnvioPublico } from "@/lib/impressaoPublico";
import {
  PREMIO_ARQUIVOS,
  PREMIO_EMAIL_COPIA,
  PREMIO_EMAIL_PADRAO,
  PREMIO_VALOR_CENTAVOS,
  arquivosDaForma,
  extensaoDoArquivo,
  prefixoPremio,
  validarArquivoPremio,
  validarDadosPremio,
  type ArquivoPremio,
  type DadosInscricaoPremio,
  type FormaPagamentoPremio,
} from "@/lib/premio";
import { linkArquivoPremio } from "@/lib/premioLinks";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { verificarTurnstile } from "@/lib/turnstile";

function tamanhoLegivel(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Passo 1: confere o anti-robô e entrega a pasta de envio assinada e com validade. */
export async function iniciarEnvioPremio(turnstileToken: string | null): Promise<{ error?: string; sessao?: SessaoEnvioPublico }> {
  if (!(await verificarTurnstile(turnstileToken))) {
    return { error: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." };
  }
  const permitido = await checkRateLimit(`premio-sessao-ip:${await getClientIp()}`, 10, 60);
  if (!permitido) return { error: "Muitos envios em pouco tempo. Aguarde um pouco e tente de novo." };
  return { sessao: criarSessaoEnvioPublico() };
}

/**
 * Passo 2: com os arquivos já enviados, confere tudo.
 * - "comprovante" (Pix direto para o Instituto): manda a inscrição por e-mail à organização, como sempre.
 * - "cartao" (cartão de crédito à vista pela plataforma): guarda a inscrição como "aguardando pagamento" e devolve
 *   o link de pagamento da Asaas. A organização só recebe o e-mail quando o webhook confirmar o pagamento
 *   (lib/premioPagamento.ts), e a pessoa não envia comprovante.
 */
export async function enviarInscricaoPremio(
  dados: DadosInscricaoPremio,
  sessao: SessaoEnvioPublico,
  nomes: Partial<Record<ArquivoPremio, string>>,
  pagamento: { forma: FormaPagamentoPremio; cpf?: string }
): Promise<{ error?: string; ok?: boolean; pagamentoUrl?: string }> {
  if (!sessaoEnvioPublicoValida(sessao)) return { error: "O envio expirou. Recarregue a página e envie os arquivos de novo." };

  const forma: FormaPagamentoPremio = pagamento?.forma === "cartao" ? "cartao" : "comprovante";

  const erroDados = validarDadosPremio(dados);
  if (erroDados) return { error: erroDados };

  let cpf = "";
  if (forma === "cartao") {
    cpf = String(pagamento.cpf ?? "").replace(/\D/g, "");
    if (!validarCpf(cpf)) return { error: "Informe um CPF válido para o pagamento." };
  }

  const email = String(dados.email).trim();
  const permitido =
    (await checkRateLimit(`premio-inscricao-ip:${await getClientIp()}`, 8, 60)) &&
    (await checkRateLimit(`premio-inscricao-email:${email.toLowerCase()}`, 6, 24 * 60));
  if (!permitido) return { error: "Muitas inscrições em pouco tempo. Aguarde um pouco e tente de novo." };

  const arquivos: Array<{ rotulo: string; nomeOriginal: string; tamanho: string; url: string }> = [];
  const nomesOk: Partial<Record<ArquivoPremio, string>> = {};
  for (const tipo of arquivosDaForma(forma)) {
    const nome = String(nomes?.[tipo] ?? "");
    const ext = extensaoDoArquivo(nome);
    if (!ext || !PREMIO_ARQUIVOS[tipo].extensoes.includes(ext)) return { error: `${PREMIO_ARQUIVOS[tipo].rotulo}: formato não aceito.` };
    const caminho = `${prefixoPremio(sessao.pasta)}${tipo}.${ext}`;
    const bytes = await tamanhoArquivoPrivado(caminho);
    if (bytes == null) return { error: `${PREMIO_ARQUIVOS[tipo].rotulo}: o envio não chegou completo. Envie de novo.` };
    const erro = validarArquivoPremio(tipo, nome, bytes);
    if (erro) return { error: erro };
    nomesOk[tipo] = nome.slice(0, 200);
    arquivos.push({ rotulo: PREMIO_ARQUIVOS[tipo].rotulo, nomeOriginal: nome.slice(0, 200), tamanho: tamanhoLegivel(bytes), url: linkArquivoPremio(caminho) });
  }

  const limpo = {
    nome: dados.nome.trim(),
    nomeArtistico: dados.nomeArtistico.trim(),
    telefone: dados.telefone.trim(),
    email,
    titulo: dados.titulo.trim(),
    categoria: dados.categoria,
  };
  const registro = { ...limpo, telefone: limpo.telefone.slice(0, 30), pasta: sessao.pasta, nomesArquivos: JSON.stringify(nomesOk) };

  if (forma === "cartao") return iniciarPagamentoCartao(registro, cpf);

  try {
    await sendInscricaoPremioEquipeEmail({
      destino: process.env.PREMIO_EMAIL_DESTINO || PREMIO_EMAIL_PADRAO,
      copia: process.env.PREMIO_EMAIL_COPIA || PREMIO_EMAIL_COPIA,
      ...limpo,
      arquivos,
      pagamento: { forma: "comprovante" },
    });
  } catch (err) {
    console.error("[premio] Falha ao enviar a inscrição por e-mail:", err);
    return { error: "Não conseguimos enviar a inscrição agora. Tente de novo em alguns minutos." };
  }
  // Registro para o contador do painel admin. Se falhar, a inscrição já foi entregue por e-mail:
  // só registramos o erro no log, sem avisar o participante de um problema que não é dele.
  try {
    await prisma.inscricaoPremio.create({ data: registro });
  } catch (err) {
    console.error("[premio] Falha ao registrar a inscrição no banco:", err);
  }
  try {
    await sendInscricaoPremioParticipanteEmail(email, { nome: limpo.nome, titulo: limpo.titulo, categoria: limpo.categoria });
  } catch (err) {
    console.error("[premio] Falha ao enviar a confirmação ao participante:", err);
  }
  return { ok: true };
}

/** Telefone para a Asaas: só DDD + número (10 ou 11 dígitos), sem o 55 do país; fora disso não envia. */
function telefoneParaAsaas(telefone: string): string | undefined {
  let d = telefone.replace(/\D/g, "");
  if ((d.length === 12 || d.length === 13) && d.startsWith("55")) d = d.slice(2);
  return d.length === 10 || d.length === 11 ? d : undefined;
}

/** Cria a inscrição "aguardando pagamento" e a cobrança de cartão à vista na Asaas; devolve a página de pagamento. */
async function iniciarPagamentoCartao(
  registro: { nome: string; nomeArtistico: string; telefone: string; email: string; titulo: string; categoria: string; pasta: string; nomesArquivos: string },
  cpf: string
): Promise<{ error?: string; ok?: boolean; pagamentoUrl?: string }> {
  const token = crypto.randomBytes(24).toString("base64url");
  let inscricao;
  try {
    inscricao = await prisma.inscricaoPremio.create({
      data: { ...registro, formaPagamento: "cartao", pagamentoStatus: "aguardando", token, valorCentavos: PREMIO_VALOR_CENTAVOS },
    });
  } catch (err) {
    console.error("[premio] Falha ao criar a inscrição para pagamento:", err);
    return { error: "Esta inscrição já foi iniciada. Se a página de pagamento não abriu, recarregue a página e envie de novo." };
  }

  const desfazer = async (mensagem: string) => {
    await prisma.inscricaoPremio.delete({ where: { id: inscricao.id } }).catch(() => undefined);
    return { error: mensagem };
  };

  const customerId = await criarOuBuscarCliente({ nome: registro.nome, cpf, email: registro.email, telefone: telefoneParaAsaas(registro.telefone) });
  if (!customerId) return desfazer("Não foi possível iniciar o pagamento. Tente novamente em instantes.");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";
  const successUrl = `${siteUrl}/premio/obrigado?i=${token}`;
  const base = {
    customerId,
    valueCentavos: PREMIO_VALOR_CENTAVOS,
    billingType: "CREDIT_CARD" as const,
    description: `Taxa de inscrição - 1º Prêmio Literário Autores do Brasil 2027 - ${registro.categoria}`.slice(0, 500),
    externalReference: `premio-${inscricao.id}`,
  };
  let cobranca = await criarCobrancaContrato({ ...base, successUrl });
  // Se a Asaas recusar o endereço de retorno, cria sem ele.
  if (!cobranca) cobranca = await criarCobrancaContrato({ ...base, successUrl: "" });
  if (!cobranca) return desfazer("Não foi possível iniciar o pagamento. Tente novamente em instantes.");

  await prisma.inscricaoPremio.update({ where: { id: inscricao.id }, data: { asaasPaymentId: cobranca.id, asaasInvoiceUrl: cobranca.invoiceUrl } });
  return { ok: true, pagamentoUrl: cobranca.invoiceUrl };
}
