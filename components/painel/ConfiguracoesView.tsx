"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changePassword, updatePixKey, excluirMinhaConta, type ChangePasswordState } from "@/app/painel/actions";
import { cancelarAssinatura } from "@/app/assinatura/actions";
import PasskeyManager from "./PasskeyManager";
import PasswordStrengthChecklist from "../PasswordStrengthChecklist";
import type { AuthorWithRelations } from "./types";

const TIPOS_CHAVE_PIX = [
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefone" },
  { value: "EVP", label: "Chave aleatória" },
];

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação do pagamento",
  authorized: "Ativa",
  active: "Ativa",
  paused: "Pausada (falha na cobrança)",
  overdue: "Pagamento em atraso",
  cancelled: "Cancelada",
  expired: "Expirada",
  refused: "Recusada",
};

export default function ConfiguracoesView({
  author,
  temSenha,
}: {
  author: AuthorWithRelations;
  temSenha: boolean;
}) {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(changePassword, undefined);
  const [novaSenha, setNovaSenha] = useState("");
  const [cancelando, startCancelamento] = useTransition();
  const [pixKey, setPixKey] = useState(author.pixKey ?? "");
  const [pixKeyType, setPixKeyType] = useState(author.pixKeyType ?? "CPF");
  const [salvandoPix, startSalvarPix] = useTransition();
  const [pixErro, setPixErro] = useState("");
  const [pixSalvo, setPixSalvo] = useState(false);
  const [excluindo, startExclusao] = useTransition();
  const [erroExclusao, setErroExclusao] = useState("");
  const router = useRouter();
  const statusAssinatura = author.asaasPixAutoStatus || author.asaasSubscriptionStatus || author.mpSubscriptionStatus;

  function onCancelarAssinatura() {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura? Seu plano voltará para Iniciante.")) return;
    startCancelamento(async () => {
      await cancelarAssinatura();
      router.refresh();
    });
  }

  function onExcluirConta() {
    const confirmado = confirm(
      "Tem certeza que deseja excluir sua conta? Isso apaga permanentemente seu perfil, livros, fotos, portfólio e histórico — não pode ser desfeito."
    );
    if (!confirmado) return;
    setErroExclusao("");
    startExclusao(async () => {
      try {
        await excluirMinhaConta();
      } catch (err) {
        // redirect() lança um erro especial (digest "NEXT_REDIRECT") pra navegar depois de
        // excluir a conta com sucesso — não é um erro de verdade.
        if (typeof err === "object" && err !== null && "digest" in err && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) {
          return;
        }
        setErroExclusao(err instanceof Error ? err.message : "Não foi possível excluir sua conta.");
      }
    });
  }

  function onSalvarPix(e: React.FormEvent) {
    e.preventDefault();
    setPixErro("");
    setPixSalvo(false);
    const fd = new FormData();
    fd.set("pixKey", pixKey);
    fd.set("pixKeyType", pixKeyType);
    startSalvarPix(async () => {
      try {
        const resultado = await updatePixKey(fd);
        if (resultado?.error) {
          setPixErro(resultado.error);
          return;
        }
        setPixSalvo(true);
        router.refresh();
      } catch (err) {
        setPixErro(err instanceof Error ? err.message : "Não foi possível salvar a chave Pix.");
      }
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Configurações</h2>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "start" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "16px" }}>Conta</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px" }}>
            <div>
              <div style={{ color: "#666", marginBottom: "4px" }}>E-mail cadastrado</div>
              <div style={{ fontWeight: 600 }}>{author.email}</div>
            </div>
            <div>
              <div style={{ color: "#666", marginBottom: "4px" }}>Plano atual</div>
              <div style={{ fontWeight: 600 }}>{author.plano}</div>
            </div>
            {statusAssinatura && (
              <div>
                <div style={{ color: "#666", marginBottom: "4px" }}>Assinatura</div>
                <div style={{ fontWeight: 600 }}>{STATUS_LABEL[statusAssinatura] ?? statusAssinatura}</div>
              </div>
            )}
            <div>
              <div style={{ color: "#666", marginBottom: "4px" }}>No coletivo desde</div>
              <div style={{ fontWeight: 600 }}>{author.anoEntrada}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" }}>
            <Link
              href="/assinatura"
              style={{ display: "inline-block", background: "white", border: "1px solid #009B3A", color: "#009B3A", padding: "10px 18px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}
            >
              Ver planos e fazer upgrade →
            </Link>
            {author.plano !== "Iniciante" && (
              <button
                onClick={onCancelarAssinatura}
                disabled={cancelando}
                style={{ background: "white", border: "1px solid #C0392B", color: "#C0392B", padding: "10px 18px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", opacity: cancelando ? 0.7 : 1 }}
              >
                {cancelando ? "Cancelando..." : "Cancelar assinatura"}
              </button>
            )}
          </div>
        </div>

        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Segurança</div>
          <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
            {temSenha ? "Altere a senha usada para entrar na sua conta." : "Você ainda não tem uma senha definida (conta criada via Google ou pelo coletivo). Defina uma senha para também poder entrar com e-mail e senha."}
          </p>

          {state?.ok ? (
            <div style={{ color: "#009B3A", fontSize: "13px", background: "#E3F4E9", padding: "10px 14px", borderRadius: "6px" }}>
              ✅ Senha atualizada com sucesso.
            </div>
          ) : (
            <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {temSenha && (
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Senha atual</label>
                  <input
                    name="senhaAtual"
                    type="password"
                    required
                    placeholder="Digite sua senha atual"
                    style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
                  />
                </div>
              )}
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>{temSenha ? "Nova senha" : "Criar senha"}</label>
                <input
                  name="novaSenha"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Mínimo 8 caracteres, com letra, número e caractere especial"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
                />
                <PasswordStrengthChecklist senha={novaSenha} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Confirmar {temSenha ? "nova senha" : "senha"}</label>
                <input
                  name="confirmar"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Repita a senha"
                  style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
                />
              </div>
              {state?.error && (
                <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
                  {state.error}
                </div>
              )}
              <button
                type="submit"
                disabled={pending}
                style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}
              >
                {pending ? "Salvando..." : temSenha ? "Salvar nova senha" : "Criar senha"}
              </button>
            </form>
          )}

          <div style={{ borderTop: "1px solid #F0F0F0", marginTop: "20px", paddingTop: "20px" }}>
            <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Login com biometria</div>
            <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
              Entre mais rápido usando Face ID, digital ou Windows Hello, sem digitar a senha.
            </p>
            <PasskeyManager passkeys={author.passkeys} />
          </div>
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", padding: "24px", marginTop: "20px" }}>
        <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Recebimento de vendas</div>
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px", maxWidth: "560px" }}>
          Cadastre sua chave Pix pra receber o valor das vendas dos seus livros automaticamente, assim que você marcar o pedido como &quot;Enviado&quot;.
        </p>

        <form onSubmit={onSalvarPix} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Chave Pix</label>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              required
              placeholder="CPF, e-mail, telefone ou chave aleatória"
              style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Tipo</label>
            <select
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value)}
              style={{ padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
            >
              {TIPOS_CHAVE_PIX.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={salvandoPix}
            style={{ background: "#009B3A", color: "white", padding: "10px 20px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: salvandoPix ? 0.7 : 1 }}
          >
            {salvandoPix ? "Salvando..." : "Salvar chave Pix"}
          </button>
        </form>
        {pixErro && (
          <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px", marginTop: "12px" }}>
            {pixErro}
          </div>
        )}
        {pixSalvo && (
          <div style={{ color: "#009B3A", fontSize: "13px", background: "#E3F4E9", padding: "10px 14px", borderRadius: "6px", marginTop: "12px" }}>
            ✅ Chave Pix salva.
          </div>
        )}
      </div>

      <div style={{ background: "white", borderRadius: "10px", padding: "24px", marginTop: "20px", border: "1px solid #FDEDEC" }}>
        <div style={{ fontWeight: 700, color: "#C0392B", marginBottom: "4px" }}>Excluir minha conta</div>
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px", maxWidth: "560px" }}>
          Apaga permanentemente seu perfil, livros, fotos, portfólio e histórico — não pode ser desfeito. Disponível pra qualquer plano. Se você tiver pedidos pagos aguardando envio ou repasse, finalize-os antes de excluir a conta.
        </p>
        <button
          onClick={onExcluirConta}
          disabled={excluindo}
          style={{ background: "white", border: "1px solid #C0392B", color: "#C0392B", padding: "10px 20px", fontWeight: 700, borderRadius: "6px", fontSize: "13px", opacity: excluindo ? 0.7 : 1 }}
        >
          {excluindo ? "Excluindo..." : "Excluir minha conta"}
        </button>
        {erroExclusao && (
          <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px", marginTop: "12px" }}>
            {erroExclusao}
          </div>
        )}
      </div>
    </div>
  );
}
