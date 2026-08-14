"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  iniciarConfiguracao2FA,
  confirmarAtivacao2FA,
  desativar2FA,
  type Confirmar2FAState,
  type Desativar2FAState,
} from "@/app/admin/actions";

const cardStyle: React.CSSProperties = { background: "white", borderRadius: "10px", padding: "24px", maxWidth: "480px" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" };

export default function AdminSegurancaView({ totpEnabled }: { totpEnabled: boolean }) {
  const router = useRouter();
  const [setup, setSetup] = useState<{ secret: string; qrDataUrl: string } | null>(null);
  const [carregandoSetup, startSetupTransition] = useTransition();
  const [confirmState, confirmAction, confirmPending] = useActionState<Confirmar2FAState, FormData>(confirmarAtivacao2FA, undefined);
  const [mostrarDesativar, setMostrarDesativar] = useState(false);
  const [disableState, disableAction, disablePending] = useActionState<Desativar2FAState, FormData>(desativar2FA, undefined);

  function iniciar() {
    startSetupTransition(async () => {
      const result = await iniciarConfiguracao2FA();
      setSetup(result);
    });
  }

  function concluirAtivacao() {
    setSetup(null);
    router.refresh();
  }

  function concluirDesativacao() {
    setMostrarDesativar(false);
    router.refresh();
  }

  if (confirmState?.backupCodes) {
    return (
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Segurança</h2>
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: "#009B3A", marginBottom: "12px" }}>✓ Autenticação em duas etapas ativada!</div>
          <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6, marginBottom: "16px" }}>
            Guarde estes códigos de backup em um lugar seguro. Cada um funciona uma única vez e serve para entrar caso
            você perca acesso ao seu aplicativo autenticador. Eles não serão mostrados novamente.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", background: "#F6F6F6", borderRadius: "6px", padding: "16px", marginBottom: "20px", fontFamily: "monospace", fontSize: "14px" }}>
            {confirmState.backupCodes.map((c) => (
              <div key={c}>{c}</div>
            ))}
          </div>
          <button onClick={concluirAtivacao} style={{ background: "#009B3A", color: "white", padding: "12px", width: "100%", fontWeight: 700, borderRadius: "6px", fontSize: "14px" }}>
            Já guardei os códigos
          </button>
        </div>
      </div>
    );
  }

  if (setup) {
    return (
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Segurança</h2>
        <div style={cardStyle}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Configurar autenticação em duas etapas</div>
          <p style={{ fontSize: "13px", color: "#444", lineHeight: 1.6, marginBottom: "16px" }}>
            Escaneie o código abaixo com um aplicativo autenticador (Google Authenticator, Authy, 1Password, etc.) e
            digite o código de 6 dígitos gerado para confirmar.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem gerada dinamicamente (data URL) */}
          <img src={setup.qrDataUrl} alt="QR code para configurar autenticação em duas etapas" style={{ width: "200px", height: "200px", display: "block", margin: "0 auto 16px" }} />
          <p style={{ fontSize: "11px", color: "#999", textAlign: "center", marginBottom: "20px", wordBreak: "break-all" }}>
            Não consegue escanear? Digite manualmente: <span style={{ fontFamily: "monospace" }}>{setup.secret}</span>
          </p>
          <form action={confirmAction} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <input type="hidden" name="secret" value={setup.secret} />
            <input name="codigo" type="text" inputMode="numeric" required placeholder="Código de 6 dígitos" style={{ ...inputStyle, textAlign: "center", fontSize: "18px", letterSpacing: "2px" }} />
            {confirmState?.error && <div style={{ color: "#C0392B", fontSize: "13px" }}>{confirmState.error}</div>}
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => setSetup(null)} style={{ flex: "0 0 auto", background: "white", border: "1px solid #DDD", color: "#262626", padding: "12px 20px", fontWeight: 600, borderRadius: "6px", fontSize: "14px" }}>
                Cancelar
              </button>
              <button type="submit" disabled={confirmPending} style={{ flex: 1, background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: confirmPending ? 0.7 : 1 }}>
                {confirmPending ? "Confirmando..." : "Confirmar e ativar"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Segurança</h2>
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: totpEnabled && mostrarDesativar ? "20px" : 0 }}>
          <div>
            <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>🔐 Autenticação em duas etapas</div>
            <div style={{ fontSize: "13px", color: "#666" }}>
              {totpEnabled ? "Ativada — login exige senha + código do aplicativo autenticador." : "Desativada — login exige apenas a senha."}
            </div>
          </div>
          {totpEnabled ? (
            !mostrarDesativar && (
              <button onClick={() => setMostrarDesativar(true)} style={{ background: "white", border: "1px solid #DDD", color: "#C0392B", padding: "10px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, flexShrink: 0 }}>
                Desativar
              </button>
            )
          ) : (
            <button onClick={iniciar} disabled={carregandoSetup} style={{ background: "#002776", color: "white", padding: "10px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, flexShrink: 0, opacity: carregandoSetup ? 0.7 : 1 }}>
              {carregandoSetup ? "Gerando..." : "Ativar"}
            </button>
          )}
        </div>
        {totpEnabled && mostrarDesativar && (
          <form
            action={(fd) => {
              disableAction(fd);
            }}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            <label style={{ fontSize: "13px", fontWeight: 600 }}>Confirme sua senha para desativar</label>
            <input name="senha" type="password" required placeholder="Senha de administrador" style={inputStyle} />
            {disableState?.error && <div style={{ color: "#C0392B", fontSize: "13px" }}>{disableState.error}</div>}
            {disableState?.ok ? (
              <button type="button" onClick={concluirDesativacao} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px" }}>
                Desativado — clique para atualizar
              </button>
            ) : (
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setMostrarDesativar(false)} style={{ flex: "0 0 auto", background: "white", border: "1px solid #DDD", color: "#262626", padding: "12px 20px", fontWeight: 600, borderRadius: "6px", fontSize: "14px" }}>
                  Cancelar
                </button>
                <button type="submit" disabled={disablePending} style={{ flex: 1, background: "#C0392B", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: disablePending ? 0.7 : 1 }}>
                  {disablePending ? "Desativando..." : "Confirmar desativação"}
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
