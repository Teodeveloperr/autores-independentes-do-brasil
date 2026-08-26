import { temDestaque } from "@/lib/plans";

export type Conquista = { emoji: string; label: string; conquistada: boolean };

export function calcularConquistas(
  author: { plano: string; visualizacoes: number },
  opts: { percentualPerfil: number; numLivros: number; numEventos: number; maxVisualizacoesGlobal: number }
): Conquista[] {
  return [
    { emoji: "🏅", label: "Perfil completo", conquistada: opts.percentualPerfil === 100 },
    { emoji: "📚", label: "Primeiro livro publicado", conquistada: opts.numLivros > 0 },
    { emoji: "🎤", label: "Participou de evento", conquistada: opts.numEventos > 0 },
    { emoji: "⭐", label: "Autor em destaque", conquistada: temDestaque(author.plano) },
    {
      emoji: "🔥",
      label: "Perfil mais visitado",
      conquistada: opts.maxVisualizacoesGlobal > 0 && author.visualizacoes >= opts.maxVisualizacoesGlobal,
    },
  ];
}
