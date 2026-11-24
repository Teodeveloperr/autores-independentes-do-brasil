// Sobe (ou substitui) o PDF do e-book gratuito do blog no armazenamento privado.
// Uso: npx tsx scripts/subir-ebook-guia.mts "caminho/para/Guia-do-Autor-Independente.pdf"
// Lê EBOOKS_READ_WRITE_TOKEN do .env.local. O arquivo nunca fica em public/: só sai pelo link
// assinado do cadastro (ver lib/ebookLeadLinks.ts e app/api/ebook/download).
import { config } from "dotenv";
import { readFileSync } from "node:fs";
import { put } from "@vercel/blob";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const arquivo = process.argv[2];
if (!arquivo) {
  console.error('Informe o caminho do PDF: npx tsx scripts/subir-ebook-guia.mts "caminho.pdf"');
  process.exit(1);
}
const token = process.env.EBOOKS_READ_WRITE_TOKEN;
if (!token) {
  console.error("EBOOKS_READ_WRITE_TOKEN não está configurada.");
  process.exit(1);
}

const conteudo = readFileSync(arquivo);
if (conteudo.subarray(0, 5).toString() !== "%PDF-") {
  console.error("O arquivo não parece ser um PDF.");
  process.exit(1);
}

// Mesmo caminho de EBOOK_GUIA.arquivo (lib/ebookLead.ts).
const caminho = "ebook-leads/Guia-do-Autor-Independente.pdf";
await put(caminho, conteudo, { access: "private", token, contentType: "application/pdf", addRandomSuffix: false, allowOverwrite: true });
console.log(`Enviado: ${caminho} (${Math.round(conteudo.length / 1024)} KB)`);
