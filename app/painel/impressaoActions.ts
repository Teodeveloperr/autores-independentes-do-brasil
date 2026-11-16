"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAuthor } from "@/lib/auth";
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
  numeroDoPedidoImpressao,
  prefixoImpressao,
  tamanhoLegivel,
  validarEspecificacoes,
  type EspecificacoesImpressao,
} from "@/lib/impressao";
import { checkRateLimit } from "@/lib/rateLimit";

// Pedido de impressão de livro feito no painel. Os PDFs já subiram direto do navegador para o
// armazenamento privado (rota /api/painel/impressao/upload); aqui o servidor confere tudo de novo,
// grava o pedido e avisa a equipe por e-mail, com os links para baixar os arquivos.

export async function enviarPedidoImpressao(
  especificacoes: EspecificacoesImpressao,
  arquivos: { pasta: string; capaNome: string; mioloNome: string }
): Promise<{ error?: string; numero?: string }> {
  const author = await requireAuthor();
  if (author.status !== "ativo") return { error: "Sua conta precisa estar ativa para pedir impressão." };

  const permitido = await checkRateLimit(`impressao-pedido:${author.id}`, 6, 60);
  if (!permitido) return { error: "Muitos pedidos em pouco tempo. Aguarde alguns minutos." };

  const dados: EspecificacoesImpressao = {
    ...especificacoes,
    titulo: String(especificacoes.titulo ?? "").trim(),
    observacoes: String(especificacoes.observacoes ?? "").trim(),
    paginas: Number(especificacoes.paginas),
    tiragem: Number(especificacoes.tiragem),
    temIsbn: !!especificacoes.temIsbn,
    orelhas: !!especificacoes.orelhas,
  };
  const erro = validarEspecificacoes(dados);
  if (erro) return { error: erro };

  if (!/^[a-f0-9]{32}$/.test(arquivos.pasta)) return { error: "Envio inválido. Escolha os arquivos novamente." };
  const capaPath = `${prefixoImpressao(author.id, arquivos.pasta)}capa.pdf`;
  const mioloPath = `${prefixoImpressao(author.id, arquivos.pasta)}miolo.pdf`;

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
      authorId: author.id,
      titulo: dados.titulo,
      formato: dados.formato,
      paginas: dados.paginas,
      tiragem: dados.tiragem,
      temIsbn: dados.temIsbn,
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
    ["Tem ISBN", pedido.temIsbn ? "Sim" : "Não"],
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
      autorNome: author.nome,
      autorEmail: author.email,
      autorTelefone: null,
      especificacoes: linhas,
      observacoes: pedido.observacoes,
      capa: { nome: pedido.capaNome, tamanho: tamanhoLegivel(pedido.capaBytes), url: link("capa") },
      miolo: { nome: pedido.mioloNome, tamanho: tamanhoLegivel(pedido.mioloBytes), url: link("miolo") },
    });
  } catch (err) {
    // Sem o aviso a equipe não saberia do pedido: desfaz e deixa o autor tentar de novo (os arquivos ficam).
    console.error("[impressao] Falha ao avisar a equipe do pedido", numeroTexto, err);
    await prisma.pedidoImpressao.delete({ where: { id: pedido.id } }).catch(() => undefined);
    return { error: "Não foi possível enviar o pedido agora. Tente de novo em instantes." };
  }

  await sendPedidoImpressaoAutorEmail(author.email, { numeroTexto, autorNome: author.nome, especificacoes: linhas }).catch((err) =>
    console.error("[impressao] Falha ao enviar a confirmação ao autor:", err)
  );

  revalidatePath("/painel");
  return { numero: numeroTexto };
}

/**
 * "Receber esse orçamento em meu e-mail": o autor informa os contatos e a equipe recebe a
 * configuração que ele montou na tela, sem arquivos e sem criar pedido.
 */
export async function solicitarOrcamentoImpressao(
  contato: { nome: string; email: string; telefone: string; projeto: string },
  especificacoes: Partial<EspecificacoesImpressao>
): Promise<{ error?: string; ok?: boolean }> {
  const author = await requireAuthor();

  const nome = String(contato.nome ?? "").trim();
  const email = String(contato.email ?? "").trim();
  const telefone = String(contato.telefone ?? "").trim();
  const projeto = String(contato.projeto ?? "").trim();
  if (nome.length < 2 || nome.length > 120) return { error: "Informe o seu nome." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { error: "Informe um e-mail válido." };
  const digitos = telefone.replace(/\D/g, "");
  if (digitos.length < 10 || digitos.length > 13 || telefone.length > 30) return { error: "Informe um telefone com DDD." };
  if (projeto.length < 2 || projeto.length > 200) return { error: "Informe o nome do projeto." };

  const permitido = await checkRateLimit(`impressao-orcamento:${author.id}`, 5, 60);
  if (!permitido) return { error: "Muitos pedidos em pouco tempo. Aguarde alguns minutos." };

  const texto = (v: unknown, padrao = "A definir") => String(v ?? "").trim().slice(0, 200) || padrao;
  const numero = (v: unknown, sufixo = "") => (Number(v) > 0 ? `${Math.floor(Number(v))}${sufixo}` : "A definir");
  const e = especificacoes ?? {};
  const linhas: Array<[string, string]> = [
    ["Título do livro", texto(e.titulo)],
    ["Formato", texto(e.formato)],
    ["Número de páginas", numero(e.paginas)],
    ["Tiragem", numero(e.tiragem, " exemplares")],
    ["Tem ISBN", e.temIsbn ? "Sim" : "Não"],
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
