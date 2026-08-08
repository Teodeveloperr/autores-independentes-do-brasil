export const PLANOS_COM_VENDA = ["Autor Essencial", "Autor Premium"];

export function podeVenderLivros(plano: string) {
  return PLANOS_COM_VENDA.includes(plano);
}

export const PLANOS_COM_RECURSOS_EXTRAS = ["Gratuito", "Autor Essencial", "Autor Premium"];

export function podeUsarRecursosExtras(plano: string) {
  return PLANOS_COM_RECURSOS_EXTRAS.includes(plano);
}
