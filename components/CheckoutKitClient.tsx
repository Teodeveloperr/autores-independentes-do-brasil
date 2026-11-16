"use client";

import { useState, useTransition } from "react";
import { criarPedidoKit } from "@/app/checkout/kit/actions";
import TurnstileWidget from "@/components/TurnstileWidget";
import { validarCpf } from "@/lib/cpf";
import { MAX_PARCELAS_KIT, horasLegiveis, resumoDoKit, valorKit, type Kit } from "@/lib/kits";

const campo: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" };
const rotulo: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" };

export default function CheckoutKitClient({ kit }: { kit: Kit }) {
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState("");
  const [redirecionando, setRedirecionando] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [parcelas, setParcelas] = useState(1);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    if (!validarCpf(cpf)) {
      setErro("CPF inválido.");
      return;
    }
    const token = new FormData(e.currentTarget).get("cf-turnstile-response");
    startTransition(async () => {
      try {
        const resultado = await criarPedidoKit(kit.id, { nome, email, telefone, cpf }, parcelas, typeof token === "string" ? token : null);
        if ("error" in resultado) {
          setErro(resultado.error);
          // O token do anti-robô vale uma vez só: pede outro para a próxima tentativa.
          (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
          return;
        }
        setRedirecionando(true);
        window.location.href = resultado.invoiceUrl;
      } catch (err) {
        console.error(err);
        setErro("Não foi possível finalizar a contratação. Tente novamente em instantes.");
      }
    });
  }

  if (redirecionando) {
    return (
      <div className="section-pad-md" style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>💳</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Redirecionando para o pagamento...</h2>
        <p style={{ fontSize: "14px", color: "#666", maxWidth: "460px", margin: "0 auto" }}>
          Você vai concluir o pagamento em uma página segura da Asaas.
        </p>
      </div>
    );
  }

  const parcela = kit.valorCentavos / MAX_PARCELAS_KIT;
  const opcoes = [
    { n: 1, titulo: "À vista", texto: `${valorKit(kit.valorCentavos)} no Pix, cartão ou boleto` },
    { n: 2, titulo: `Em ${MAX_PARCELAS_KIT}x sem juros`, texto: `${MAX_PARCELAS_KIT}x de ${valorKit(parcela)} no cartão de crédito` },
  ];

  return (
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "40px", alignItems: "start" }}>
      <form onSubmit={onSubmit} style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: "16px" }}>Seus dados</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label htmlFor="kit-nome" style={rotulo}>Nome completo</label>
              <input id="kit-nome" type="text" autoComplete="name" required maxLength={120} value={nome} onChange={(e) => setNome(e.target.value)} style={campo} />
            </div>
            <div>
              <label htmlFor="kit-email" style={rotulo}>E-mail</label>
              <input id="kit-email" type="email" autoComplete="email" required maxLength={160} value={email} onChange={(e) => setEmail(e.target.value)} style={campo} />
            </div>
            <div>
              <label htmlFor="kit-telefone" style={rotulo}>Telefone</label>
              <input id="kit-telefone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={30} value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={campo} />
            </div>
            <div>
              <label htmlFor="kit-cpf" style={rotulo}>CPF</label>
              <input id="kit-cpf" type="text" inputMode="numeric" required value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" style={campo} />
              <p style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Necessário para gerar a cobrança do pagamento.</p>
            </div>
          </div>
        </div>

        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={{ fontWeight: 700, marginBottom: "12px", padding: 0 }}>Forma de pagamento</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {opcoes.map((o) => (
              <label
                key={o.n}
                style={{ display: "flex", gap: "12px", alignItems: "center", padding: "12px 14px", borderRadius: "8px", cursor: "pointer", border: `2px solid ${parcelas === o.n ? "#009B3A" : "#DDD"}`, background: parcelas === o.n ? "#F1FAF4" : "white" }}
              >
                <input type="radio" name="parcelas" value={o.n} checked={parcelas === o.n} onChange={() => setParcelas(o.n)} style={{ width: "18px", height: "18px", accentColor: "#009B3A" }} />
                <span>
                  <span style={{ display: "block", fontWeight: 700, fontSize: "14px" }}>{o.titulo}</span>
                  <span style={{ display: "block", fontSize: "13px", color: "#555" }}>{o.texto}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <TurnstileWidget />

        {erro && (
          <div role="alert" style={{ background: "#FDEDEC", color: "#A93226", padding: "12px 16px", borderRadius: "8px", fontSize: "13px" }}>
            {erro}
          </div>
        )}

        <button
          type="submit"
          disabled={pending}
          style={{ background: "#009B3A", color: "white", border: "none", padding: "14px 24px", fontWeight: 700, fontSize: "15px", borderRadius: "6px", opacity: pending ? 0.6 : 1 }}
        >
          {pending ? "Processando..." : "Ir para o pagamento"}
        </button>
        <p style={{ margin: 0, fontSize: "12px", color: "#777" }}>O pagamento é concluído em uma página segura da Asaas. Seus dados de cartão não passam pelo nosso site.</p>
      </form>

      <aside style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ fontWeight: 700, color: "#002776", fontSize: "18px" }}>{kit.nome}</div>
        <div style={{ fontSize: "14px", lineHeight: 1.6 }}>{resumoDoKit(kit)}</div>
        <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: 1.7, color: "#444" }}>
          <li>{kit.especificacoes}</li>
          <li>{horasLegiveis(kit.horasLancamento)} na Bienal do Livro Rio 2027</li>
        </ul>
        <div style={{ borderTop: "1px solid #EEE", paddingTop: "12px", display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
          <span>Total</span>
          <span>{valorKit(kit.valorCentavos)}</span>
        </div>
        <div style={{ fontSize: "12px", color: "#666" }}>Parcele em até {MAX_PARCELAS_KIT}x de {valorKit(parcela)} no cartão, sem juros.</div>
      </aside>
    </div>
  );
}
