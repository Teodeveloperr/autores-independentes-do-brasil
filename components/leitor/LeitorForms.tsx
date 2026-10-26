"use client";

import { useActionState, useState } from "react";
import {
  entrarLeitor,
  solicitarLinkSenhaLeitor,
  definirSenhaLeitor,
  sairLeitor,
  type EntrarState,
  type EsqueciState,
  type DefinirSenhaState,
} from "@/app/entrar/actions";
import PasswordInput from "@/components/PasswordInput";
import PasswordStrengthChecklist from "@/components/PasswordStrengthChecklist";

const campo: React.CSSProperties = { width: "100%", padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" };
const rotulo: React.CSSProperties = { display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "8px" };
const caixaErro: React.CSSProperties = { color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" };

export function LeitorEntrarForm() {
  const [state, formAction, pending] = useActionState<EntrarState, FormData>(entrarLeitor, undefined);
  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={rotulo} htmlFor="leitor-email">E-mail</label>
        <input id="leitor-email" name="email" type="email" required autoComplete="email" placeholder="O e-mail usado na compra" style={campo} />
      </div>
      <div>
        <label style={rotulo} htmlFor="leitor-senha">Senha</label>
        <PasswordInput name="senha" required autoComplete="current-password" placeholder="Digite a sua senha" style={campo} />
      </div>
      <a href="/entrar/esqueci" style={{ color: "#009B3A", fontSize: "14px", textAlign: "right" }}>
        Esqueci minha senha / primeiro acesso
      </a>
      {state?.error && <div role="alert" style={caixaErro}>{state.error}</div>}
      <button type="submit" disabled={pending} style={{ background: "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", opacity: pending ? 0.7 : 1 }}>
        {pending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export function LeitorEsqueciForm() {
  const [state, formAction, pending] = useActionState<EsqueciState, FormData>(solicitarLinkSenhaLeitor, undefined);

  if (state?.sent) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>📬</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, marginBottom: "12px", color: "#002776" }}>Confira o seu e-mail</h2>
        <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
          Se existir uma conta de leitor com esse e-mail, enviamos um link para criar ou refazer a senha. O link vale por 1 hora.
          Não esqueça de olhar a caixa de spam.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={rotulo} htmlFor="leitor-esqueci-email">E-mail</label>
        <input id="leitor-esqueci-email" name="email" type="email" required autoComplete="email" placeholder="O e-mail usado na compra" style={campo} />
      </div>
      {state?.error && <div role="alert" style={caixaErro}>{state.error}</div>}
      <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "4px", opacity: pending ? 0.7 : 1 }}>
        {pending ? "Enviando..." : "Enviar link por e-mail"}
      </button>
    </form>
  );
}

export function LeitorSenhaForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<DefinirSenhaState, FormData>(definirSenhaLeitor, undefined);
  const [senha, setSenha] = useState("");

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <input type="hidden" name="token" value={token} />
      <div>
        <label style={rotulo} htmlFor="leitor-nova-senha">Nova senha</label>
        <input
          id="leitor-nova-senha"
          name="senha"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Crie uma senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={campo}
        />
        <PasswordStrengthChecklist senha={senha} />
      </div>
      <div>
        <label style={rotulo} htmlFor="leitor-confirmar-senha">Confirmar senha</label>
        <input id="leitor-confirmar-senha" name="confirmar" type="password" required minLength={8} autoComplete="new-password" placeholder="Repita a senha" style={campo} />
      </div>
      {state?.error && <div role="alert" style={caixaErro}>{state.error}</div>}
      <button type="submit" disabled={pending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "4px", opacity: pending ? 0.7 : 1 }}>
        {pending ? "Salvando..." : "Salvar senha e entrar"}
      </button>
    </form>
  );
}

export function SairLeitorButton() {
  return (
    <form action={sairLeitor}>
      <button type="submit" style={{ background: "white", color: "#002776", border: "1px solid #DDD", padding: "9px 16px", fontWeight: 600, borderRadius: "6px", fontSize: "13px" }}>
        Sair deste aparelho
      </button>
    </form>
  );
}
