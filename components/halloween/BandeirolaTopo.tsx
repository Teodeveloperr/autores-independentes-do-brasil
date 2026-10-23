import Image from "next/image";

// Faixa decorativa do topo da home. No dia a dia mostra a imagem de bandeirolas de sempre; durante o
// tema de Halloween (classe no <html>, ver halloween.css) troca por uma guirlanda de bandeirinhas.
// A imagem original é guardada de cabeça pra baixo e a página a gira 180°; a guirlanda não gira.

const LARGURA = 2000;
const ALTURA = 175;
const VAOS = 5;
const CORDA_Y = 6;
const CAIMENTO = 70;
const CORES = ["#FF7A00", "#4a1f7a", "#140a26", "#FFA21F", "#2a1450"];

type Ponto = [number, number];

function bezier(a: Ponto, b: Ponto, c: Ponto, t: number): Ponto {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1]];
}
function tangente(a: Ponto, b: Ponto, c: Ponto, t: number): Ponto {
  return [2 * (1 - t) * (b[0] - a[0]) + 2 * t * (c[0] - b[0]), 2 * (1 - t) * (b[1] - a[1]) + 2 * t * (c[1] - b[1])];
}

function Morcego({ x, y, escala }: { x: number; y: number; escala: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${escala})`} fill="#140a26">
      <path d="M0 0 C-8 -14 -26 -16 -40 -6 C-32 -4 -30 4 -22 8 C-18 2 -10 4 -6 10 L0 4 L6 10 C10 4 18 2 22 8 C30 4 32 -4 40 -6 C26 -16 8 -14 0 0Z" />
    </g>
  );
}

function Guirlanda() {
  const larg = LARGURA / VAOS;
  const cordas: React.ReactNode[] = [];
  const bandeirinhas: React.ReactNode[] = [];
  let n = 0;
  for (let v = 0; v < VAOS; v++) {
    const p0: Ponto = [v * larg, CORDA_Y];
    const p2: Ponto = [(v + 1) * larg, CORDA_Y];
    const p1: Ponto = [v * larg + larg / 2, CORDA_Y + CAIMENTO * 2];
    cordas.push(<path key={`c${v}`} d={`M${p0} Q${p1} ${p2}`} stroke="#140a26" strokeWidth={3} fill="none" />);
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      const [x, y] = bezier(p0, p1, p2, t);
      const [dx, dy] = tangente(p0, p1, p2, t);
      const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
      const cor = CORES[n++ % CORES.length];
      const w = 38;
      const h = 66;
      bandeirinhas.push(
        <g key={`b${v}-${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${ang.toFixed(1)})`}>
          <polygon points={`${-w},0 ${w},0 0,${h}`} fill={cor} />
          <polygon points={`${-w},0 ${w},0 ${w - 8},9 ${-w + 8},9`} fill="rgba(255,255,255,.18)" />
        </g>
      );
    }
  }
  return (
    <svg className="hw-guirlanda" viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="presentation" aria-hidden="true" style={{ width: "100%", height: "auto" }}>
      {cordas}
      {bandeirinhas}
      <Morcego x={600} y={42} escala={0.8} />
      <Morcego x={1400} y={34} escala={1} />
      <Morcego x={1800} y={46} escala={0.7} />
    </svg>
  );
}

export default function BandeirolaTopo() {
  return (
    <div style={{ width: "100%", lineHeight: 0 }}>
      <Image
        className="hw-bandeirola-normal"
        src="/bandeirola.webp"
        alt=""
        width={LARGURA}
        height={ALTURA}
        style={{ width: "100%", height: "auto", display: "block", transform: "rotate(180deg)" }}
      />
      <Guirlanda />
    </div>
  );
}
