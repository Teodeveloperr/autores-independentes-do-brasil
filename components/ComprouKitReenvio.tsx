"use client";

import { useState } from "react";
import { reenviarLinkKit } from "@/app/painel/impressaoActions";
import TurnstileWidget from "@/components/TurnstileWidget";

// "Comprei um kit" (página /imprimir): quem perdeu o link recebe outro no e-mail da compra.
export default function ComprouKitReenvio() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [ok, setOk] = useState(false);

  async function enviar(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (enviando) return;
    setErro("");
    setEnviando(true);
    try {
      const token = new FormData(ev.currentTarget).get("cf-turnstile-response");
      const r = await reenviarLinkKit(email, typeof token === "string" ? token : null);
      if (r.error) {
        setErro(r.error);
        (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
      } else setOk(true);
    } catch {
      setErro("Não foi possível enviar agora. Tente de novo em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section id="comprei-um-kit" style={{ background: "white", borderRadius: "10px", padding: "22px", border: "2px solid #FFDF00" }}>
      <h2 style={{ margin: "0 0 4px", fontSize: "16px", fontWeight: 700, color: "#002776" }}>Comprei um Kit Prata ou Kit Ouro</h2>
      <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#555" }}>
        A impressão do seu kit já vem definida. Informe o e-mail da compra e enviamos o link para você mandar o livro, sem escolher nada.
      </p>
      {ok ? (
        <div role="status" style={{ background: "#E8F5EC", color: "#0B5D2A", padding: "14px 16px", borderRadius: "8px", fontSize: "14px", lineHeight: 1.6 }}>
          Se existir um kit pago com esse e-mail, o link foi enviado. Confira a caixa de entrada e o spam.
        </div>
      ) : (
        <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="email"
              required
              autoComplete="email"
              maxLength={160}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErro(""); }}
              placeholder="E-mail usado na compra"
              aria-label="E-mail usado na compra do kit"
              style={{ flex: "1 1 260px", boxSizing: "border-box", padding: "12px", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "14px" }}
            />
            <button type="submit" disabled={enviando} style={{ minHeight: "46px", padding: "0 22px", background: "#009B3A", color: "white", border: "none", borderRadius: "6px", fontSize: "14px", fontWeight: 700, opacity: enviando ? 0.6 : 1 }}>
              {enviando ? "Enviando..." : "Receber o link"}
            </button>
          </div>
          <TurnstileWidget />
          {erro && <div role="alert" style={{ background: "#FDEDEC", color: "#A93226", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>{erro}</div>}
        </form>
      )}
    </section>
  );
}
