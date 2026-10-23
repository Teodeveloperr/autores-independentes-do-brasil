// Ícones de Halloween com parallax, profundidade (desfoque) e reação ao clique. Roda só no
// navegador, quando o tema está ligado. Cria os elementos na hora e devolve uma função que
// desfaz tudo (usada ao sair da página ou quando o período acaba).

type Camada = "longe" | "meio" | "perto";
type Tipo = "abobora" | "fantasma" | "morcego" | "aranha" | "doce" | "teia";

type Modelo = { e: string; p: Camada; s: number; d: number; tipo: Tipo };
type Ancora = { alvo: "logoHero" | "faixaNumeros" | "fotoSobre" | ["cartoes", string, number]; canto: "t" | "tl" | "tr" | "b" | "bl" | "br"; dx: number; dy: number; e: string; s: number; tipo: Tipo };

type Item = {
  el: HTMLDivElement;
  e: string;
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
  idx?: number;
  lado?: "E" | "D";
  p?: Camada;
};

// d = intensidade do parallax: positivo = ao fundo (mais lento que o conteúdo), negativo = em primeiro plano (mais rápido).
const MODELOS: Modelo[] = [
  { e: "🎃", p: "meio", s: 88, d: 0.18, tipo: "abobora" },
  { e: "🦇", p: "longe", s: 56, d: 0.44, tipo: "morcego" },
  { e: "👻", p: "meio", s: 80, d: 0.2, tipo: "fantasma" },
  { e: "🕷️", p: "longe", s: 46, d: 0.46, tipo: "aranha" },
  { e: "🎃", p: "perto", s: 170, d: -0.28, tipo: "abobora" },
  { e: "🍬", p: "meio", s: 60, d: 0.21, tipo: "doce" },
  { e: "🦇", p: "meio", s: 84, d: 0.19, tipo: "morcego" },
  { e: "👻", p: "longe", s: 62, d: 0.45, tipo: "fantasma" },
  { e: "🕸️", p: "meio", s: 72, d: 0.2, tipo: "teia" },
  { e: "🦇", p: "perto", s: 150, d: -0.3, tipo: "morcego" },
  { e: "🎃", p: "longe", s: 60, d: 0.43, tipo: "abobora" },
  { e: "🍭", p: "meio", s: 58, d: 0.21, tipo: "doce" },
];
const OPACIDADE: Record<Camada, number> = { longe: 0.6, meio: 1, perto: 0.78 };

// Só na home: ícones que ficam junto de elementos reais da página.
const ANCORAS: Ancora[] = [
  { alvo: "logoHero", canto: "tr", dx: 6, dy: 20, e: "🎃", s: 96, tipo: "abobora" },
  { alvo: "faixaNumeros", canto: "t", dx: -260, dy: 6, e: "👻", s: 96, tipo: "fantasma" },
  { alvo: "faixaNumeros", canto: "br", dx: -20, dy: 8, e: "🦇", s: 84, tipo: "morcego" },
  { alvo: "fotoSobre", canto: "bl", dx: 10, dy: -4, e: "🎃", s: 90, tipo: "abobora" },
  { alvo: ["cartoes", "O que o coletivo faz", 0], canto: "tl", dx: 8, dy: 4, e: "🍬", s: 64, tipo: "doce" },
  { alvo: ["cartoes", "O que o coletivo faz", 3], canto: "br", dx: -8, dy: 6, e: "🕷️", s: 58, tipo: "aranha" },
  { alvo: ["cartoes", "Autores em destaque", 0], canto: "t", dx: 0, dy: 4, e: "👻", s: 84, tipo: "fantasma" },
  { alvo: ["cartoes", "Autores em destaque", 2], canto: "tr", dx: -16, dy: 4, e: "🎃", s: 78, tipo: "abobora" },
  { alvo: ["cartoes", "Livros recentes", 1], canto: "t", dx: 10, dy: 2, e: "🦇", s: 72, tipo: "morcego" },
  { alvo: ["cartoes", "Blog do Coletivo", 0], canto: "tl", dx: 16, dy: 2, e: "🎃", s: 80, tipo: "abobora" },
  { alvo: ["cartoes", "Próximos eventos", 0], canto: "tr", dx: -14, dy: 2, e: "👻", s: 78, tipo: "fantasma" },
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
    const span = document.createElement("span");
    span.style.fontSize = Math.round(base.s * escala) + "px";
    span.style.setProperty("--dur", 3.2 + (i % 4) * 0.7 + "s");
    span.textContent = base.e;
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
    margem.push(criar({ e: m.e, s: m.s, d: m.d, tipo: m.tipo, base: OPACIDADE[m.p] * (estreita ? 0.7 : 1), p: m.p, idx: i, lado: i % 2 === 0 ? "E" : "D" }, m.p, i));
  }
  const ancoradas =
    opcoes.home && !estreita
      ? ANCORAS.map((a, i) => criar({ e: a.e, s: a.s, d: 0.07, tipo: a.tipo, base: 1, ancora: a }, "atras", i))
      : [];

  function posicionar() {
    const docW = document.documentElement.clientWidth;
    const H = alturaPagina();
    const passo = (H - 520) / Math.max(1, nMargem - 1);
    for (const it of margem) {
      const i = it.idx ?? 0;
      const jitter = (((i * 37) % 5) - 2) * 32;
      const esquerda = it.lado === "E";
      const fracs = esquerda ? [0.012, 0.035, 0.02] : [0.935, 0.915, 0.93];
      let fx = fracs[Math.floor(i / 2) % 3];
      if (it.p === "perto") fx = esquerda ? -0.012 : 0.965;
      if (estreita) fx = esquerda ? -0.02 : 0.9;
      it.x = fx * docW;
      it.y = 260 + i * passo + jitter;
      it.el.style.left = it.x + "px";
      it.el.style.top = it.y + "px";
    }
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
      it.x = px + a.dx - a.s / 2;
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
      const py = reduzido ? 0 : (it.y + it.s / 2 - (sy + vh / 2)) * -it.d;
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
