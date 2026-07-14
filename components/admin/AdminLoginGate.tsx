"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { adminLogin, type AdminLoginState } from "@/app/admin/actions";

export default function AdminLoginGate() {
  const [state, formAction, pending] = useActionState<AdminLoginState, FormData>(adminLogin, undefined);

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#002776" }}>
      <form action={formAction} style={{ background: "white", padding: "40px", borderRadius: "10px", width: "100%", maxWidth: "380px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div style={{ textAlign: "center", marginBottom: "8px" }}>
          <Image src="/logo.png" alt="Logo" width={140} height={50} style={{ height: "50px", width: "auto", objectFit: "contain", margin: "0 auto" }} />
        </div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, color: "#002776", textAlign: "center" }}>Área do Administrador</h1>
        <p style={{ fontSize: "13px", color: "#666", textAlign: "center", marginBottom: "8px" }}>Acesso restrito à equipe do coletivo.</p>
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Senha de administrador</label>
          <input name="senha" type="password" required placeholder="Digite a senha" style={{ width: "100%", padding: "12px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }} />
        </div>
        {state?.error && (
          <div style={{ color: "#C0392B", fontSize: "13px", textAlign: "center" }}>{state.error}</div>
        )}
        <button type="submit" disabled={pending} style={{ background: "#002776", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}>
          {pending ? "Entrando..." : "Entrar"}
        </button>
        <Link href="/" style={{ textAlign: "center", fontSize: "13px", color: "#666" }}>← Voltar ao site</Link>
      </form>
    </div>
  );
}
