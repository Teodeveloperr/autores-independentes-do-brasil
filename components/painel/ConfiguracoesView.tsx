"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changePassword, desconectarMercadoPago, type ChangePasswordState } from "@/app/painel/actions";
import { cancelarAssinatura } from "@/app/assinatura/actions";
import type { AuthorWithRelations } from "./types";

const STATUS_LABEL: Record<string, string> = {
  pending: "Aguardando confirmação do pagamento",
  authorized: "Ativa",
  paused: "Pausada (falha na cobrança)",
  cancelled: "Cancelada",
};

export default function ConfiguracoesView({
  author,
  temSenha,
  mercadoPagoConectado,
}: {
  author: AuthorWithRelations;
  temSenha: boolean;
  mercadoPagoConectado: boolean;
}) {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(changePassword, undefined);
  const [cancelando, startCancelamento] = useTransition();
  const [desconectando, startDesconexao] = useTransition();
  const router = useRouter();

  function onCancelarAssinatura() {
    if (!confirm("Tem certeza que deseja cancelar sua assinatura? Seu plano voltará para Gratuito.")) return;
    startCancelamento(async () => {
      await cancelarAssinatura();
      router.refresh();
    });
  }

  function onDesconectarMercadoPago() {
    if (!confirm("Desconectar sua conta do Mercado Pago? Você vai parar de receber pelas vendas dos seus livros até conectar novamente.")) return;
    startDesconexao(async () => {
      await desconectarMercadoPago();
      router.refresh();
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
            {author.mpSubscriptionStatus && (
              <div>
                <div style={{ color: "#666", marginBottom: "4px" }}>Assinatura</div>
                <div style={{ fontWeight: 600 }}>{STATUS_LABEL[author.mpSubscriptionStatus] ?? author.mpSubscriptionStatus}</div>
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
            {(author.mpSubscriptionStatus === "authorized" || author.mpSubscriptionStatus === "pending") && (
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
                  placeholder="Mínimo de 8 caracteres, com letra e número"
                  style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
                />
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
        </div>
      </div>

      <div style={{ background: "white", borderRadius: "10px", padding: "24px", marginTop: "20px" }}>
        <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Recebimento de vendas</div>
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px", maxWidth: "560px" }}>
          Conecte sua conta do Mercado Pago para receber diretamente o valor das vendas dos seus livros. O coletivo não fica com o dinheiro em nenhum momento — cada venda cai direto na sua conta, com a taxa da plataforma já descontada automaticamente.
        </p>

        {mercadoPagoConectado ? (
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ color: "#009B3A", fontSize: "13px", background: "#E3F4E9", padding: "10px 14px", borderRadius: "6px", fontWeight: 600 }}>
              ✅ Conta do Mercado Pago conectada
            </div>
            <button
              onClick={onDesconectarMercadoPago}
              disabled={desconectando}
              style={{ background: "white", border: "1px solid #C0392B", color: "#C0392B", padding: "10px 18px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", opacity: desconectando ? 0.7 : 1 }}
            >
              {desconectando ? "Desconectando..." : "Desconectar"}
            </button>
          </div>
        ) : (
          <a
            href="/api/auth/mercadopago"
            style={{ display: "inline-block", background: "#009B3A", color: "white", padding: "12px 20px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", textDecoration: "none" }}
          >
            Conectar Mercado Pago
          </a>
        )}
      </div>
    </div>
  );
}
