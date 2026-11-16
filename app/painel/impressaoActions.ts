"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { getCurrentAuthor, requireAuthor } from "@/lib/auth";
import { verificarTurnstile } from "@/lib/turnstile";
import { prisma } from "@/lib/db";
import {
  sendOrcamentoImpressaoAutorEmail,
  sendOrcamentoImpressaoEquipeEmail,
  sendPedidoImpressaoAutorEmail,
  sendPedidoImpressaoEquipeEmail,
} from "@/lib/email";
import { apagarArquivosPrivados, arquivoPrivadoEhPdf, tamanhoArquivoPrivado } from "@/lib/ebookStorage";
import {
  IMPRESSAO_MAX_CAPA_BYTES,
  IMPRESSAO_MAX_MIOLO_BYTES,
  isbnLegivel,
  normalizarIsbn,
  numeroDoPedidoImpressao,
  prefixoImpressao,
  tamanhoLegivel,
  validarEspecificacoes,
  type EspecificacoesImpressao,
} from "@/lib/impressao";
import { PASTA_PUBLICA, criarSessaoEnvioPublico, sessaoEnvioPublicoValida, type SessaoEnvioPublico } from "@/lib/impressaoPublico";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";

// Pedido de impressão de livro. Os PDFs já subiram direto do navegador para o armazenamento privado
// (rota /api/painel/impressao/upload); aqui o servidor confere tudo de novo, grava o pedido e avisa a
// equipe por e-mail, com os links para baixar os arquivos. Serve ao autor logado (painel) e a quem
// não tem conta (página pública /imprimir).

type Remetente = { authorId: string | null; nome: string; email: string; telefone: string | null };
type Arquivos = { pasta: string; capaNome: string; mioloNome: string };

function limparEspecificacoes(especificacoes: EspecificacoesImpressao): EspecificacoesImpressao {
  const temIsbn = !!especificacoes.temIsbn;
  return {
    ...especificacoes,
    titulo: String(especificacoes.titulo ?? "").trim(),
    observacoes: String(especificacoes.observacoes ?? "").trim(),
    paginas: Number(especificacoes.paginas),
    tiragem: Number(especificacoes.tiragem),
    temIsbn,
    isbn: temIsbn ? normalizarIsbn(especificacoes.isbn) : "",
    orelhas: !!especificacoes.orelhas,
  };
}

/** Confere os arquivos enviados, grava o pedido e avisa a equipe e o solicitante. `dono` é a pasta do envio: id do autor ou "publico". */
async function registrarPedido(remetente: Remetente, dono: string, dados: EspecificacoesImpressao, arquivos: Arquivos): Promise<{ error?: string; numero?: string }> {
  const capaPath = `${prefixoImpressao(dono, arquivos.pasta)}capa.pdf`;
  const mioloPath = `${prefixoImpressao(dono, arquivos.pasta)}miolo.pdf`;

  const jaExiste = await prisma.pedidoImpressao.findFirst({ where: { capaPath }, select: { numero: true } });
  if (jaExiste) return { numero: numeroDoPedidoImpressao(jaExiste.numero) };

  let capaBytes: number | null;
  let mioloBytes: number | null;
  try {
    [capaBytes, mioloBytes] = await Promise.all([tamanhoArquivoPrivado(capaPath), tamanhoArquivoPrivado(mioloPath)]);
    if (!capaBytes || !mioloBytes) return { error: "Não encontramos os arquivos enviados. Envie a capa e o miolo novamente." };
    if (capaBytes > IMPRESSAO_MAX_CAPA_BYTES || mioloBytes > IMPRESSAO_MAX_MIOLO_BYTES) {
      await apagarArquivosPrivados([capaPath, mioloPath]).catch(() => undefined);
      return { error: "Um dos arquivos passa do tamanho permitido." };
    }
    const [capaOk, mioloOk] = await Promise.all([arquivoPrivadoEhPdf(capaPath), arquivoPrivadoEhPdf(mioloPath)]);
    if (!capaOk || !mioloOk) {
      await apagarArquivosPrivados([capaPath, mioloPath]).catch(() => undefined);
      return { error: "A capa e o miolo precisam ser arquivos PDF. Envie novamente." };
    }
  } catch (err) {
    console.error("[impressao] Falha ao conferir os arquivos enviados:", err);
    return { error: "Não foi possível conferir os arquivos enviados. Tente de novo em instantes." };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const nomeSeguro = (nome: string, padrao: string) => (String(nome ?? "").trim() || padrao).slice(0, 200);

  const pedido = await prisma.pedidoImpressao.create({
    data: {
      authorId: remetente.authorId,
      contatoNome: remetente.authorId ? null : remetente.nome,
      contatoEmail: remetente.authorId ? null : remetente.email,
      contatoTelefone: remetente.authorId ? null : remetente.telefone,
      titulo: dados.titulo,
      formato: dados.formato,
      paginas: dados.paginas,
      tiragem: dados.tiragem,
      temIsbn: dados.temIsbn,
      isbn: dados.temIsbn ? dados.isbn : null,
      mioloCor: dados.mioloCor,
      mioloPapel: dados.mioloPapel,
      encadernacao: dados.encadernacao,
      capaPapel: dados.capaPapel,
      capaCor: dados.capaCor,
      laminacao: dados.laminacao,
      orelhas: dados.orelhas,
      acabamentos: [],
      observacoes: dados.observacoes || null,
      capaPath,
      capaNome: nomeSeguro(arquivos.capaNome, "capa.pdf"),
      capaBytes,
      mioloPath,
      mioloNome: nomeSeguro(arquivos.mioloNome, "miolo.pdf"),
      mioloBytes,
      tokenHash: crypto.createHash("sha256").update(token).digest("hex"),
    },
  });

  const numeroTexto = numeroDoPedidoImpressao(pedido.numero);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";
  const link = (arquivo: "capa" | "miolo") => `${siteUrl}/api/impressao/arquivo?token=${token}&arquivo=${arquivo}`;
  const linhas: Array<[string, string]> = [
    ["Título", pedido.titulo],
    ["Formato", pedido.formato],
    ["Número de páginas", String(pedido.paginas)],
    ["Tiragem", `${pedido.tiragem} exemplares`],
    ["ISBN", pedido.temIsbn ? isbnLegivel(pedido.isbn ?? "") : "O livro não tem ISBN"],
    ["Miolo: impressão", pedido.mioloCor],
    ["Miolo: papel", pedido.mioloPapel],
    ["Encadernação", pedido.encadernacao],
    ["Capa: papel", pedido.capaPapel],
    ["Capa: impressão", pedido.capaCor],
    ["Capa: laminação", pedido.laminacao],
    ["Capa: orelhas", pedido.orelhas ? "Sim" : "Não"],
  ];

  try {
    await sendPedidoImpressaoEquipeEmail({
      numeroTexto,
      autorNome: remetente.authorId ? remetente.nome : `${remetente.nome} (sem cadastro na plataforma)`,
      autorEmail: remetente.email,
      autorTelefone: remetente.telefone,
      especificacoes: linhas,
      observacoes: pedido.observacoes,
      capa: { nome: pedido.capaNome, tamanho: tamanhoLegivel(pedido.capaBytes), url: link("capa") },
      miolo: { nome: pedido.mioloNome, tamanho: tamanhoLegivel(pedido.mioloBytes), url: link("miolo") },
    });
  } catch (err) {
    // Sem o aviso a equipe não saberia do pedido: desfaz e deixa tentar de novo (os arquivos ficam).
    console.error("[impressao] Falha ao avisar a equipe do pedido", numeroTexto, err);
    await prisma.pedidoImpressao.delete({ where: { id: pedido.id } }).catch(() => undefined);
    return { error: "Não foi possível enviar o pedido agora. Tente de novo em instantes." };
  }

  await sendPedidoImpressaoAutorEmail(remetente.email, { numeroTexto, autorNome: remetente.nome, especificacoes: linhas }).catch((err) =>
    console.error("[impressao] Falha ao enviar a confirmação do pedido:", err)
  );

  return { numero: numeroTexto };
}

export async function enviarPedidoImpressao(especificacoes: EspecificacoesImpressao, arquivos: Arquivos): Promise<{ error?: string; numero?: string }> {
  const author = await requireAuthor();
  if (author.status !== "ativo") return { error: "Sua conta precisa estar ativa para pedir impressão." };

  const permitido = await checkRateLimit(`impressao-pedido:${author.id}`, 6, 60);
  if (!permitido) return { error: "Muitos pedidos em pouco tempo. Aguarde alguns minutos." };

  const dados = limparEspecificacoes(especificacoes);
  const erro = validarEspecificacoes(dados);
  if (erro) return { error: erro };

  if (!/^[a-f0-9]{32}$/.test(arquivos.pasta)) return { error: "Envio inválido. Escolha os arquivos novamente." };

  const r = await registrarPedido({ authorId: author.id, nome: author.nome, email: author.email, telefone: null }, author.id, dados, arquivos);
  if (r.numero) revalidatePath("/painel");
  return r;
}

type ContatoPublico = { nome: string; email: string; telefone: string };

/** Confere nome, e-mail e telefone de quem pede sem ter conta. Devolve a mensagem do problema, ou null. */
function validarContato(c: ContatoPublico): string | null {
  const nome = String(c.nome ?? "").trim();
  const email = String(c.email ?? "").trim();
  const telefone = String(c.telefone ?? "").trim();
  if (nome.length < 2 || nome.length > 120) return "Informe o seu nome.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return "Informe um e-mail válido.";
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13 || telefone.length > 30) return "Informe um telefone com DDD.";
  return null;
}

/**
 * Página pública /imprimir, passo 1: confere o anti-robô e entrega a "sessão de envio" (pasta
 * assinada e com validade) que libera o upload dos PDFs. Quem já tem conta não precisa disto.
 */
export async function iniciarEnvioImpressaoPublico(turnstileToken: string | null): Promise<{ error?: string; sessao?: SessaoEnvioPublico }> {
  if (!(await verificarTurnstile(turnstileToken))) {
    return { error: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." };
  }
  const permitido = await checkRateLimit(`impressao-sessao-ip:${await getClientIp()}`, 10, 60);
  if (!permitido) return { error: "Muitos envios em pouco tempo. Aguarde um pouco e tente de novo." };
  return { sessao: criarSessaoEnvioPublico() };
}

/** Página pública /imprimir, passo 2: cria o pedido com os arquivos já enviados, para quem não tem conta. */
export async function enviarPedidoImpressaoPublico(
  especificacoes: EspecificacoesImpressao,
  contato: ContatoPublico,
  arquivos: { sessao: SessaoEnvioPublico; capaNome: string; mioloNome: string }
): Promise<{ error?: string; numero?: string }> {
  if (!sessaoEnvioPublicoValida(arquivos.sessao)) return { error: "O envio expirou. Recarregue a página e envie os arquivos de novo." };

  const erroContato = validarContato(contato);
  if (erroContato) return { error: erroContato };

  const email = String(contato.email).trim();
  const permitido =
    (await checkRateLimit(`impressao-pedido-ip:${await getClientIp()}`, 6, 60)) &&
    (await checkRateLimit(`impressao-pedido-email:${email.toLowerCase()}`, 4, 24 * 60));
  if (!permitido) return { error: "Muitos pedidos em pouco tempo. Aguarde um pouco e tente de novo." };

  const dados = limparEspecificacoes(especificacoes);
  const erro = validarEspecificacoes(dados);
  if (erro) return { error: erro };

  return registrarPedido(
    { authorId: null, nome: String(contato.nome).trim(), email, telefone: String(contato.telefone).trim() },
    PASTA_PUBLICA,
    dados,
    { pasta: arquivos.sessao.pasta, capaNome: arquivos.capaNome, mioloNome: arquivos.mioloNome }
  );
}


/**
 * "Receber esse orçamento em meu e-mail": o autor informa os contatos e a equipe recebe a
 * configuração que ele montou na tela, sem arquivos e sem criar pedido.
 */
export async function solicitarOrcamentoImpressao(
  contato: { nome: string; email: string; telefone: string; projeto: string },
  especificacoes: Partial<EspecificacoesImpressao>,
  turnstileToken?: string | null
): Promise<{ error?: string; ok?: boolean }> {
  // Também atende a página pública /imprimir (sem cadastro): aí vale o anti-robô e o limite por IP.
  const author = await getCurrentAuthor();

  const nome = String(contato.nome ?? "").trim();
  const email = String(contato.email ?? "").trim();
  const telefone = String(contato.telefone ?? "").trim();
  const projeto = String(contato.projeto ?? "").trim();
  if (nome.length < 2 || nome.length > 120) return { error: "Informe o seu nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { error: "Informe um e-mail válido." };
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13 || telefone.length > 30) return { error: "Informe um telefone com DDD." };
  if (projeto.length < 2 || projeto.length > 200) return { error: "Informe o nome do projeto." };

  if (!author && !(await verificarTurnstile(turnstileToken ?? null))) {
    return { error: "Não conseguimos confirmar que você não é um robô. Recarregue a página e tente de novo." };
  }
  const chaveLimite = author ? `impressao-orcamento:${author.id}` : `impressao-orcamento-ip:${await getClientIp()}`;
  const permitido =
    (await checkRateLimit(chaveLimite, 5, 60)) && (await checkRateLimit(`impressao-orcamento-email:${email.toLowerCase()}`, 3, 24 * 60));
  if (!permitido) return { error: "Muitos pedidos em pouco tempo. Aguarde um pouco e tente de novo." };

  const texto = (v: unknown, padrao = "A definir") => String(v ?? "").trim().slice(0, 200) || padrao;
  const numero = (v: unknown, sufixo = "") => (Number(v) > 0 ? `${Math.floor(Number(v))}${sufixo}` : "A definir");
  const e = especificacoes ?? {};
  const linhas: Array<[string, string]> = [
    ["Título do livro", texto(e.titulo)],
    ["Formato", texto(e.formato)],
    ["Número de páginas", numero(e.paginas)],
    ["Tiragem", numero(e.tiragem, " exemplares")],
    ["ISBN", e.temIsbn ? isbnLegivel(String(e.isbn ?? "")) || "Tem, número não informado" : "O livro não tem ISBN"],
    ["Miolo: impressão", texto(e.mioloCor)],
    ["Miolo: papel", texto(e.mioloPapel)],
    ["Encadernação", texto(e.encadernacao)],
    ["Capa: papel", texto(e.capaPapel)],
    ["Capa: impressão", texto(e.capaCor)],
    ["Capa: laminação", texto(e.laminacao)],
    ["Capa: orelhas", e.orelhas ? "Sim" : "Não"],
  ];
  const observacoes = String(e.observacoes ?? "").trim().slice(0, 2000);
  if (observacoes) linhas.push(["Observações", observacoes]);

  try {
    await sendOrcamentoImpressaoEquipeEmail({ nome, email, telefone, projeto, especificacoes: linhas });
  } catch (err) {
    console.error("[impressao] Falha ao enviar o pedido de orçamento:", err);
    return { error: "Não foi possível enviar agora. Tente de novo em instantes." };
  }
  await sendOrcamentoImpressaoAutorEmail(email, { nome, projeto, especificacoes: linhas }).catch((err) =>
    console.error("[impressao] Falha ao enviar a confirmação do orçamento:", err)
  );
  return { ok: true };
}
