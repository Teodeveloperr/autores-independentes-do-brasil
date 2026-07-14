"use client";

import { useActionState } from "react";
import { requestPasswordReset, type RequestResetState } from "@/app/recuperar-senha/actions";

export default function RecuperarSenhaForm() {
  const [state, formAction, pending] = useActionState<RequestResetState, FormData>(
    requestPasswordReset,
    undefined
  );

  if (state?.sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>✅</div>
        <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px", color: "#002776" }}>
          Verifique seu e-mail
        </h2>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>
          Se existir uma conta com esse e-mail, enviamos um link para você redefinir sua senha.
          O link expira em 1 hora.
        </p>
        <a
          href="/login"
          style={{ display: "inline-block", background: "#002776", color: "white", padding: "12px 28px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}
        >
          Ir para o login
        </a>
      </div>
    );
  }

  return (
    <>
      <h2 style={{ fontSize: "28px", fontWeight: 700, marginBottom: "12px", textAlign: "center", color: "#002776" }}>
        Recuperar senha
      </h2>
      <p style={{ fontSize: "14px", color: "#666", textAlign: "center", marginBottom: "28px" }}>
        Informe o e-mail da sua conta para receber o link de redefinição.
      </p>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
            E-mail cadastrado
          </label>
          <input
            name="email"
            type="email"
            required
            placeholder="seunome@email.com"
            style={{ width: "100%", padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }}
          />
        </div>
        {state?.error && (
          <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
            {state.error}
          </div>
        )}
        <button type="submit" disabled={pending} style={{ background: "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", opacity: pending ? 0.7 : 1 }}>
          {pending ? "Enviando..." : "Continuar"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #DDD", fontSize: "14px" }}>
        <a href="/login" style={{ color: "#009B3A", fontWeight: 600 }}>← Voltar para o login</a>
      </div>
    </>
  );
}
