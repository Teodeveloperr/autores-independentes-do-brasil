"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { iniciarAssinatura, type AssinarState } from "@/app/assinatura/actions";
import { PLANOS_PAGOS, CICLO_MESES, valorCicloCentavos, PLANO_RANK, type CicloAssinatura } from "@/lib/plans";

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
  descontoFidelidadePct,
}: {
  slug: "essencial" | "premium";
  ciclo: CicloAssinatura;
  destaque?: boolean;
  recursos: string[];
  isLoggedIn: boolean;
  planoAtual: string;
  descontoFidelidadePct: number;
}) {
  const [state, formAction, pending] = useActionState<AssinarState, FormData>(iniciarAssinatura, undefined);
  const plano = PLANOS_PAGOS[slug];
  const meses = CICLO_MESES[ciclo];
  const totalCiclo = valorCicloCentavos(plano, ciclo);
  const jaAssinante = planoAtual === plano.nome;
  const ehUpgrade = planoAtual !== "Iniciante" && !jaAssinante && (PLANO_RANK[plano.nome] ?? 0) > (PLANO_RANK[planoAtual] ?? 0);
  const temDesconto = ehUpgrade && descontoFidelidadePct > 0;
  const totalCicloComDesconto = temDesconto ? Math.round(totalCiclo * (1 - descontoFidelidadePct / 100)) : totalCiclo;
  const porMes = Math.round(totalCicloComDesconto / meses);

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
        {temDesconto && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px", color: "#999", textDecoration: "line-through" }}>{brl(Math.round(totalCiclo / meses))}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "white", background: "#C0392B", padding: "1px 6px", borderRadius: "10px" }}>
              🎉 Fidelidade: -{descontoFidelidadePct}%
            </span>
          </div>
        )}
        <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>
          {brl(porMes)}
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>/mês</span>
        </div>
        <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
          {ciclo === "mensal" ? "Cobrado mensalmente" : `Cobrado a cada ${meses} meses: ${brl(totalCicloComDesconto)}`}
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
      ) : state?.pixQrCode ? (
        <div style={{ textAlign: "center", background: "#F6F6F6", borderRadius: "6px", padding: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}>Escaneie com o app do seu banco pra autorizar a cobrança automática:</p>
          {state.pixQrCode.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`data:image/png;base64,${state.pixQrCode.image}`} alt="QR Code Pix Automático" style={{ width: "180px", height: "180px", margin: "0 auto 10px" }} />
          )}
          <textarea
            readOnly
            value={state.pixQrCode.payload}
            onClick={(e) => e.currentTarget.select()}
            rows={3}
            style={{ width: "100%", fontSize: "11px", padding: "8px", border: "1px solid #DDD", borderRadius: "4px", resize: "none" }}
          />
          <p style={{ fontSize: "11px", color: "#666", marginTop: "10px" }}>
            Depois de autorizar, seu plano é ativado automaticamente — você pode fechar esta tela e conferir no seu painel.
          </p>
        </div>
      ) : (
        <form action={formAction}>
          <input type="hidden" name="planoSlug" value={slug} />
          <input type="hidden" name="ciclo" value={ciclo} />
          <input
            name="cpf"
            type="text"
            placeholder="Seu CPF"
            required
            style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px", marginBottom: "10px" }}
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="submit"
              name="metodoPagamento"
              value="cartao"
              disabled={pending}
              style={{ flex: 1, background: "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", border: "none", fontSize: "13px", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "..." : "Cartão"}
            </button>
            <button
              type="submit"
              name="metodoPagamento"
              value="pix"
              disabled={pending}
              style={{ flex: 1, background: destaque ? "#009B3A" : "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", border: "none", fontSize: "13px", opacity: pending ? 0.7 : 1 }}
            >
              {pending ? "..." : "Pix"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default function AssinaturaPlanos({
  isLoggedIn,
  planoAtual,
  descontoFidelidadePct,
  cta,
}: {
  isLoggedIn: boolean;
  planoAtual: string;
  descontoFidelidadePct: number;
  cta: string;
}) {
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
            <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Iniciante</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>
              R$ 0<span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>/mês</span>
            </div>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>Comece sua jornada, construa sua presença e apresente sua trajetória ao mundo.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", flex: 1 }}>
            <div style={{ display: "flex", gap: "8px" }}>✅ Perfil público limitado</div>
            <div style={{ display: "flex", gap: "8px" }}>✅ Foto e minibio (até 300 caracteres)</div>
            <div style={{ display: "flex", gap: "8px" }}>✅ Redes sociais</div>
            <div style={{ display: "flex", gap: "8px" }}>✅ Portfólio cultural em PDF limitado</div>
            <div style={{ display: "flex", gap: "8px" }}>✅ Avaliações de leitores</div>
          </div>
          {isLoggedIn && planoAtual === "Iniciante" ? (
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
          descontoFidelidadePct={descontoFidelidadePct}
          recursos={[
            "Perfil público completo",
            "Portfólio cultural em PDF completo",
            "Venda de livros (comissão de 25%)",
            "Galeria de fotos",
            "Agenda de eventos",
            "Loja própria",
            "Relatório de vendas básico",
          ]}
        />

        <PlanoPagoCard
          slug="premium"
          ciclo={ciclo}
          isLoggedIn={isLoggedIn}
          planoAtual={planoAtual}
          descontoFidelidadePct={descontoFidelidadePct}
          recursos={[
            "Tudo do Autor Essencial",
            "Comissão reduzida (10%)",
            "Destaque nas páginas de Autores e Livros",
            "Destaque na página inicial",
            "Selo de perfil verificado",
            "Desconto de 10% em bienais",
            "Relatório de vendas detalhado",
            "Prioridade no suporte",
          ]}
        />
      </div>
    </>
  );
}
