"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { iniciarAssinatura, type AssinarState } from "@/app/assinatura/actions";
import { PLANOS_PAGOS, CICLO_MESES, valorCicloCentavos, type CicloAssinatura } from "@/lib/plans";

function brl(centavos: number) {
  return "R$ " + (centavos / 100).toFixed(2).replace(".", ",");
}

const CICLOS: { id: CicloAssinatura; label: string }[] = [
  { id: "mensal", label: "Mensal" },
  { id: "semestral", label: "Semestral (-10%)" },
  { id: "anual", label: "Anual (menor preço)" },
];

function PlanoPagoCard({
  slug,
  ciclo,
  destaque,
  recursos,
  isLoggedIn,
  planoAtual,
}: {
  slug: "essencial" | "premium";
  ciclo: CicloAssinatura;
  destaque?: boolean;
  recursos: string[];
  isLoggedIn: boolean;
  planoAtual: string;
}) {
  const [state, formAction, pending] = useActionState<AssinarState, FormData>(iniciarAssinatura, undefined);
  const plano = PLANOS_PAGOS[slug];
  const meses = CICLO_MESES[ciclo];
  const totalCiclo = valorCicloCentavos(plano, ciclo);
  const porMes = Math.round(totalCiclo / meses);
  const jaAssinante = planoAtual === plano.nome;

  return (
    <div
      style={{
        background: "white",
        color: "#262626",
        borderRadius: "8px",
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        border: destaque ? "3px solid #FFDF00" : undefined,
        position: "relative",
      }}
    >
      {destaque && (
        <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", background: "#FFDF00", color: "#002776", fontSize: "12px", fontWeight: 700, padding: "4px 16px", borderRadius: "12px", whiteSpace: "nowrap" }}>
          MAIS POPULAR
        </div>
      )}
      <div>
        <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>{plano.nome}</div>
        <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>
          {brl(porMes)}
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>/mês</span>
        </div>
        <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
          {ciclo === "mensal" ? "Cobrado mensalmente" : `Cobrado a cada ${meses} meses: ${brl(totalCiclo)}`}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", flex: 1 }}>
        {recursos.map((r) => (
          <div key={r} style={{ display: "flex", gap: "8px" }}>
            ✅ {r}
          </div>
        ))}
      </div>
      {state?.error && (
        <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
          {state.error}
        </div>
      )}
      {!isLoggedIn ? (
        <Link
          href="/cadastro"
          style={{ display: "block", textAlign: "center", background: destaque ? "#009B3A" : "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}
        >
          Assinar {plano.nome.replace("Autor ", "")}
        </Link>
      ) : jaAssinante ? (
        <div style={{ textAlign: "center", background: "#E3F4E9", color: "#009B3A", padding: "12px", fontWeight: 600, borderRadius: "4px", fontSize: "14px" }}>
          ✓ Seu plano atual
        </div>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="planoSlug" value={slug} />
          <input type="hidden" name="ciclo" value={ciclo} />
          <button
            type="submit"
            disabled={pending}
            style={{ width: "100%", background: destaque ? "#009B3A" : "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", border: "none", fontSize: "14px", opacity: pending ? 0.7 : 1 }}
          >
            {pending ? "Redirecionando..." : `Assinar ${plano.nome.replace("Autor ", "")}`}
          </button>
        </form>
      )}
    </div>
  );
}

export default function AssinaturaPlanos({ isLoggedIn, planoAtual, cta }: { isLoggedIn: boolean; planoAtual: string; cta: string }) {
  const [ciclo, setCiclo] = useState<CicloAssinatura>("mensal");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
        {CICLOS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCiclo(c.id)}
            style={{
              background: ciclo === c.id ? "#FFDF00" : "rgba(255,255,255,0.1)",
              color: ciclo === c.id ? "#002776" : "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px", maxWidth: "1100px", margin: "0 auto", alignItems: "start" }}>
        <div style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Gratuito</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>
              R$ 0<span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>/mês</span>
            </div>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>Para começar sua jornada no coletivo</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", flex: 1 }}>
            <div style={{ display: "flex", gap: "8px" }}>✅ Perfil de autor na plataforma</div>
            <div style={{ display: "flex", gap: "8px" }}>✅ Participação na comunidade</div>
          </div>
          {isLoggedIn && planoAtual === "Gratuito" ? (
            <div style={{ textAlign: "center", background: "#E3F4E9", color: "#009B3A", padding: "12px", fontWeight: 600, borderRadius: "4px", fontSize: "14px" }}>
              ✓ Seu plano atual
            </div>
          ) : (
            <Link href={cta} style={{ display: "block", textAlign: "center", background: "white", border: "2px solid #002776", color: "#002776", padding: "12px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
              Começar grátis
            </Link>
          )}
        </div>

        <PlanoPagoCard
          slug="essencial"
          ciclo={ciclo}
          destaque
          isLoggedIn={isLoggedIn}
          planoAtual={planoAtual}
          recursos={["Livros ilimitados à venda", "Agenda de eventos", "Galeria de fotos", "Dashboard de vendas e pedidos", "Mensagens com leitores"]}
        />

        <PlanoPagoCard
          slug="premium"
          ciclo={ciclo}
          isLoggedIn={isLoggedIn}
          planoAtual={planoAtual}
          recursos={["Tudo do Autor Essencial", "Destaque na página inicial", "Relatórios avançados de vendas", "Prioridade em bienais e feiras", "Suporte dedicado"]}
        />
      </div>
    </>
  );
}
