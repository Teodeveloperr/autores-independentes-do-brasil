import type { ReactNode } from "react";

const CONTEUDO_REGEX = /!\[([^\]]*)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*|__([^_]+)__|\*([^*]+)\*/g;

export function renderArticleContent(texto: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  CONTEUDO_REGEX.lastIndex = 0;
  while ((match = CONTEUDO_REGEX.exec(texto))) {
    if (match.index > lastIndex) {
      nodes.push(texto.slice(lastIndex, match.index));
    }

    const [, imgAlt, imgUrl, bold, underline, italic] = match;
    if (imgUrl !== undefined) {
      nodes.push(
        // eslint-disable-next-line @next/next/no-img-element -- URL dinâmica vinda do conteúdo do artigo
        <img key={key++} src={imgUrl} alt={imgAlt || ""} style={{ maxWidth: "100%", height: "auto", borderRadius: "8px", margin: "16px 0", display: "block" }} />
      );
    } else if (bold !== undefined) {
      nodes.push(<strong key={key++}>{bold}</strong>);
    } else if (underline !== undefined) {
      nodes.push(<u key={key++}>{underline}</u>);
    } else if (italic !== undefined) {
      nodes.push(<em key={key++}>{italic}</em>);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < texto.length) {
    nodes.push(texto.slice(lastIndex));
  }

  return nodes;
}
