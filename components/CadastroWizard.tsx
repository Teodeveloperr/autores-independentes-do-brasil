"use client";

import { useState, useTransition } from "react";
import {
  validateStep1,
  createAccount,
  type Step1Data,
  type PlanId,
  type Cycle,
} from "@/app/cadastro/actions";

const PLANS: { id: PlanId; nome: string; desc: string; monthly: number; badge: string }[] = [
  { id: "free", nome: "Gratuito", desc: "Para começar sua jornada no coletivo", monthly: 0, badge: "" },
  { id: "essencial", nome: "Autor Essencial", desc: "Tudo que você precisa para vender e divulgar", monthly: 2990, badge: "MAIS POPULAR" },
  { id: "premium", nome: "Autor Premium", desc: "Máxima visibilidade para suas obras", monthly: 4990, badge: "" },
];

function brl(centavos: number) {
  return "R$ " + (centavos / 100).toFixed(2).replace(".", ",");
}

function priceFor(monthly: number, cycle: Cycle) {
  if (monthly === 0) return { preco: brl(0), suffix: "/mês" };
  if (cycle === "semestral") return { preco: brl(Math.round(monthly * 6 * 0.9)), suffix: "/semestre" };
  if (cycle === "anual") return { preco: brl(Math.round(monthly * 12 * 0.8)), suffix: "/ano" };
  return { preco: brl(monthly), suffix: "/mês" };
}

function cycleLabel(cycle: Cycle) {
  return cycle === "semestral" ? "Semestral" : cycle === "anual" ? "Anual" : "Mensal";
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  border: "1px solid #DDD",
  borderRadius: "6px",
  fontSize: "14px",
};
const labelStyle: React.CSSProperties = { display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" };

export default function CadastroWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cycle, setCycle] = useState<Cycle>("mensal");
  const [plan, setPlan] = useState<PlanId>("essencial");
  const [method, setMethod] = useState<"cartao" | "pix">("cartao");
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step1Error, setStep1Error] = useState("");
  const [finishError, setFinishError] = useState("");
  const [pending, startTransition] = useTransition();

  function submitStep1(formData: FormData) {
    setStep1Error("");
    startTransition(async () => {
      const result = await validateStep1(formData);
      if ("error" in result) {
        setStep1Error(result.error);
        return;
      }
      setStep1Data(result.data);
      setStep(2);
      window.scrollTo(0, 0);
    });
  }

  function finish() {
    if (!step1Data) return;
    setFinishError("");
    startTransition(async () => {
      try {
        await createAccount(step1Data, plan, cycle);
      } catch (e) {
        setFinishError(e instanceof Error ? e.message : "Não foi possível concluir o cadastro.");
      }
    });
  }

  const circle = (active: boolean, done: boolean): React.CSSProperties => ({
    width: "38px",
    height: "38px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: "15px",
    background: active ? "#009B3A" : done ? "#002776" : "#E5E7EB",
    color: active || done ? "white" : "#999",
  });
  const label = (active: boolean): React.CSSProperties => ({
    fontSize: "12px",
    fontWeight: active ? 700 : 500,
    color: active ? "#002776" : "#999",
  });
  const bar = (done: boolean): React.CSSProperties => ({
    flex: 1,
    height: "2px",
    background: done ? "#002776" : "#E5E7EB",
    margin: "0 8px",
    marginBottom: "22px",
  });

  const selPlan = PLANS.find((p) => p.id === plan)!;
  const selPrice = priceFor(selPlan.monthly, cycle);
  const isFree = plan === "free";

  const cyc = (id: Cycle): React.CSSProperties => ({
    background: cycle === id ? "white" : "transparent",
    color: cycle === id ? "#002776" : "#666",
    fontWeight: cycle === id ? 700 : 500,
    padding: "8px 16px",
    borderRadius: "6px",
    fontSize: "13px",
    boxShadow: cycle === id ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
  });

  const methodBtn = (id: "cartao" | "pix"): React.CSSProperties => ({
    flex: 1,
    background: method === id ? "#F1F8F4" : "white",
    border: method === id ? "2px solid #009B3A" : "1px solid #DDD",
    color: "#262626",
    padding: "14px",
    fontWeight: 600,
    borderRadius: "6px",
    fontSize: "14px",
  });

  return (
    <div style={{ flex: 1, background: "white", color: "#262626", padding: "40px 48px", borderRadius: "12px", maxWidth: "720px" }}>
      <div style={{ display: "flex", alignItems: "center", marginBottom: "32px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <div style={circle(step === 1, step > 1)}>1</div>
          <div style={label(step === 1)}>Dados</div>
        </div>
        <div style={bar(step > 1)} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <div style={circle(step === 2, step > 2)}>2</div>
          <div style={label(step === 2)}>Plano</div>
        </div>
        <div style={bar(step > 2)} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <div style={circle(step === 3, false)}>3</div>
          <div style={label(step === 3)}>Pagamento</div>
        </div>
      </div>

      {step === 1 && (
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "6px" }}>Seus dados</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "28px" }}>
            Preencha suas informações para criar a conta de autor(a).
          </p>
          <form action={submitStep1} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label style={labelStyle}>Nome completo</label>
              <input name="nome" type="text" required placeholder="Digite seu nome completo" style={inputStyle} defaultValue={step1Data?.nome} />
            </div>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input name="email" type="email" required placeholder="seunome@email.com" style={inputStyle} defaultValue={step1Data?.email} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Gênero literário principal</label>
                <select name="genero" style={inputStyle} defaultValue={step1Data?.genero ?? "Romance"}>
                  {["Romance", "Poesia", "Ficção", "Fantasia", "Terror", "Ficção Científica", "Infantil", "Biografia"].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Cidade / UF</label>
                <input name="cidade" type="text" required placeholder="Ex: São Paulo, SP" style={inputStyle} defaultValue={step1Data?.cidade} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Bio breve (opcional)</label>
              <textarea name="bio" placeholder="Fale um pouco sobre você e sua escrita..." style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }} defaultValue={step1Data?.bio} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Senha</label>
                <input name="senha" type="password" required placeholder="Crie uma senha" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <input name="confirmar" type="password" required placeholder="Repita a senha" style={inputStyle} />
              </div>
            </div>
            <label style={{ display: "flex", gap: "8px", fontSize: "13px", alignItems: "flex-start", marginTop: "4px" }}>
              <input type="checkbox" required style={{ marginTop: "3px" }} /> Li e concordo com os Termos de Uso e a Política de Privacidade
            </label>
            {step1Error && (
              <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
                {step1Error}
              </div>
            )}
            <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "14px", fontWeight: 700, borderRadius: "6px", fontSize: "15px", marginTop: "8px", opacity: pending ? 0.7 : 1 }}>
              {pending ? "Validando..." : "Continuar →"}
            </button>
          </form>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0", fontSize: "13px", color: "#999" }}>
            <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
            ou cadastre-se com
            <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button style={{ flex: 1, background: "white", border: "1px solid #DDD", padding: "12px", fontWeight: 600, borderRadius: "6px", fontSize: "13px" }}>🔵 Google</button>
            <button style={{ flex: 1, background: "white", border: "1px solid #DDD", padding: "12px", fontWeight: 600, borderRadius: "6px", fontSize: "13px" }}>👍 Facebook</button>
          </div>
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
            Já tem uma conta? <a href="/login" style={{ color: "#009B3A", fontWeight: 600 }}>Entrar</a>
          </p>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "6px" }}>Escolha seu plano</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            Selecione o ciclo e o plano ideal. Cancele quando quiser.
          </p>
          <div style={{ display: "inline-flex", background: "#F0F1F3", borderRadius: "8px", padding: "4px", marginBottom: "24px" }}>
            <button onClick={() => setCycle("mensal")} style={cyc("mensal")}>Mensal</button>
            <button onClick={() => setCycle("semestral")} style={cyc("semestral")}>
              Semestral <span style={{ fontSize: "11px" }}>-10%</span>
            </button>
            <button onClick={() => setCycle("anual")} style={cyc("anual")}>
              Anual <span style={{ fontSize: "11px" }}>-20%</span>
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {PLANS.map((p) => {
              const pr = priceFor(p.monthly, cycle);
              const sel = plan === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "16px",
                    width: "100%",
                    background: sel ? "#F1F8F4" : "white",
                    border: sel ? "2px solid #009B3A" : "1px solid #DDD",
                    borderRadius: "8px",
                    padding: "18px 20px",
                    textAlign: "left",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                      {p.nome}
                      {p.badge && (
                        <span style={{ background: "#FFDF00", color: "#002776", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "10px" }}>
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>{p.desc}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>{pr.preco}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>{pr.suffix}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "28px" }}>
            <button onClick={() => setStep(1)} style={{ flex: "0 0 auto", background: "white", border: "1px solid #CCC", color: "#262626", padding: "14px 24px", fontWeight: 600, borderRadius: "6px", fontSize: "15px" }}>
              ← Voltar
            </button>
            <button onClick={() => setStep(3)} style={{ flex: 1, background: "#009B3A", color: "white", padding: "14px", fontWeight: 700, borderRadius: "6px", fontSize: "15px" }}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "6px" }}>Pagamento</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "24px" }}>
            Revise seu plano e informe os dados de pagamento.
          </p>
          <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#666" }}>Plano selecionado</div>
              <div style={{ fontWeight: 700, fontSize: "16px" }}>
                {selPlan.nome} · {cycleLabel(cycle)}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#002776" }}>{selPrice.preco}</div>
              <div style={{ fontSize: "12px", color: "#666" }}>{selPrice.suffix}</div>
            </div>
          </div>

          {isFree && (
            <div style={{ background: "#E9F5EE", border: "1px solid #BFE3CE", borderRadius: "8px", padding: "20px", textAlign: "center", fontSize: "14px", marginBottom: "24px" }}>
              🎉 O plano <strong>Gratuito</strong> não tem cobrança. Você pode fazer upgrade a qualquer momento pelo seu painel.
            </div>
          )}

          {!isFree && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "12px" }}>
                <button type="button" onClick={() => setMethod("cartao")} style={methodBtn("cartao")}>💳 Cartão de crédito</button>
                <button type="button" onClick={() => setMethod("pix")} style={methodBtn("pix")}>⚡ Pix</button>
              </div>

              {method === "cartao" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <label style={labelStyle}>Nome no cartão</label>
                    <input type="text" placeholder="Nome como está no cartão" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Número do cartão</label>
                    <input type="text" placeholder="0000 0000 0000 0000" style={inputStyle} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                    <div>
                      <label style={labelStyle}>Validade</label>
                      <input type="text" placeholder="MM/AA" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>CVV</label>
                      <input type="text" placeholder="123" style={inputStyle} />
                    </div>
                  </div>
                </div>
              )}

              {method === "pix" && (
                <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "28px", textAlign: "center" }}>
                  <div style={{ width: "140px", height: "140px", background: "white", border: "1px solid #DDD", borderRadius: "8px", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "48px" }}>
                    🔳
                  </div>
                  <div style={{ fontSize: "13px", color: "#666" }}>
                    Escaneie o QR Code com o app do seu banco para concluir o pagamento.
                  </div>
                </div>
              )}

              {finishError && (
                <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
                  {finishError}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                <button type="button" onClick={() => setStep(2)} style={{ flex: "0 0 auto", background: "white", border: "1px solid #CCC", color: "#262626", padding: "14px 24px", fontWeight: 600, borderRadius: "6px", fontSize: "15px" }}>
                  ← Voltar
                </button>
                <button type="button" onClick={finish} disabled={pending} style={{ flex: 1, background: "#009B3A", color: "white", padding: "14px", fontWeight: 700, borderRadius: "6px", fontSize: "15px", opacity: pending ? 0.7 : 1 }}>
                  {pending ? "Finalizando..." : "Finalizar cadastro"}
                </button>
              </div>
            </div>
          )}

          {isFree && (
            <>
              {finishError && (
                <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px", marginBottom: "16px" }}>
                  {finishError}
                </div>
              )}
              <div style={{ display: "flex", gap: "12px" }}>
                <button onClick={() => setStep(2)} style={{ flex: "0 0 auto", background: "white", border: "1px solid #CCC", color: "#262626", padding: "14px 24px", fontWeight: 600, borderRadius: "6px", fontSize: "15px" }}>
                  ← Voltar
                </button>
                <button onClick={finish} disabled={pending} style={{ flex: 1, background: "#009B3A", color: "white", padding: "14px", fontWeight: 700, borderRadius: "6px", fontSize: "15px", opacity: pending ? 0.7 : 1 }}>
                  {pending ? "Finalizando..." : "Concluir cadastro"}
                </button>
              </div>
            </>
          )}

          <p style={{ textAlign: "center", fontSize: "12px", color: "#999", marginTop: "20px" }}>
            🔒 Pagamento seguro · Cancele quando quiser · Sem taxa de adesão
          </p>
        </div>
      )}
    </div>
  );
}
