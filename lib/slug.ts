// Endereço amigável do perfil de autor (/autor/nome-do-autor). Funções puras, sem banco, pra
// poderem ser usadas tanto no servidor quanto nos componentes de tela.

/** Nome vira texto de endereço: sem acento, minúsculo, só letras, números e hífen. */
export function slugBase(nome: string): string {
  const base = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base || "autor";
}

/** Caminho do perfil público: o endereço amigável quando já existe, senão o antigo (que redireciona). */
export function perfilHref(autor: { id: string; slug?: string | null }): string {
  return autor.slug ? `/autor/${autor.slug}` : `/perfil/${autor.id}`;
}
