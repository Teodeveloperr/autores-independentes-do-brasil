"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAuthor } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendPedidoImpressaoAutorEmail, sendPedidoImpressaoEquipeEmail } from "@/lib/email";
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
    acabamentos: Array.isArray(especificacoes.acabamentos) ? [...new Set(especificacoes.acabamentos.map(String))] : [],
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
      acabamentos: dados.acabamentos,
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
    ["Acabamentos e extras", pedido.acabamentos.length ? pedido.acabamentos.join(", ") : "Nenhum"],
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
