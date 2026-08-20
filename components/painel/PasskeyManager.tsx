"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startRegistration, browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { iniciarRegistroPasskey, confirmarRegistroPasskey, removerPasskey } from "@/app/painel/actions";

type Passkey = { id: string; deviceLabel: string | null; createdAt: Date; lastUsedAt: Date | null };

export default function PasskeyManager({ passkeys }: { passkeys: Passkey[] }) {
  const [suportado, setSuportado] = useState(false);
  const [pending, setPending] = useState(false);
  const [erro, setErro] = useState("");
  const [removendo, startRemocao] = useTransition();
  const router = useRouter();

  useEffect(() => {
    setSuportado(browserSupportsWebAuthn());
  }, []);

  async function onAdicionar() {
    setErro("");
    setPending(true);
    try {
      const options = await iniciarRegistroPasskey();
      const attestation = await startRegistration({ optionsJSON: options });

      const nomeDispositivo = window.prompt("Dê um nome para identificar este dispositivo (ex: iPhone do João):", "Meu dispositivo");
      if (nomeDispositivo === null) {
        setPending(false);
        return;
      }

      const resultado = await confirmarRegistroPasskey(attestation, nomeDispositivo);
      if (resultado?.error) {
        setErro(resultado.error);
      } else {
        router.refresh();
      }
    } catch {
      setErro("Não foi possível cadastrar a biometria neste dispositivo. Tente novamente.");
    } finally {
      setPending(false);
    }
  }

  function onRemover(id: string) {
    if (!confirm("Remover essa biometria? Você não vai mais conseguir entrar com ela.")) return;
    startRemocao(async () => {
      await removerPasskey(id);
      router.refresh();
    });
  }

  if (!suportado) {
    return (
      <p style={{ fontSize: "12px", color: "#666" }}>
        Seu navegador não suporta login com biometria (Face ID, digital, Windows Hello). Tente em um navegador ou dispositivo mais recente.
      </p>
    );
  }

  return (
    <div>
      {passkeys.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
          {passkeys.map((p) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F6F6F6", borderRadius: "6px", padding: "10px 14px" }}>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 600 }}>{p.deviceLabel || "Dispositivo"}</div>
                <div style={{ fontSize: "11px", color: "#666" }}>
                  {p.lastUsedAt ? `Último uso: ${new Date(p.lastUsedAt).toLocaleDateString("pt-BR")}` : `Adicionado em ${new Date(p.createdAt).toLocaleDateString("pt-BR")}`}
                </div>
              </div>
              <button
                onClick={() => onRemover(p.id)}
                disabled={removendo}
                style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "30px", height: "30px", fontSize: "13px", color: "#C0392B", flexShrink: 0 }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {erro && (
        <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px", marginBottom: "12px" }}>
          {erro}
        </div>
      )}

      <button
        onClick={onAdicionar}
        disabled={pending}
        style={{ background: "white", border: "1px solid #009B3A", color: "#009B3A", padding: "10px 18px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", opacity: pending ? 0.7 : 1 }}
      >
        {pending ? "Configurando..." : "👆 Ativar biometria neste dispositivo"}
      </button>
    </div>
  );
}
