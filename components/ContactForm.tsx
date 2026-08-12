"use client";

import { useActionState } from "react";
import { submitContactForm, type ContactFormState } from "@/app/actions";

const inputStyle: React.CSSProperties = { padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" };

export default function ContactForm() {
  const [state, formAction, pending] = useActionState<ContactFormState, FormData>(submitContactForm, undefined);

  if (state?.success) {
    return (
      <div style={{ background: "#E9F5EE", border: "1px solid #BFE3CE", borderRadius: "8px", padding: "24px", textAlign: "center" }}>
        <p style={{ fontSize: "15px", fontWeight: 600, color: "#009B3A" }}>Mensagem enviada com sucesso!</p>
        <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>Em breve entraremos em contato.</p>
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <input
        name="website"
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", overflow: "hidden" }}
      />
      <input name="nome" type="text" required placeholder="Nome" style={inputStyle} />
      <input name="email" type="email" required placeholder="E-mail" style={inputStyle} />
      <input name="assunto" type="text" placeholder="Assunto" style={inputStyle} />
      <textarea name="mensagem" required placeholder="Mensagem" style={{ ...inputStyle, minHeight: "120px", resize: "none" }} />
      {state?.error && (
        <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
          {state.error}
        </div>
      )}
      <button type="submit" disabled={pending} style={{ background: "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", opacity: pending ? 0.7 : 1 }}>
        {pending ? "Enviando..." : "ENVIAR MENSAGEM"}
      </button>
    </form>
  );
}
