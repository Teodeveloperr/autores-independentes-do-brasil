"use client";

import { useActionState } from "react";
import { resetPassword, type ResetState } from "@/app/redefinir-senha/actions";

export default function RedefinirSenhaForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<ResetState, FormData>(resetPassword, undefined);

  if (state?.ok) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>✅</div>
        <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "12px", color: "#002776" }}>
          Senha atualizada!
        </h2>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "24px" }}>
          Sua senha foi redefinida com sucesso. Já pode entrar com a nova senha.
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
        Criar nova senha
      </h2>
      <p style={{ fontSize: "14px", color: "#666", textAlign: "center", marginBottom: "28px" }}>
        Defina a nova senha da sua conta.
      </p>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <input type="hidden" name="token" value={token} />
        <div>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
            Nova senha
          </label>
          <input
            name="senha"
            type="password"
            required
            placeholder="Crie uma nova senha"
            style={{ width: "100%", padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }}
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" }}>
            Confirmar nova senha
          </label>
          <input
            name="confirmar"
            type="password"
            required
            placeholder="Repita a nova senha"
            style={{ width: "100%", padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }}
          />
        </div>
        {state?.error && (
          <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
            {state.error}
          </div>
        )}
        <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "4px", opacity: pending ? 0.7 : 1 }}>
          {pending ? "Salvando..." : "Salvar nova senha"}
        </button>
      </form>
      <div style={{ textAlign: "center", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #DDD", fontSize: "14px" }}>
        <a href="/login" style={{ color: "#009B3A", fontWeight: 600 }}>← Voltar para o login</a>
      </div>
    </>
  );
}
