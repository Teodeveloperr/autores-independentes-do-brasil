"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import QRCode from "qrcode";
import type { AuthorWithRelations, PainelView } from "./types";

// Arte pronta pra divulgar (stories e feed), montada inteira no navegador do autor com a foto,
// o nome, as capas dos livros e o QR Code do perfil. Nada vai pra servidor e não tem custo.

type Formato = "story" | "feed";
type Tema = "azul" | "claro";

const AZUL = "#002776";
const AMARELO = "#FFDF00";
const LARGURA = 1080;
const MAX_CAPAS = 3;

const botaoSecundario: React.CSSProperties = { background: "white", color: AZUL, padding: "9px 14px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", border: "1px solid #DDD", textDecoration: "none", display: "inline-block", cursor: "pointer" };
const botaoPrimario: React.CSSProperties = { background: "#009B3A", color: "white", padding: "10px 18px", fontWeight: 700, borderRadius: "6px", fontSize: "13px", border: "none", cursor: "pointer" };

type Recursos = { foto: ImageBitmap; capas: ImageBitmap[]; qr: ImageBitmap };

// ---------- carregamento de fontes e imagens ----------

let fontesPromise: Promise<void> | null = null;
function carregarFontes(): Promise<void> {
  if (!fontesPromise) {
    const defs: [string, string, string][] = [
      ["AIBCinzel", "/fonts/Cinzel-Bold.woff", "700"],
      ["AIBRoboto", "/fonts/Roboto-Regular.woff", "400"],
      ["AIBRoboto", "/fonts/Roboto-Bold.woff", "700"],
    ];
    fontesPromise = Promise.all(
      defs.map(async ([familia, url, peso]) => {
        const fonte = new FontFace(familia, `url(${url})`, { weight: peso });
        await fonte.load();
        document.fonts.add(fonte);
      })
    ).then(() => undefined);
    fontesPromise.catch(() => {
      fontesPromise = null;
    });
  }
  return fontesPromise;
}

// O cache do navegador pode guardar a imagem sem as permissões que o canvas exige; o "no-cache"
// força a conferência com o servidor e garante a leitura com CORS.
async function carregarImagem(url: string): Promise<ImageBitmap> {
  const res = await fetch(url, { mode: "cors", cache: "no-cache" });
  if (!res.ok) throw new Error(`Falha ao baixar imagem (${res.status})`);
  return createImageBitmap(await res.blob());
}

async function carregarQr(link: string): Promise<ImageBitmap> {
  const dataUrl = await QRCode.toDataURL(link, { margin: 1, width: 400, color: { dark: AZUL, light: "#ffffff" } });
  return createImageBitmap(await (await fetch(dataUrl)).blob());
}

// ---------- desenho ----------

function caminhoArredondado(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function fundo(ctx: CanvasRenderingContext2D, w: number, h: number, tema: Tema) {
  // Equivalente a um linear-gradient de 160° em CSS.
  const ang = (160 * Math.PI) / 180;
  const dx = Math.sin(ang);
  const dy = -Math.cos(ang);
  const comp = Math.abs(w * dx) + Math.abs(h * dy);
  const g = ctx.createLinearGradient(w / 2 - (dx * comp) / 2, h / 2 - (dy * comp) / 2, w / 2 + (dx * comp) / 2, h / 2 + (dy * comp) / 2);
  if (tema === "azul") {
    g.addColorStop(0, "#001a52");
    g.addColorStop(0.55, AZUL);
    g.addColorStop(1, "#00692a");
  } else {
    g.addColorStop(0, "#FFF3B0");
    g.addColorStop(0.55, AMARELO);
    g.addColorStop(1, "#F5C400");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function textoEspacado(ctx: CanvasRenderingContext2D, texto: string, cx: number, y: number, espaco: number) {
  const letras = [...texto];
  const larguras = letras.map((c) => ctx.measureText(c).width);
  const total = larguras.reduce((a, b) => a + b, 0) + espaco * (letras.length - 1);
  let x = cx - total / 2;
  ctx.textAlign = "left";
  letras.forEach((c, i) => {
    ctx.fillText(c, x, y);
    x += larguras[i] + espaco;
  });
}

function quebrarLinhas(ctx: CanvasRenderingContext2D, texto: string, larguraMax: number): string[] {
  const linhas: string[] = [];
  let atual = "";
  for (const palavra of texto.trim().split(/\s+/)) {
    const teste = atual ? `${atual} ${palavra}` : palavra;
    if (atual && ctx.measureText(teste).width > larguraMax) {
      linhas.push(atual);
      atual = palavra;
    } else {
      atual = teste;
    }
  }
  if (atual) linhas.push(atual);
  return linhas;
}

// Maior tamanho de letra em que o nome cabe em até 2 linhas; se nem o menor couber, usa 3 linhas.
function ajustarNome(ctx: CanvasRenderingContext2D, nome: string, larguraMax: number, tamanhos: number[]) {
  for (const tamanho of tamanhos) {
    ctx.font = `700 ${tamanho}px AIBCinzel`;
    const linhas = quebrarLinhas(ctx, nome, larguraMax);
    if (linhas.length <= 2) return { tamanho, linhas };
  }
  const menor = tamanhos[tamanhos.length - 1];
  ctx.font = `700 ${menor}px AIBCinzel`;
  return { tamanho: menor, linhas: quebrarLinhas(ctx, nome, larguraMax).slice(0, 3) };
}

function avatar(ctx: CanvasRenderingContext2D, foto: ImageBitmap, cx: number, cy: number, diametro: number, anel: number, corAnel: string) {
  const raio = diametro / 2;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = corAnel;
  ctx.beginPath();
  ctx.arc(cx, cy, raio, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, raio - anel, 0, Math.PI * 2);
  ctx.clip();
  const lado = Math.min(foto.width, foto.height);
  // Corte quadrado puxado um pouco pra cima, onde costuma ficar o rosto.
  const sx = (foto.width - lado) / 2;
  const sy = (foto.height - lado) * 0.25;
  ctx.drawImage(foto, sx, sy, lado, lado, cx - raio + anel, cy - raio + anel, diametro - anel * 2, diametro - anel * 2);
  ctx.restore();
}

function leque(ctx: CanvasRenderingContext2D, capas: ImageBitmap[], cx: number, cy: number, hMax: number, wMax: number, passo: number) {
  const n = capas.length;
  const itens = capas.map((c, i) => {
    let h = hMax;
    let w = Math.round((c.width / c.height) * h);
    if (w > wMax) {
      w = wMax;
      h = Math.round((c.height / c.width) * w);
    }
    return { c, w, h, k: i - (n - 1) / 2 };
  });
  // A do meio fica por cima das laterais.
  itens.sort((a, b) => Math.abs(b.k) - Math.abs(a.k));
  for (const it of itens) {
    ctx.save();
    ctx.translate(cx + it.k * passo, cy + Math.abs(it.k) * 20);
    ctx.rotate(((it.k * 6) * Math.PI) / 180);
    ctx.shadowColor = "rgba(0,0,0,0.45)";
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    caminhoArredondado(ctx, -it.w / 2 - 4, -it.h / 2 - 4, it.w + 8, it.h + 8, 10);
    ctx.fill();
    ctx.shadowColor = "transparent";
    caminhoArredondado(ctx, -it.w / 2, -it.h / 2, it.w, it.h, 6);
    ctx.clip();
    ctx.drawImage(it.c, -it.w / 2, -it.h / 2, it.w, it.h);
    ctx.restore();
  }
}

function desenhar(canvas: HTMLCanvasElement, formato: Formato, tema: Tema, nome: string, totalLivros: number, rec: Recursos) {
  const story = formato === "story";
  const W = LARGURA;
  const H = story ? 1920 : 1080;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const claro = tema === "claro";
  const corTexto = claro ? AZUL : "#ffffff";
  const corDestaque = claro ? AZUL : AMARELO;
  const sub = `Autor(a) independente · ${totalLivros} livro${totalLivros === 1 ? "" : "s"}`;
  const n = rec.capas.length;

  fundo(ctx, W, H, tema);
  ctx.textBaseline = "middle";

  const desenharMarca = (y: number, tamanho: number, espaco: number) => {
    ctx.font = `700 ${tamanho}px AIBRoboto`;
    ctx.fillStyle = corDestaque;
    textoEspacado(ctx, "AUTORES INDEPENDENTES DO BRASIL", W / 2, y, espaco);
  };

  if (story) {
    const { tamanho, linhas } = ajustarNome(ctx, nome, W - 140, [84, 72, 62, 54]);
    const lh = Math.round(tamanho * 1.15);
    const alturaFan = 580;
    const total = 36 + 44 + 200 + 32 + linhas.length * lh + 16 + 40 + 30 + alturaFan + 34 + 250;
    // Centraliza o conjunto na área livre, longe das faixas que o Instagram cobre no topo e embaixo.
    let y = Math.max(190, 200 + (1500 - total) / 2);

    desenharMarca(y + 18, 30, 5);
    y += 36 + 44;
    avatar(ctx, rec.foto, W / 2, y + 100, 200, 8, claro ? AZUL : AMARELO);
    y += 200 + 32;

    ctx.font = `700 ${tamanho}px AIBCinzel`;
    ctx.fillStyle = corTexto;
    ctx.textAlign = "center";
    linhas.forEach((l, i) => ctx.fillText(l, W / 2, y + lh * i + lh / 2));
    y += linhas.length * lh + 16;

    ctx.font = "400 34px AIBRoboto";
    ctx.globalAlpha = 0.85;
    ctx.textAlign = "center";
    ctx.fillText(sub, W / 2, y + 20);
    ctx.globalAlpha = 1;
    y += 40 + 30;

    leque(ctx, rec.capas, W / 2, y + alturaFan / 2, n === 1 ? 540 : 500, n === 1 ? 420 : 360, 250);
    y += alturaFan + 34;

    // Cartão com QR Code e endereço.
    const cx0 = 213;
    ctx.save();
    ctx.fillStyle = "#ffffff";
    caminhoArredondado(ctx, cx0, y, 654, 250, 36);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(rec.qr, cx0 + 34, y + 25, 200, 200);
    ctx.fillStyle = AZUL;
    ctx.textAlign = "left";
    ctx.font = "700 38px AIBRoboto";
    ctx.fillText("Conheça meus livros", cx0 + 264, y + 87);
    ctx.font = "400 28px AIBRoboto";
    ctx.fillText("Aponte a câmera ou acesse", cx0 + 264, y + 134);
    ctx.font = "700 28px AIBRoboto";
    ctx.fillText("autoresdobrasil.com.br", cx0 + 264, y + 171);
    return;
  }

  // ----- feed (quadrado) -----
  desenharMarca(70, 26, 4);

  const { tamanho, linhas } = ajustarNome(ctx, nome, 700, [60, 52, 46, 40]);
  const lh = Math.round(tamanho * 1.15);
  ctx.font = `700 ${tamanho}px AIBCinzel`;
  let larguraTexto = Math.max(...linhas.map((l) => ctx.measureText(l).width));
  ctx.font = "400 28px AIBRoboto";
  larguraTexto = Math.max(larguraTexto, ctx.measureText(sub).width);

  const alturaTexto = linhas.length * lh + 10 + 34;
  const alturaLinha = Math.max(150, alturaTexto);
  const linhaTopo = 123;
  const larguraLinha = 150 + 34 + larguraTexto;
  const x0 = (W - larguraLinha) / 2;
  const centroLinha = linhaTopo + alturaLinha / 2;

  avatar(ctx, rec.foto, x0 + 75, centroLinha, 150, 6, claro ? AZUL : AMARELO);

  const xTexto = x0 + 150 + 34;
  let yTexto = centroLinha - alturaTexto / 2;
  ctx.textAlign = "left";
  ctx.font = `700 ${tamanho}px AIBCinzel`;
  ctx.fillStyle = corTexto;
  linhas.forEach((l, i) => ctx.fillText(l, xTexto, yTexto + lh * i + lh / 2));
  yTexto += linhas.length * lh + 10;
  ctx.font = "400 28px AIBRoboto";
  ctx.globalAlpha = 0.85;
  ctx.fillText(sub, xTexto, yTexto + 17);
  ctx.globalAlpha = 1;

  // Rodapé: texto e endereço à esquerda, QR Code à direita.
  const qrCartao = 174;
  const rodapeTopo = H - 50 - qrCartao;
  ctx.fillStyle = "#ffffff";
  caminhoArredondado(ctx, W - 60 - qrCartao, rodapeTopo, qrCartao, qrCartao, 20);
  ctx.fill();
  ctx.drawImage(rec.qr, W - 60 - qrCartao + 12, rodapeTopo + 12, 150, 150);

  const blocoTopo = rodapeTopo + qrCartao / 2 - 56;
  ctx.fillStyle = corTexto;
  ctx.font = "700 36px AIBRoboto";
  ctx.fillText("Conheça meus livros", 60, blocoTopo + 22);
  ctx.font = "700 28px AIBRoboto";
  const larguraPilula = ctx.measureText("autoresdobrasil.com.br").width + 48;
  ctx.fillStyle = claro ? AZUL : AMARELO;
  caminhoArredondado(ctx, 60, blocoTopo + 56, larguraPilula, 56, 28);
  ctx.fill();
  ctx.fillStyle = claro ? AMARELO : AZUL;
  ctx.fillText("autoresdobrasil.com.br", 84, blocoTopo + 56 + 29);

  // Capas ocupam o espaço entre o cabeçalho e o rodapé.
  const fanTopo = linhaTopo + alturaLinha + 10;
  const fanBase = rodapeTopo - 10;
  const hDisp = fanBase - fanTopo - 40;
  leque(ctx, rec.capas, W / 2, (fanTopo + fanBase) / 2, Math.min(n === 1 ? 460 : 440, hDisp), n === 1 ? 340 : 330, 230);
}

// ---------- componente ----------

function suportaCompartilharArquivo(): boolean {
  try {
    return typeof navigator.canShare === "function" && navigator.canShare({ files: [new File([""], "a.png", { type: "image/png" })] });
  } catch {
    return false;
  }
}

export default function ArteDivulgacao({
  author,
  link,
  onNavigate,
}: {
  author: AuthorWithRelations;
  link: string;
  onNavigate: (view: PainelView) => void;
}) {
  const urlsCapas = author.books.flatMap((b) => (b.capaUrl ? [b.capaUrl] : [])).slice(0, MAX_CAPAS);
  const temFoto = Boolean(author.fotoUrl);
  const temCapa = urlsCapas.length > 0;
  const pronto = temFoto && temCapa;

  const [formato, setFormato] = useState<Formato>("story");
  const [tema, setTema] = useState<Tema>("azul");
  // Recursos e erro ficam atrelados à chave das imagens: se foto ou capas mudarem, o que foi
  // carregado antes deixa de valer sem precisar zerar estado dentro do efeito.
  const [carregado, setCarregado] = useState<{ chave: string; recursos: Recursos } | null>(null);
  const [chaveComErro, setChaveComErro] = useState<string | null>(null);
  const podeCompartilhar = useSyncExternalStore(
    () => () => {},
    suportaCompartilharArquivo,
    () => false
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const chaveImagens = `${author.fotoUrl ?? ""}|${urlsCapas.join(",")}|${link}`;

  useEffect(() => {
    if (!pronto || !author.fotoUrl) return;
    let cancelado = false;
    (async () => {
      try {
        await carregarFontes();
        const [foto, capasResultado, qr] = await Promise.all([
          carregarImagem(author.fotoUrl as string),
          Promise.allSettled(urlsCapas.map(carregarImagem)),
          carregarQr(link),
        ]);
        const capas = capasResultado.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
        if (capas.length === 0) throw new Error("Nenhuma capa pôde ser carregada");
        if (!cancelado) setCarregado({ chave: chaveImagens, recursos: { foto, capas, qr } });
      } catch (err) {
        console.error("[arte] Falha ao carregar os recursos da arte:", err);
        if (!cancelado) setChaveComErro(chaveImagens);
      }
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveImagens, pronto]);

  const recursos = carregado?.chave === chaveImagens ? carregado.recursos : null;
  const erro = chaveComErro === chaveImagens;

  useEffect(() => {
    if (recursos && canvasRef.current) desenhar(canvasRef.current, formato, tema, author.nome, author.books.length, recursos);
  }, [recursos, formato, tema, author.nome, author.books.length]);

  function gerarBlob(): Promise<Blob | null> {
    return new Promise((resolve) => (canvasRef.current ? canvasRef.current.toBlob(resolve, "image/png") : resolve(null)));
  }

  const nomeArquivo = `arte-${author.slug ?? "perfil"}-${formato}.png`;

  async function baixar() {
    const blob = await gerarBlob();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function compartilhar() {
    const blob = await gerarBlob();
    if (!blob) return;
    try {
      await navigator.share({ files: [new File([blob], nomeArquivo, { type: "image/png" })], text: link });
    } catch {
      // Compartilhamento cancelado pelo próprio usuário: nada a fazer.
    }
  }

  const opcao = (ativo: boolean): React.CSSProperties => ({
    ...botaoSecundario,
    ...(ativo ? { background: AZUL, color: "white", border: `1px solid ${AZUL}` } : {}),
  });

  if (!pronto) {
    const passos = [
      { ok: temFoto, texto: "Foto de perfil", ir: "perfil" as PainelView, acao: "Adicionar foto" },
      { ok: temCapa, texto: "Pelo menos um livro com capa", ir: "livros" as PainelView, acao: author.books.length > 0 ? "Adicionar capa" : "Cadastrar livro" },
    ];
    return (
      <div>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "14px" }}>
          A arte é montada com a sua foto e as capas dos seus livros. Complete o que falta para liberar:
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {passos.map((p) => (
            <div key={p.texto} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "13px" }}>
              <span style={{ color: p.ok ? "#009B3A" : "#262626" }}>
                {p.ok ? "✅" : "⬜"} {p.texto}
              </span>
              {!p.ok && (
                <button type="button" onClick={() => onNavigate(p.ir)} style={botaoSecundario}>
                  {p.acao} →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "14px" }}>
        Imagem pronta com a sua foto, os seus livros e o QR Code do perfil. Baixe e poste nos stories ou no feed e coloque o link na legenda ou no adesivo de link.
      </p>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "#666" }}>Formato:</span>
          <button type="button" onClick={() => setFormato("story")} style={opcao(formato === "story")}>Stories</button>
          <button type="button" onClick={() => setFormato("feed")} style={opcao(formato === "feed")}>Feed</button>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: "12px", color: "#666" }}>Estilo:</span>
          <button type="button" onClick={() => setTema("azul")} style={opcao(tema === "azul")}>Azul</button>
          <button type="button" onClick={() => setTema("claro")} style={opcao(tema === "claro")}>Amarelo</button>
        </div>
      </div>

      {erro ? (
        <p style={{ fontSize: "13px", color: "#B00020" }}>
          Não consegui carregar as imagens para montar a arte. Recarregue a página e tente de novo.
        </p>
      ) : (
        <>
          <div style={{ minHeight: recursos ? undefined : "120px" }}>
            {!recursos && <p style={{ fontSize: "13px", color: "#999" }}>Montando a sua arte...</p>}
            <canvas
              ref={canvasRef}
              aria-label="Prévia da arte de divulgação"
              style={{
                display: recursos ? "block" : "none",
                width: "100%",
                maxWidth: formato === "story" ? "270px" : "380px",
                height: "auto",
                borderRadius: "8px",
                border: "1px solid #E5E5E5",
                background: "#F0F0F0",
              }}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "16px" }}>
            <button type="button" onClick={baixar} disabled={!recursos} style={{ ...botaoPrimario, opacity: recursos ? 1 : 0.5 }}>
              ⬇ Baixar imagem
            </button>
            {podeCompartilhar && (
              <button type="button" onClick={compartilhar} disabled={!recursos} style={{ ...botaoSecundario, opacity: recursos ? 1 : 0.5 }}>
                Compartilhar
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
