"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { iniciarLoginPasskey, confirmarLoginPasskey } from "@/app/login/actions";

export default function PasskeyLoginButton() {
  const [suportado, setSuportado] = useState(false);
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState("");
  const router = useRouter();

  useEffect(() => {
    setSuportado(browserSupportsWebAuthn());
  }, []);

  async function onClick() {
    setErro("");
    setPending(true);
    try {
      const options = await iniciarLoginPasskey();
      const assertion = await startAuthentication({ optionsJSON: options });
      const resultado = await confirmarLoginPasskey(assertion);
      if (resultado?.error) {
        setErro(resultado.error);
        setPending(false);
        return;
      }
      router.push("/painel");
      router.refresh();
    } catch {
      setErro("Não foi possível entrar com biometria. Use e-mail e senha, ou tente novamente.");
      setPending(false);
    }
  }

  if (!suportado) return null;

  return (
    <div style={{ marginBottom: "8px" }}>
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          background: "white",
          border: "1px solid #DDD",
          padding: "12px",
          width: "100%",
          fontWeight: 600,
          borderRadius: "4px",
          color: "#262626",
          fontSize: "14px",
          opacity: pending ? 0.7 : 1,
        }}
      >
        👆 {pending ? "Verificando..." : "Entrar com biometria"}
      </button>
      {erro && (
        <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px", marginTop: "10px" }}>
          {erro}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0", fontSize: "14px", color: "#999" }}>
        <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
        ou entre com e-mail
        <div style={{ flex: 1, height: "1px", background: "#DDD" }} />
      </div>
    </div>
  );
}
