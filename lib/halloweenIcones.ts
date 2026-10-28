// Ícones de Halloween com parallax, profundidade (desfoque) e reação ao clique. Roda só no
// navegador, quando o tema está ligado. Cria os elementos na hora e devolve uma função que
// desfaz tudo (usada ao sair da página ou quando o período acaba).

type Camada = "longe" | "meio" | "perto";
type Tipo = "abobora" | "fantasma" | "morcego" | "aranha" | "doce" | "teia";

type Modelo = { e: string; img: string; p: Camada; s: number; d: number; tipo: Tipo };
type Ancora = { alvo: "logoHero" | "faixaNumeros" | "fotoSobre" | ["cartoes", string, number]; canto: "t" | "tl" | "tr" | "b" | "bl" | "br"; dx: number; dy: number; e: string; img: string; s: number; tipo: Tipo };

type Item = {
  el: HTMLDivElement;
  e: string;
  img: string;
  s: number;
  d: number;
  tipo: Tipo;
  base: number;
  extraX: number;
  extraY: number;
  rot: number;
  op: number;
  ocupado: boolean;
  x: number;
  y: number;
  ancora?: Ancora;
  // Posição horizontal já decidida de um ícone preso a um cartão de carrossel (ver posicionar).
  xFixo?: number;
  idx?: number;
  lado?: "E" | "D";
  p?: Camada;
};

// Arte do tema (public/halloween/*.webp). O emoji "e" só aparece nos doces que saem ao clicar.
const IMG = (nome: string) => `/halloween/${nome}.webp`;

// d = intensidade do parallax: positivo = ao fundo (mais lento que o conteúdo), negativo = em primeiro plano (mais rápido).
// s = lado da caixa (px) onde a imagem é encaixada sem distorcer; imagens largas (morcegos) usam caixas maiores.
const MODELOS: Modelo[] = [
  { e: "🎃", img: IMG("abobora-2"), p: "meio", s: 96, d: 0.18, tipo: "abobora" },
  { e: "🦇", img: IMG("morcego-2"), p: "longe", s: 100, d: 0.44, tipo: "morcego" },
  { e: "👻", img: IMG("fantasma-1"), p: "meio", s: 92, d: 0.2, tipo: "fantasma" },
  { e: "🕷️", img: IMG("aranha-1"), p: "longe", s: 66, d: 0.46, tipo: "aranha" },
  { e: "🎃", img: IMG("abobora-3"), p: "perto", s: 190, d: -0.28, tipo: "abobora" },
  { e: "🍬", img: IMG("doce-1"), p: "meio", s: 84, d: 0.21, tipo: "doce" },
  { e: "🦇", img: IMG("morcego-3"), p: "meio", s: 100, d: 0.19, tipo: "morcego" },
  { e: "👻", img: IMG("fantasma-2"), p: "longe", s: 100, d: 0.45, tipo: "fantasma" },
  { e: "🕸️", img: IMG("teia-2"), p: "meio", s: 104, d: 0.2, tipo: "teia" },
  { e: "🦇", img: IMG("morcegos"), p: "perto", s: 210, d: -0.3, tipo: "morcego" },
  { e: "🎃", img: IMG("abobora-3"), p: "longe", s: 84, d: 0.43, tipo: "abobora" },
  { e: "🍭", img: IMG("doce-1"), p: "meio", s: 76, d: 0.21, tipo: "doce" },
  { e: "👻", img: IMG("fantasma-3"), p: "meio", s: 88, d: 0.2, tipo: "fantasma" },
  { e: "🕸️", img: IMG("teia-3"), p: "longe", s: 110, d: 0.44, tipo: "teia" },
  { e: "🎃", img: IMG("abobora-2"), p: "longe", s: 80, d: 0.42, tipo: "abobora" },
  { e: "🕸️", img: IMG("teia-1"), p: "meio", s: 90, d: 0.2, tipo: "teia" },
];
// Quanto os ícones se mexem com a rolagem da página (1 = intensidade original de cada ícone; 0 = ficam parados
// junto do conteúdo). Valor baixo deixa o efeito de profundidade só como um leve toque.
const FATOR_SCROLL = 0.3;
const OPACIDADE: Record<Camada, number> = { longe: 0.6, meio: 1, perto: 0.78 };

// Só na home: ícones que ficam junto de elementos reais da página.
const ANCORAS: Ancora[] = [
  { alvo: "logoHero", canto: "tr", dx: 6, dy: 20, e: "🎃", img: IMG("abobora-2"), s: 100, tipo: "abobora" },
  { alvo: "faixaNumeros", canto: "t", dx: -260, dy: 6, e: "👻", img: IMG("fantasma-1"), s: 100, tipo: "fantasma" },
  { alvo: "faixaNumeros", canto: "br", dx: -20, dy: 8, e: "🦇", img: IMG("morcego-3"), s: 110, tipo: "morcego" },
  { alvo: "fotoSobre", canto: "bl", dx: 10, dy: -4, e: "🎃", img: IMG("abobora-3"), s: 100, tipo: "abobora" },
  { alvo: ["cartoes", "O que o coletivo faz", 0], canto: "tl", dx: 8, dy: 4, e: "🍬", img: IMG("doce-1"), s: 78, tipo: "doce" },
  { alvo: ["cartoes", "O que o coletivo faz", 3], canto: "br", dx: -8, dy: 6, e: "🕷️", img: IMG("aranha-1"), s: 66, tipo: "aranha" },
  { alvo: ["cartoes", "Autores em destaque", 0], canto: "t", dx: 0, dy: 4, e: "👻", img: IMG("fantasma-2"), s: 96, tipo: "fantasma" },
  { alvo: ["cartoes", "Autores em destaque", 2], canto: "tr", dx: -16, dy: 4, e: "🎃", img: IMG("abobora-2"), s: 90, tipo: "abobora" },
  { alvo: ["cartoes", "Livros recentes", 1], canto: "t", dx: 10, dy: 2, e: "🦇", img: IMG("morcego-2"), s: 110, tipo: "morcego" },
  { alvo: ["cartoes", "Blog do Coletivo", 0], canto: "tl", dx: 16, dy: 2, e: "🎃", img: IMG("abobora-3"), s: 90, tipo: "abobora" },
  { alvo: ["cartoes", "Próximos eventos", 0], canto: "tr", dx: -14, dy: 2, e: "👻", img: IMG("fantasma-3"), s: 86, tipo: "fantasma" },
];

const FRASES: Record<Tipo, string[]> = {
  abobora: ["Boo! 🎃", "Doce ou travessura?", "Feliz Halloween!"],
  fantasma: ["Buuu! 👻", "Cadê o seu livro?", "Uhhh..."],
  morcego: ["Quiii!", "🦇 Voando!"],
  aranha: ["Cuidado! 🕷️"],
  doce: ["Hmm, doce! 😋"],
  teia: ["Preso! 🕸️"],
};

// Roda no próximo quadro de animação; se o navegador pausar (aba em segundo plano), cai num timeout.
function quadroSeguro(fn: (t: number) => void) {
  let feito = false;
  const rodar = (t?: number) => {
    if (feito) return;
    feito = true;
    fn(t ?? performance.now());
  };
  requestAnimationFrame(rodar);
  setTimeout(() => rodar(), 50);
}

function secaoPorTitulo(txt: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>("section")].find(
    (s) => (s.querySelector("h1,h2")?.textContent || "").includes(txt) || (s.textContent || "").trim().slice(0, 140).includes(txt)
  );
}

// "Cartões" = blocos com fundo, sombra ou borda própria, visíveis na largura da tela, os mais externos.
function cartoesDe(sec: HTMLElement | undefined): HTMLElement[] {
  if (!sec) return [];
  const cand = [...sec.querySelectorAll<HTMLElement>("div, a, article, form, img")].filter((e) => {
    const r = e.getBoundingClientRect();
    const cs = getComputedStyle(e);
    const temCaixa = cs.backgroundColor !== "rgba(0, 0, 0, 0)" || cs.boxShadow !== "none" || parseFloat(cs.borderTopWidth) > 0 || e.tagName === "IMG" || e.tagName === "FORM";
    return r.width > 120 && r.width < 900 && r.height > 50 && r.height < 800 && temCaixa && r.left >= -2 && r.right <= innerWidth + 2;
  });
  return cand.filter((e) => !cand.some((o) => o !== e && o.contains(e)));
}

function acharAlvo(alvo: Ancora["alvo"]): Element | null {
  if (alvo === "logoHero") return document.querySelector('img[src*="hero-logo"]');
  if (alvo === "fotoSobre") return document.querySelector('img[src*="foto-coletivo-bienal"]');
  if (alvo === "faixaNumeros") {
    const sec = [...document.querySelectorAll<HTMLElement>("section")].find((s) => s.textContent?.includes("100+") && s.textContent.includes("LIVROS NO STAND"));
    if (!sec) return null;
    return [...sec.querySelectorAll<HTMLElement>("div")].find((d) => parseFloat(getComputedStyle(d).borderTopLeftRadius) > 0 && d.getBoundingClientRect().width > 400) || sec;
  }
  const lista = cartoesDe(secaoPorTitulo(alvo[1]));
  if (!lista.length) return null;
  return lista[alvo[2]] || lista[lista.length - 1];
}

// Retângulos (coordenadas da página) dos trechos de texto, para os ícones não ficarem em cima deles.
function retangulosDeTexto(): Array<{ l: number; r: number; t: number; b: number }> {
  const sx = scrollX;
  const sy = scrollY;
  // Menu, avisos e outros elementos "fixos" acompanham a tela, não a página: contá-los faria a decisão mudar a cada rolagem.
  const memo = new Map<HTMLElement, boolean>();
  const fixo = (e: HTMLElement | null): boolean => {
    if (!e || e === document.body) return false;
    const guardado = memo.get(e);
    if (guardado !== undefined) return guardado;
    const p = getComputedStyle(e).position;
    const r = p === "fixed" || p === "sticky" || fixo(e.parentElement);
    memo.set(e, r);
    return r;
  };
  return [...document.querySelectorAll<HTMLElement>("h1,h2,h3,p,li,label,button,a,span")]
    .filter((e) => !e.closest(".hw-icone, .hw-barra") && !fixo(e) && [...e.childNodes].some((n) => n.nodeType === 3 && (n.textContent || "").trim().length > 2))
    .map((e) => {
      const r = e.getBoundingClientRect();
      return { l: r.left + sx, r: r.right + sx, t: r.top + sy, b: r.bottom + sy };
    })
    .filter((r) => r.r - r.l > 10 && r.b - r.t > 8);
}

function pontoDoCanto(r: { left: number; right: number; top: number; bottom: number }, canto: Ancora["canto"]): [number, number] {
  const x = canto.includes("l") ? r.left : canto.includes("r") ? r.right : (r.left + r.right) / 2;
  const y = canto.startsWith("t") ? r.top : canto.startsWith("b") ? r.bottom : (r.top + r.bottom) / 2;
  return [x, y];
}

export function ligarIcones(opcoes: { home: boolean }): () => void {
  const limpezas: Array<() => void> = [];
  const estreita = innerWidth < 900;
  const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const escala = estreita ? 0.55 : 1;
  const itens: Item[] = [];

  const criar = (base: Omit<Item, "el" | "x" | "y" | "extraX" | "extraY" | "rot" | "op" | "ocupado">, camada: string, i: number): Item => {
    const el = document.createElement("div");
    el.className = "hw-icone hw-" + camada;
    el.setAttribute("aria-hidden", "true");
    if (estreita) el.style.pointerEvents = "none"; // no celular os ícones não atrapalham o toque no conteúdo
    el.classList.add("hw-t-" + base.tipo);
    const span = document.createElement("span");
    const lado = Math.round(base.s * escala);
    span.style.width = lado + "px";
    span.style.height = lado + "px";
    span.style.setProperty("--dur", 3.2 + (i % 4) * 0.7 + "s");
    const imagem = document.createElement("img");
    imagem.src = base.img;
    imagem.alt = "";
    imagem.draggable = false;
    imagem.decoding = "async";
    span.appendChild(imagem);
    el.appendChild(span);
    document.body.appendChild(el);
    limpezas.push(() => el.remove());
    const it: Item = { ...base, el, x: 0, y: 0, extraX: 0, extraY: 0, rot: 0, op: 1, ocupado: false };
    el.addEventListener("click", () => clicar(it));
    itens.push(it);
    return it;
  };

  const alturaPagina = () => document.documentElement.scrollHeight;
  const maxMargem = estreita ? 8 : 24;
  const nMargem = Math.max(estreita ? 5 : 10, Math.min(maxMargem, Math.round(alturaPagina() / (estreita ? 700 : 420))));
  const margem: Item[] = [];
  for (let i = 0; i < nMargem; i++) {
    const m = MODELOS[i % MODELOS.length];
    if (estreita && m.p === "perto") continue;
    margem.push(criar({ e: m.e, img: m.img, s: m.s, d: m.d, tipo: m.tipo, base: OPACIDADE[m.p] * (estreita ? 0.7 : 1), p: m.p, idx: i, lado: i % 2 === 0 ? "E" : "D" }, m.p, i));
  }
  const ancoradas =
    opcoes.home && !estreita
      ? ANCORAS.map((a, i) => criar({ e: a.e, img: a.img, s: a.s, d: 0.07, tipo: a.tipo, base: 1, ancora: a }, "atras", i))
      : [];

  let assentando = true; // nos primeiros segundos a página ainda está carregando: as decisões podem ser refeitas
  let larguraDecidida = 0;
  const decisoes = new Map<Item, { esquerda: boolean; dy: number }>();

  function posicionar() {
    const docW = document.documentElement.clientWidth;
    const H = alturaPagina();
    const passo = (H - 520) / Math.max(1, nMargem - 1);
    // O lado (esquerda/direita) de cada ícone é decidido enquanto a página termina de carregar e depois fica
    // congelado: refazer a conta a cada mudança de altura (imagens que carregam ao rolar) fazia os ícones
    // pularem de um lado para o outro. Só muda se a largura da janela mudar.
    const congelado = !assentando && Math.abs(docW - larguraDecidida) < 40;
    const textos = congelado ? [] : retangulosDeTexto();
    for (const it of margem) {
      const i = it.idx ?? 0;
      const jitter = (((i * 37) % 5) - 2) * 32;
      const ladoOriginal = it.lado === "E";
      const posX = (esquerda: boolean) => {
        const fracs = esquerda ? [0.012, 0.035, 0.02] : [0.935, 0.915, 0.93];
        let fx = fracs[Math.floor(i / 2) % 3];
        if (it.p === "perto") fx = esquerda ? -0.012 : 0.965;
        if (estreita) fx = esquerda ? -0.02 : 0.9;
        return fx * docW;
      };
      const yBase = 260 + i * passo + jitter;
      const lado = it.s * escala;
      const livre = (x: number, y: number) => !textos.some((t) => Math.min(x + lado, t.r) - Math.max(x, t.l) > 8 && Math.min(y + lado, t.b) - Math.max(y, t.t) > 8);
      let esquerda = ladoOriginal;
      let dy = 0;
      const salvo = congelado ? decisoes.get(it) : undefined;
      if (salvo) {
        esquerda = salvo.esquerda;
        dy = salvo.dy;
      } else if (it.p !== "perto" && !livre(posX(ladoOriginal), yBase)) {
        // Ícone em cima de texto: tenta a margem do outro lado e, depois, um pouco acima ou abaixo. Os grandes e
        // desfocados ("perto") ficam como estão: são de propósito pela borda da tela.
        const tentativas: Array<[boolean, number]> = [[!ladoOriginal, 0], [ladoOriginal, 110], [!ladoOriginal, 110], [ladoOriginal, -110], [!ladoOriginal, -110]];
        for (const [e, d] of tentativas) {
          if (livre(posX(e), yBase + d)) {
            esquerda = e;
            dy = d;
            break;
          }
        }
      }
      if (!congelado) decisoes.set(it, { esquerda, dy });
      it.x = posX(esquerda);
      it.y = yBase + dy;
      it.el.style.left = it.x + "px";
      it.el.style.top = it.y + "px";
    }
    if (!congelado) larguraDecidida = docW;
    for (const it of ancoradas) {
      const a = it.ancora as Ancora;
      const alvo = acharAlvo(a.alvo);
      if (!alvo) {
        it.el.style.display = "none";
        continue;
      }
      it.el.style.display = "";
      const r = alvo.getBoundingClientRect();
      const [px, py] = pontoDoCanto({ left: r.left + scrollX, right: r.right + scrollX, top: r.top + scrollY, bottom: r.bottom + scrollY }, a.canto);
      const nx = px + a.dx - a.s / 2;
      // Cartões de carrossel deslizam sozinhos: acompanhar o cartão fazia o ícone pular de lado. A posição
      // horizontal é decidida quando a página assenta e depois fica; a vertical continua seguindo o cartão.
      if (Array.isArray(a.alvo)) {
        if (!congelado || it.xFixo === undefined) it.xFixo = nx;
        it.x = it.xFixo;
      } else {
        it.x = nx;
      }
      it.y = py + a.dy - a.s / 2;
      it.el.style.left = it.x + "px";
      it.el.style.top = it.y + "px";
    }
  }

  let mx = 0;
  let my = 0;
  let quadro: number | null = null;
  const render = () => {
    quadro = null;
    const vh = innerHeight;
    const sy = scrollY;
    for (const it of itens) {
      const py = reduzido ? 0 : (it.y + it.s / 2 - (sy + vh / 2)) * -it.d * FATOR_SCROLL;
      const px = reduzido || estreita ? 0 : mx * it.d * 36;
      const pm = reduzido || estreita ? 0 : my * it.d * 24;
      it.el.style.transform = `translate3d(${px + it.extraX}px, ${py + pm + it.extraY}px, 0) rotate(${it.rot}deg)`;
      it.el.style.opacity = String(it.op * it.base);
    }
  };
  const agendar = () => {
    if (quadro !== null) return;
    quadro = requestAnimationFrame(render);
    setTimeout(() => {
      if (quadro !== null) {
        cancelAnimationFrame(quadro);
        render();
      }
    }, 50);
  };
  const reposicionar = () => {
    posicionar();
    agendar();
  };

  const onScroll = () => agendar();
  const onMouse = (ev: MouseEvent) => {
    mx = ev.clientX / innerWidth - 0.5;
    my = ev.clientY / innerHeight - 0.5;
    agendar();
  };
  addEventListener("scroll", onScroll, { passive: true });
  if (!estreita) addEventListener("mousemove", onMouse, { passive: true });
  addEventListener("resize", reposicionar);
  // O layout muda quando imagens e carrosséis terminam de carregar: acompanha a altura da página.
  let alturaAnterior = alturaPagina();
  const observador = new ResizeObserver(() => {
    const h = alturaPagina();
    if (Math.abs(h - alturaAnterior) > 20) {
      alturaAnterior = h;
      reposicionar();
    }
  });
  observador.observe(document.body);
  const tempos = [600, 1800, 4000].map((ms) => setTimeout(reposicionar, ms));
  tempos.push(setTimeout(() => (assentando = false), 4300));
  limpezas.push(() => {
    removeEventListener("scroll", onScroll);
    removeEventListener("mousemove", onMouse);
    removeEventListener("resize", reposicionar);
    observador.disconnect();
    tempos.forEach(clearTimeout);
    if (quadro !== null) cancelAnimationFrame(quadro);
  });
  posicionar();
  render();

  function bolha(it: Item, txt: string) {
    const r = it.el.getBoundingClientRect();
    const b = document.createElement("div");
    b.className = "hw-bolha";
    b.textContent = txt;
    b.style.left = r.left + scrollX - 10 + "px";
    b.style.top = r.top + scrollY - 34 + "px";
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 1500);
  }
  function explodir(it: Item, emojis: string[]) {
    const r = it.el.getBoundingClientRect();
    const cx = r.left + scrollX + r.width / 2;
    const cy = r.top + scrollY + r.height / 2;
    for (let k = 0; k < 10; k++) {
      const p = document.createElement("div");
      p.className = "hw-particula";
      p.textContent = emojis[k % emojis.length];
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      document.body.appendChild(p);
      const a = (k / 10) * Math.PI * 2;
      const dist = 70 + Math.random() * 60;
      p.animate(
        [
          { transform: "translate(0,0) scale(.6)", opacity: 1 },
          { transform: `translate(${Math.cos(a) * dist}px,${Math.sin(a) * dist}px) scale(1.2)`, opacity: 0 },
        ],
        { duration: 900, easing: "ease-out" }
      ).onfinish = () => p.remove();
    }
  }
  function mover(it: Item, props: { x?: number; y?: number; r?: number; o?: number }, ms: number, volta: (() => void) | null) {
    const ini = { x: it.extraX, y: it.extraY, r: it.rot, o: it.op };
    const t0 = performance.now();
    const passo = (t: number) => {
      const k = Math.min(1, (t - t0) / ms);
      const ease = 1 - Math.pow(1 - k, 3);
      it.extraX = ini.x + (props.x ?? 0) * ease;
      it.extraY = ini.y + (props.y ?? 0) * ease;
      it.rot = ini.r + (props.r ?? 0) * ease;
      if (props.o !== undefined) it.op = ini.o + (props.o - ini.o) * ease;
      agendar();
      if (k < 1) quadroSeguro(passo);
      else if (volta) setTimeout(volta, 700);
    };
    quadroSeguro(passo);
  }
  function clicar(it: Item) {
    const f = FRASES[it.tipo];
    bolha(it, f[Math.floor(Math.random() * f.length)]);
    if (it.ocupado) return;
    it.ocupado = true;
    const livre = () => {
      it.ocupado = false;
    };
    if (it.tipo === "abobora") {
      explodir(it, ["🍬", "✨", "🦇", "🍭"]);
      it.el.animate([{ transform: "scale(1)" }, { transform: "scale(1.4) rotate(12deg)" }, { transform: "scale(1)" }], { duration: 500 });
      setTimeout(livre, 600);
    } else if (it.tipo === "fantasma") {
      mover(it, { x: -70, y: -90, r: -20, o: 0 }, 600, () => {
        it.extraX = 0;
        it.extraY = 0;
        it.rot = 0;
        mover(it, { o: 1 }, 500, null);
        setTimeout(livre, 600);
      });
    } else if (it.tipo === "morcego") {
      mover(it, { x: 520, y: -140, r: 25, o: 0 }, 900, () => {
        it.extraX = -520;
        it.extraY = 0;
        it.rot = 0;
        mover(it, { x: 520, o: 1 }, 700, null);
        setTimeout(livre, 800);
      });
    } else if (it.tipo === "aranha") {
      mover(it, { y: 120 }, 500, () => {
        mover(it, { y: -120 }, 600, null);
        setTimeout(livre, 700);
      });
    } else {
      explodir(it, ["✨", it.e]);
      setTimeout(livre, 600);
    }
  }

  return () => {
    while (limpezas.length) limpezas.pop()?.();
  };
}
