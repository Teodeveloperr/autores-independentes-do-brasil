// Separador ";" e vírgula decimal: é o formato que o Excel em português abre direto,
// sem precisar importar. O BOM no início faz os acentos abrirem certos.
function escapar(valor: string | number): string {
  let texto = String(valor);
  // Evita injeção de fórmula: texto vindo de usuário (nome, título de livro) que comece
  // com = + - @ seria executado como fórmula ao abrir no Excel/Planilhas.
  if (/^[=+\-@\t\r]/.test(texto)) texto = `'${texto}`;
  return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function reais(centavos: number): string {
  return (centavos / 100).toFixed(2).replace(".", ",");
}

export function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: (string | number)[][]) {
  const conteudo = [cabecalho, ...linhas].map((l) => l.map(escapar).join(";")).join("\r\n");
  const blob = new Blob(["﻿" + conteudo], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  a.click();
  URL.revokeObjectURL(url);
}
