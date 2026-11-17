import "server-only";
import crypto from "node:crypto";
import { isbnLegivel } from "@/lib/impressao";

// Peças comuns do pedido de impressão usadas ao criar o pedido (e-mail à equipe) e no admin
// ("gerar link para a gráfica" e "reenviar e-mail com os links").

type DadosDoPedido = {
  titulo: string;
  formato: string;
  paginas: number;
  tiragem: number;
  temIsbn: boolean;
  isbn: string | null;
  mioloCor: string;
  mioloPapel: string;
  encadernacao: string;
  capaPapel: string;
  capaCor: string;
  laminacao: string;
  orelhas: boolean;
};

/** Linhas "rótulo → valor" das especificações, na ordem dos e-mails. */
export function linhasDoPedido(pedido: DadosDoPedido, kit?: { nome: string; numero: number } | null): Array<[string, string]> {
  return [
    ...(kit ? ([["Kit contratado", `${kit.nome} (pedido do kit #${kit.numero})`]] as Array<[string, string]>) : []),
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
}

export function novoTokenDePedido(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  return { token, hash: crypto.createHash("sha256").update(token).digest("hex") };
}

/** Links de download (sem login) da capa e do miolo, a partir do token do pedido. */
export function linksDoPedido(token: string): { capa: string; miolo: string } {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";
  const link = (arquivo: "capa" | "miolo") => `${siteUrl}/api/impressao/arquivo?token=${token}&arquivo=${arquivo}`;
  return { capa: link("capa"), miolo: link("miolo") };
}
