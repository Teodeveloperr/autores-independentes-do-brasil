"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  validateStep1,
  createAccount,
  type Step1Data,
  type PlanId,
  type Cycle,
} from "@/app/cadastro/actions";
import GoogleIcon from "./GoogleIcon";
import PasswordInput from "./PasswordInput";
import PasswordStrengthChecklist from "./PasswordStrengthChecklist";
import { GENEROS } from "@/lib/genres";
import { PLANOS_PAGOS, valorCicloCentavos } from "@/lib/plans";
import { validarCpf } from "@/lib/cpf";

const PLANS: { id: PlanId; nome: string; desc: string; badge: string; disponivel: boolean }[] = [
  { id: "free", nome: "Iniciante", desc: "Para começar sua jornada no coletivo", badge: "", disponivel: true },
  { id: "essencial", nome: "Autor Essencial", desc: "Tudo que você precisa para vender e divulgar", badge: "", disponivel: true },
  { id: "premium", nome: "Autor Premium", desc: "Máxima visibilidade para suas obras", badge: "", disponivel: true },
];

const CICLOS: { id: Cycle; label: string }[] = [
  { id: "mensal", label: "Mensal" },
  { id: "semestral", label: "Semestral (-10%)" },
  { id: "anual", label: "Anual (menor preço)" },
];

function brl(centavos: number) {
  return "R$ " + (centavos / 100).toFixed(2).replace(".", ",");
}

function priceFor(id: PlanId, cycle: Cycle) {
  if (id === "free") return { preco: brl(0), suffix: "/mês" };
  const total = valorCicloCentavos(PLANOS_PAGOS[id], cycle);
  const suffix = cycle === "anual" ? "/ano" : cycle === "semestral" ? "/semestre" : "/mês";
  return { preco: brl(total), suffix };
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
  const [plan, setPlan] = useState<PlanId>("free");
  const [cpf, setCpf] = useState("");
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [step1Error, setStep1Error] = useState("");
  const [finishError, setFinishError] = useState("");
  const [senha, setSenha] = useState("");
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
    if (plan !== "free" && !validarCpf(cpf)) {
      setFinishError("CPF inválido.");
      return;
    }
    setFinishError("");
    startTransition(async () => {
      try {
        await createAccount(step1Data, plan, cycle, cpf);
      } catch (e) {
        // redirect() lança um erro especial (digest "NEXT_REDIRECT") pra navegar —
        // não é um erro de verdade, só deixa o redirecionamento seguir normalmente.
        if (typeof e === "object" && e !== null && "digest" in e && typeof e.digest === "string" && e.digest.startsWith("NEXT_REDIRECT")) {
          return;
        }
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
  const selPrice = priceFor(selPlan.id, cycle);

  return (
    <div className="section-pad-md" style={{ flex: 1, background: "white", color: "#262626", padding: "40px 48px", borderRadius: "12px", maxWidth: "720px", width: "100%" }}>
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
            <div>
              <label style={labelStyle}>Gêneros literários (selecione um ou mais)</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 16px", padding: "12px", border: "1px solid #DDD", borderRadius: "6px" }}>
                {GENEROS.map((g) => (
                  <label key={g} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      name="generos"
                      value={g}
                      defaultChecked={step1Data?.generos ? step1Data.generos.includes(g) : g === "Romance"}
                    />
                    {g}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>Cidade / UF</label>
              <input name="cidade" type="text" required placeholder="Ex: São Paulo, SP" style={inputStyle} defaultValue={step1Data?.cidade} />
            </div>
            <div>
              <label style={labelStyle}>Bio breve (opcional)</label>
              <textarea name="bio" placeholder="Fale um pouco sobre você e sua escrita..." style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }} defaultValue={step1Data?.bio} />
            </div>
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label style={labelStyle}>Senha</label>
                <PasswordInput name="senha" required minLength={8} autoComplete="new-password" placeholder="Crie uma senha" style={inputStyle} onChange={setSenha} />
              </div>
              <div>
                <label style={labelStyle}>Confirmar senha</label>
                <PasswordInput name="confirmar" required minLength={8} autoComplete="new-password" placeholder="Repita a senha" style={inputStyle} />
              </div>
            </div>
            <PasswordStrengthChecklist senha={senha} />
            <label style={{ display: "flex", gap: "8px", fontSize: "13px", alignItems: "flex-start", marginTop: "4px" }}>
              <input type="checkbox" required style={{ marginTop: "3px" }} />
              <span>
                Li e concordo com os{" "}
                <Link href="/termos-de-uso" target="_blank" rel="noopener noreferrer" style={{ color: "#002776", fontWeight: 600 }}>
                  Termos de Uso
                </Link>{" "}
                e a{" "}
                <Link href="/politica-de-privacidade" target="_blank" rel="noopener noreferrer" style={{ color: "#002776", fontWeight: 600 }}>
                  Política de Privacidade
                </Link>
              </span>
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
          <a
            href="/api/auth/google"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "white", border: "1px solid #DDD", padding: "12px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", color: "#262626", textDecoration: "none" }}
          >
            <GoogleIcon size={16} /> Continuar com Google
          </a>
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "14px" }}>
            Já tem uma conta? <a href="/login" style={{ color: "#009B3A", fontWeight: 600 }}>Entrar</a>
          </p>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "6px" }}>Escolha seu plano</h2>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>
            Comece grátis no Iniciante ou já escolha um plano pago — você pode trocar quando quiser depois.
          </p>
          {plan !== "free" && (
            <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
              {CICLOS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCycle(c.id)}
                  style={{
                    background: cycle === c.id ? "#009B3A" : "white",
                    color: cycle === c.id ? "white" : "#262626",
                    border: cycle === c.id ? "none" : "1px solid #DDD",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {PLANS.map((p) => {
              const pr = priceFor(p.id, cycle);
              const sel = plan === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={!p.disponivel}
                  onClick={() => p.disponivel && setPlan(p.id)}
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
                    opacity: p.disponivel ? 1 : 0.55,
                    cursor: p.disponivel ? "pointer" : "not-allowed",
                  }}
                >
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                      {p.nome}
                      {p.badge && (
                        <span style={{ background: p.disponivel ? "#FFDF00" : "#DDD", color: p.disponivel ? "#002776" : "#666", fontSize: "10px", fontWeight: 700, padding: "3px 8px", borderRadius: "10px" }}>
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

          <div style={{ background: "#E9F5EE", border: "1px solid #BFE3CE", borderRadius: "8px", padding: "20px", textAlign: "center", fontSize: "14px", marginBottom: "24px" }}>
            {plan === "free" ? (
              <>🎉 O plano <strong>Iniciante</strong> não tem cobrança. Você pode fazer upgrade quando quiser depois.</>
            ) : (
              <>🔒 Sua conta será criada agora, e em seguida você será redirecionado(a) pra concluir o pagamento com segurança.</>
            )}
          </div>

          {plan !== "free" && (
            <div style={{ marginBottom: "24px" }}>
              <label style={labelStyle}>CPF</label>
              <input
                type="text"
                required
                placeholder="Seu CPF"
                style={inputStyle}
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>
          )}

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
              {pending ? "Finalizando..." : plan === "free" ? "Concluir cadastro" : "Ir para pagamento"}
            </button>
          </div>

          <p style={{ textAlign: "center", fontSize: "12px", color: "#999", marginTop: "20px" }}>
            🔒 Pagamento seguro · Cancele quando quiser · Sem taxa de adesão
          </p>
        </div>
      )}
    </div>
  );
}
