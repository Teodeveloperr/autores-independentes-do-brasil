import "server-only";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Marca d'água de cada página do e-book: identifica o exemplar do leitor (nome, e-mail e um
// código que leva ao acesso dele). Fica gravada na própria imagem, em um rodapé e em três
// faixas diagonais discretas, para que um print ou foto de tela carregue a identificação.
//
// Desenhada com o mesmo mecanismo da prévia de link (fontes do projeto embutidas), que funciona na
// Vercel sem depender de fontes do sistema. Só depende do tamanho da página e do leitor, então o
// resultado é guardado em memória e reaproveitado nas demais páginas do mesmo tamanho.

const fontes = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Roboto-Regular.woff")),
  readFile(join(process.cwd(), "assets/fonts/Roboto-Bold.woff")),
]);

const cache = new Map<string, Buffer>();
const CACHE_MAX = 40;

function curto(texto: string, max: number): string {
  return texto.length > max ? `${texto.slice(0, max - 1)}…` : texto;
}

export type DadosMarca = { largura: number; altura: number; nome: string | null; email: string; codigo: string };

export async function gerarMarcaDagua({ largura, altura, nome, email, codigo }: DadosMarca): Promise<Buffer> {
  const chave = `${largura}x${altura}|${nome ?? ""}|${email}|${codigo}`;
  const guardada = cache.get(chave);
  if (guardada) return guardada;

  const [regular, negrito] = await fontes;
  const tamRodape = Math.max(11, Math.round(largura * 0.0165));
  const alturaRodape = Math.round(tamRodape * 2.3);
  const tamDiagonal = Math.max(16, Math.round(largura * 0.034));
  const identificacao = `${nome ? `${curto(nome, 32)} · ` : ""}${curto(email, 40)}`;
  const posicoes = [0.22, 0.5, 0.78];

  const png = await new ImageResponse(
    (
      <div style={{ display: "flex", position: "relative", width: "100%", height: "100%", overflow: "hidden", fontFamily: "Roboto" }}>
        {posicoes.map((p) => (
          <div
            key={p}
            style={{
              display: "flex",
              position: "absolute",
              left: -largura * 0.1,
              width: largura * 1.2,
              top: Math.round(altura * p),
              justifyContent: "center",
              transform: "rotate(-28deg)",
              fontSize: tamDiagonal,
              fontWeight: 700,
              color: "rgba(90, 90, 90, 0.17)",
              whiteSpace: "nowrap",
            }}
          >
            {identificacao} · {codigo}
          </div>
        ))}
        <div
          style={{
            display: "flex",
            position: "absolute",
            left: 0,
            bottom: 0,
            width: "100%",
            height: alturaRodape,
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(20, 20, 20, 0.62)",
            color: "rgba(255, 255, 255, 0.92)",
            fontSize: tamRodape,
            fontWeight: 400,
            whiteSpace: "nowrap",
          }}
        >
          Exemplar de {identificacao} · código {codigo} · uso pessoal: cópia e divulgação proibidas
        </div>
      </div>
    ),
    {
      width: largura,
      height: altura,
      fonts: [
        { name: "Roboto", data: regular, weight: 400, style: "normal" },
        { name: "Roboto", data: negrito, weight: 700, style: "normal" },
      ],
    }
  ).arrayBuffer();

  const resultado = Buffer.from(png);
  if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string);
  cache.set(chave, resultado);
  return resultado;
}
