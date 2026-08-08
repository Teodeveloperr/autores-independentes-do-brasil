"use client";

import { useState, useTransition } from "react";
import { sendVisitorMessage } from "@/app/perfil/actions";

export default function EnviarMensagemButton({ authorId }: { authorId: string }) {
  const [open, setOpen] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    setErro("");
    startTransition(async () => {
      const result = await sendVisitorMessage(authorId, formData);
      if (result?.error) {
        setErro(result.error);
        return;
      }
      setEnviado(true);
    });
  }

  function fechar() {
    setOpen(false);
    setEnviado(false);
    setErro("");
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ background: "#009B3A", color: "white", padding: "10px", width: "100%", fontWeight: 600, borderRadius: "4px", border: "none", cursor: "pointer" }}
      >
        💬 Enviar mensagem
      </button>
      {open && (
        <div
          onClick={fechar}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: "20px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", borderRadius: "8px", padding: "28px", maxWidth: "420px", width: "100%" }}
          >
            {enviado ? (
              <>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Mensagem enviada!</h3>
                <p style={{ fontSize: "13px", color: "#444", marginBottom: "20px" }}>O(a) autor(a) vai receber sua mensagem no painel.</p>
                <button
                  onClick={fechar}
                  style={{ background: "#002776", color: "white", padding: "10px 20px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", border: "none", cursor: "pointer" }}
                >
                  Fechar
                </button>
              </>
            ) : (
              <form action={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#002776" }}>Enviar mensagem</h3>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Seu nome</label>
                  <input name="nome" type="text" required style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Mensagem</label>
                  <textarea name="texto" required style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", minHeight: "100px", resize: "vertical" }} />
                </div>
                {erro && <p style={{ fontSize: "12px", color: "#C0392B" }}>{erro}</p>}
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={fechar}
                    style={{ flex: 1, background: "white", border: "1px solid #DDD", padding: "10px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", cursor: "pointer" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    style={{ flex: 1, background: "#009B3A", color: "white", padding: "10px", fontWeight: 700, borderRadius: "6px", fontSize: "13px", opacity: pending ? 0.7 : 1, border: "none", cursor: "pointer" }}
                  >
                    {pending ? "Enviando..." : "Enviar"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
