import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { carregarDadosPrevia, urlPrevia, versaoPrevia, type DadosPrevia } from "@/lib/previaAutor";
import { initials } from "@/lib/format";

// Imagem de prévia do perfil do autor (1200x630): é o que aparece quando o link /autor/nome é
// colado no WhatsApp, Instagram, Facebook, X etc. Monta foto, nome e até 3 capas num cartão
// padronizado. O endereço leva ?v=<versão do conteúdo>, então a imagem pode ficar em cache pra
// sempre e, se o autor trocar foto/capa/nome, o endereço muda e as redes buscam a nova.

export const maxDuration = 30;

const LARGURA = 1200;
const ALTURA = 630;
const AZUL = "#002776";
const AMARELO = "#FFDF00";

const fontes = Promise.all([
  readFile(join(process.cwd(), "assets/fonts/Cinzel-Bold.woff")),
  readFile(join(process.cwd(), "assets/fonts/Roboto-Regular.woff")),
  readFile(join(process.cwd(), "assets/fonts/Roboto-Bold.woff")),
]);

type ImagemPronta = { src: string; w: number; h: number };

// Baixa a imagem do autor e já reduz/converte: tira o peso (capas de vários MB), resolve formatos
// que o gerador não lê (webp) e evita que uma imagem quebrada derrube a prévia inteira.
async function prepararImagem(url: string, tipo: "foto" | "capa"): Promise<ImagemPronta | null> {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !u.hostname.endsWith(".public.blob.vercel-storage.com")) return null;
    const res = await fetch(u, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const original = Buffer.from(await res.arrayBuffer());
    if (original.length > 15 * 1024 * 1024) return null;

    const base = sharp(original).rotate().flatten({ background: "#ffffff" });
    const { data, info } = await (tipo === "foto"
      ? base.resize(400, 400, { fit: "cover", position: "attention" })
      : base.resize({ width: 700, height: 700, fit: "inside", withoutEnlargement: true })
    )
      .jpeg({ quality: 85 })
      .toBuffer({ resolveWithObject: true });
    return { src: `data:image/jpeg;base64,${data.toString("base64")}`, w: info.width, h: info.height };
  } catch (err) {
    console.error("[previa] Falha ao preparar imagem:", url, err);
    return null;
  }
}

function tamanhoNome(nome: string) {
  const n = nome.length;
  if (n <= 16) return 62;
  if (n <= 28) return 52;
  if (n <= 42) return 44;
  return 38;
}

function Avatar({ tamanho, foto, nome, anel }: { tamanho: number; foto: ImagemPronta | null; nome: string; anel: number }) {
  const estilo = {
    width: tamanho,
    height: tamanho,
    borderRadius: tamanho,
    border: `${anel}px solid ${AMARELO}`,
    boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
  };
  if (foto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={foto.src} width={tamanho} height={tamanho} alt="" style={{ ...estilo, objectFit: "cover" }} />
    );
  }
  return (
    <div
      style={{
        ...estilo,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: AMARELO,
        color: AZUL,
        fontFamily: "Cinzel",
        fontWeight: 700,
        fontSize: Math.round(tamanho * 0.4),
      }}
    >
      {initials(nome)}
    </div>
  );
}

// Capas em leque, centralizadas na coluna direita (560x630).
function Capas({ capas }: { capas: ImagemPronta[] }) {
  const n = capas.length;
  const alturaMax = n === 1 ? 450 : 370;
  const larguraMax = n === 1 ? 400 : 270;
  const passo = n === 2 ? 160 : 158;

  const itens = capas.map((c, i) => {
    let h = alturaMax;
    let w = Math.round((c.w / c.h) * h);
    if (w > larguraMax) {
      w = larguraMax;
      h = Math.round((c.h / c.w) * w);
    }
    const k = i - (n - 1) / 2;
    const cx = 266 + k * passo;
    const cy = 315 + Math.abs(k) * 16;
    return { c, w, h, k, left: Math.round(cx - w / 2), top: Math.round(cy - h / 2) };
  });
  // A do meio fica por cima das laterais.
  itens.sort((a, b) => Math.abs(b.k) - Math.abs(a.k));

  return (
    <div style={{ display: "flex", position: "relative", width: 560, height: ALTURA }}>
      {itens.map((it) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={it.c.src.slice(-40)}
          src={it.c.src}
          width={it.w}
          height={it.h}
          alt=""
          style={{
            position: "absolute",
            left: it.left,
            top: it.top,
            borderRadius: 6,
            border: "3px solid rgba(255,255,255,0.92)",
            boxShadow: "0 14px 34px rgba(0,0,0,0.5)",
            transform: `rotate(${it.k * 6}deg)`,
          }}
        />
      ))}
    </div>
  );
}

function Cartao({ dados, foto, capas }: { dados: DadosPrevia; foto: ImagemPronta | null; capas: ImagemPronta[] }) {
  const nome = dados.nome.length > 60 ? `${dados.nome.slice(0, 57)}...` : dados.nome;
  const livros = dados.totalLivros;
  const subtitulo = livros > 0 ? `Autor(a) independente · ${livros} livro${livros > 1 ? "s" : ""}` : "Autor(a) independente";
  const temCapas = capas.length > 0;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        backgroundImage: "linear-gradient(135deg, #001a52 0%, #002776 55%, #00692a 100%)",
        fontFamily: "Roboto",
        color: "#ffffff",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: 640, padding: "52px 36px 56px 64px" }}>
        <div style={{ display: "flex", color: AMARELO, fontWeight: 700, fontSize: 21, letterSpacing: 3 }}>
          AUTORES INDEPENDENTES DO BRASIL
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {temCapas && (
            <div style={{ display: "flex", marginBottom: 26 }}>
              <Avatar tamanho={112} foto={foto} nome={dados.nome} anel={4} />
            </div>
          )}
          <div style={{ display: "flex", fontFamily: "Cinzel", fontWeight: 700, fontSize: tamanhoNome(nome), lineHeight: 1.18 }}>
            {nome}
          </div>
          <div style={{ display: "flex", marginTop: 18, fontSize: 28, color: "rgba(255,255,255,0.85)" }}>{subtitulo}</div>
        </div>

        <div
          style={{
            display: "flex",
            alignSelf: "flex-start",
            background: AMARELO,
            color: AZUL,
            fontWeight: 700,
            fontSize: 24,
            padding: "12px 24px",
            borderRadius: 40,
          }}
        >
          autoresdobrasil.com.br
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 560, height: ALTURA }}>
        {temCapas ? <Capas capas={capas} /> : <Avatar tamanho={380} foto={foto} nome={dados.nome} anel={10} />}
      </div>

      <div style={{ display: "flex", position: "absolute", left: 0, bottom: 0, width: LARGURA, height: 12, background: AMARELO }} />
    </div>
  );
}

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const dados = await carregarDadosPrevia(slug);
  if (!dados) return new Response("Perfil não encontrado", { status: 404 });

  // Só gera (e guarda em cache) a versão correta do conteúdo. Qualquer outro ?v= é redirecionado,
  // pra ninguém conseguir forçar a geração de infinitas imagens trocando o parâmetro.
  const v = new URL(request.url).searchParams.get("v");
  if (v !== versaoPrevia(dados)) {
    return NextResponse.redirect(new URL(urlPrevia(dados), request.url), {
      status: 307,
      headers: { "Cache-Control": "public, max-age=60" },
    });
  }

  try {
    const [[cinzel, robotoRegular, robotoBold], foto, capas] = await Promise.all([
      fontes,
      dados.fotoUrl ? prepararImagem(dados.fotoUrl, "foto") : Promise.resolve(null),
      Promise.all(dados.capas.map((u) => prepararImagem(u, "capa"))),
    ]);

    const png = await new ImageResponse(
      <Cartao dados={dados} foto={foto} capas={capas.filter((c): c is ImagemPronta => c !== null)} />,
      {
        width: LARGURA,
        height: ALTURA,
        fonts: [
          { name: "Cinzel", data: cinzel, weight: 700, style: "normal" },
          { name: "Roboto", data: robotoRegular, weight: 400, style: "normal" },
          { name: "Roboto", data: robotoBold, weight: 700, style: "normal" },
        ],
      }
    ).arrayBuffer();

    // JPEG em vez de PNG: o WhatsApp ignora prévias muito pesadas.
    const jpeg = await sharp(Buffer.from(png)).jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    return new Response(new Uint8Array(jpeg), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[previa] Falha ao gerar a imagem do perfil:", slug, err);
    return NextResponse.redirect(new URL("/og-default.jpg", request.url), {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
