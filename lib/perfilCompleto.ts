export type ChecklistItem = { label: string; done: boolean };

export function calcularPerfilCompleto(
  author: {
    fotoUrl: string | null;
    bio: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    siteUrl: string | null;
    cidade: string | null;
  },
  numLivros: number
): { itens: ChecklistItem[]; percentual: number } {
  const itens: ChecklistItem[] = [
    { label: "Foto de perfil", done: !!author.fotoUrl },
    { label: "Biografia", done: !!author.bio && author.bio.trim().length > 0 },
    { label: "Redes sociais", done: !!(author.instagramUrl || author.twitterUrl || author.siteUrl) },
    { label: "Livro cadastrado", done: numLivros > 0 },
    { label: "Localização", done: !!author.cidade && author.cidade.trim().length > 0 },
  ];

  const percentual = Math.round((itens.filter((i) => i.done).length / itens.length) * 100);

  return { itens, percentual };
}
