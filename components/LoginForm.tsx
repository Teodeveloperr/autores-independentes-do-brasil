"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/login/actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(login, undefined);

  return (
    <>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
        <div>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
            E-mail
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="Digite seu e-mail cadastrado"
            style={{ width: "100%", padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
            Senha
          </label>
          <input
            name="senha"
            type="password"
            required
            placeholder="Digite sua senha"
            style={{ width: "100%", padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }}
          />
        </div>
        <label style={{ display: "flex", gap: "8px", fontSize: "14px", alignItems: "center" }}>
          <input type="checkbox" /> Lembrar-me
        </label>
        <a href="/recuperar-senha" style={{ color: "#009B3A", fontSize: "14px", textAlign: "right" }}>
          Esqueci minha senha
        </a>
        {state?.error && (
          <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
            {state.error}
          </div>
        )}
        <button
          type="submit"
          disabled={pending}
          style={{
            background: "#002776",
            color: "white",
            padding: "12px",
            fontWeight: 600,
            borderRadius: "4px",
            marginTop: "8px",
            opacity: pending ? 0.7 : 1,
          }}
        >
          {pending ? "Entrando..." : "Entrar na minha conta"}
        </button>
      </form>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0", fontSize: "14px", color: "#999" }}>
        <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
        continuar com
        <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
      </div>
      <button style={{ background: "white", border: "1px solid #DDD", padding: "12px", width: "100%", fontWeight: 600, marginBottom: "12px", borderRadius: "4px" }}>
        🔵 Continuar com Google
      </button>
      <button style={{ background: "white", border: "1px solid #DDD", padding: "12px", width: "100%", fontWeight: 600, borderRadius: "4px" }}>
        👍 Continuar com Facebook
      </button>
      <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px" }}>
        <p>Ainda não tem uma conta?</p>
        <a
          href="/cadastro"
          style={{
            display: "inline-block",
            background: "white",
            border: "2px solid #009B3A",
            color: "#009B3A",
            padding: "10px 20px",
            fontWeight: 600,
            borderRadius: "4px",
            marginTop: "8px",
            textDecoration: "none",
          }}
        >
          Criar cadastro
        </a>
      </div>
      <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #DDD", textAlign: "center", fontSize: "12px", color: "#999" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "12px" }}>
          <a href="#" style={{ color: "#999" }}>🔒 Ambiente seguro</a>
          <a href="#" style={{ color: "#999" }}>✅ Aprovação do coletivo</a>
          <a href="#" style={{ color: "#999" }}>💬 Suporte dedicado</a>
        </div>
      </div>
    </>
  );
}
