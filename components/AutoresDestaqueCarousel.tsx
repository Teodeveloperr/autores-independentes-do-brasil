import Link from "next/link";
import { initials } from "@/lib/format";

type AutorDestaque = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  generos: string[];
};

const CARD_WIDTH_PX = 200;
const GAP_PX = 24;
const SEGUNDOS_POR_CARD = 3;

function Card({ a }: { a: AutorDestaque }) {
  return (
    <div style={{ flex: `0 0 ${CARD_WIDTH_PX}px`, background: "#F6F6F6", padding: "24px", borderRadius: "8px", textAlign: "center" }}>
      <div
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          margin: "0 auto 16px",
          background: a.fotoUrl ? `center / cover no-repeat url(${a.fotoUrl})` : "#E0E0E0",
          display: a.fotoUrl ? undefined : "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          color: "#002776",
        }}
      >
        {!a.fotoUrl && initials(a.nome)}
      </div>
      <div style={{ fontWeight: 600, marginBottom: "8px", color: "#262626" }}>{a.nome}</div>
      <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>{a.generos.join(", ") || "—"}</div>
      <Link
        href={`/perfil/${a.id}`}
        style={{ display: "block", textAlign: "center", background: "#002776", color: "white", padding: "10px 20px", fontWeight: 600, width: "100%", borderRadius: "4px", textDecoration: "none" }}
      >
        VER PERFIL
      </Link>
    </div>
  );
}

// Faixa contínua e infinita (efeito "marquee"): a lista de autores é duplicada uma vez e a
// faixa desliza via CSS puro até -50% (o tamanho de uma cópia inteira) e reseta pra 0% —
// como as duas metades são idênticas, o reset é imperceptível e o carrossel parece girar
// pra sempre, sem espaços vazios (cada card é sempre um autor de verdade, nunca uma célula
// vaga de grid) e sem pausar no hover, mesmo padrão dos outros carrosséis do site.
export default function AutoresDestaqueCarousel({ autores }: { autores: AutorDestaque[] }) {
  if (autores.length === 0) return null;

  const duplicado = [...autores, ...autores];
  const duracaoSegundos = autores.length * SEGUNDOS_POR_CARD;

  return (
    <div style={{ overflow: "hidden" }}>
      <div
        className="autores-destaque-marquee"
        style={{ display: "flex", gap: `${GAP_PX}px`, width: "max-content", animationDuration: `${duracaoSegundos}s` }}
      >
        {duplicado.map((a, i) => (
          <Card key={`${a.id}-${i}`} a={a} />
        ))}
      </div>
    </div>
  );
}
