"use server";

import { prisma } from "@/lib/db";
import { sendInscricaoPremioEquipeEmail, sendInscricaoPremioParticipanteEmail } from "@/lib/email";
import { tamanhoArquivoPrivado } from "@/lib/ebookStorage";
import { criarSessaoEnvioPublico, sessaoEnvioPublicoValida, type SessaoEnvioPublico } from "@/lib/impressaoPublico";
import {
  PREMIO_ARQUIVOS,
  PREMIO_EMAIL_COPIA,
  PREMIO_EMAIL_PADRAO,
  PREMIO_ORDEM_ARQUIVOS,
  extensaoDoArquivo,
  prefixoPremio,
  validarArquivoPremio,
  validarDadosPremio,
  type ArquivoPremio,
  type DadosInscricaoPremio,
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

/** Passo 2: com os arquivos já enviados, confere tudo e manda a inscrição por e-mail à organização. */
export async function enviarInscricaoPremio(
  dados: DadosInscricaoPremio,
  sessao: SessaoEnvioPublico,
  nomes: Record<ArquivoPremio, string>
): Promise<{ error?: string; ok?: boolean }> {
  if (!sessaoEnvioPublicoValida(sessao)) return { error: "O envio expirou. Recarregue a página e envie os arquivos de novo." };

  const erroDados = validarDadosPremio(dados);
  if (erroDados) return { error: erroDados };

  const email = String(dados.email).trim();
  const permitido =
    (await checkRateLimit(`premio-inscricao-ip:${await getClientIp()}`, 8, 60)) &&
    (await checkRateLimit(`premio-inscricao-email:${email.toLowerCase()}`, 6, 24 * 60));
  if (!permitido) return { error: "Muitas inscrições em pouco tempo. Aguarde um pouco e tente de novo." };

  const arquivos: Array<{ rotulo: string; nomeOriginal: string; tamanho: string; url: string }> = [];
  for (const tipo of PREMIO_ORDEM_ARQUIVOS) {
    const nome = String(nomes?.[tipo] ?? "");
    const ext = extensaoDoArquivo(nome);
    if (!ext || !PREMIO_ARQUIVOS[tipo].extensoes.includes(ext)) return { error: `${PREMIO_ARQUIVOS[tipo].rotulo}: formato não aceito.` };
    const caminho = `${prefixoPremio(sessao.pasta)}${tipo}.${ext}`;
    const bytes = await tamanhoArquivoPrivado(caminho);
    if (bytes == null) return { error: `${PREMIO_ARQUIVOS[tipo].rotulo}: o envio não chegou completo. Envie de novo.` };
    const erro = validarArquivoPremio(tipo, nome, bytes);
    if (erro) return { error: erro };
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

  try {
    await sendInscricaoPremioEquipeEmail({ destino: process.env.PREMIO_EMAIL_DESTINO || PREMIO_EMAIL_PADRAO, copia: process.env.PREMIO_EMAIL_COPIA || PREMIO_EMAIL_COPIA, ...limpo, arquivos });
  } catch (err) {
    console.error("[premio] Falha ao enviar a inscrição por e-mail:", err);
    return { error: "Não conseguimos enviar a inscrição agora. Tente de novo em alguns minutos." };
  }
  // Registro para o contador do painel admin. Se falhar, a inscrição já foi entregue por e-mail:
  // só registramos o erro no log, sem avisar o participante de um problema que não é dele.
  try {
    await prisma.inscricaoPremio.create({ data: { ...limpo, telefone: limpo.telefone.slice(0, 30), pasta: sessao.pasta } });
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
