"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { removeAuthor, adminCreateAuthor, type CreateAuthorState } from "@/app/admin/actions";
import { initials } from "@/lib/format";
import { PLANOS_COM_VENDA } from "@/lib/plans";
import type { AuthorWithCount } from "./types";

export default function AdminAutoresView({ autores }: { autores: AuthorWithCount[] }) {
  const [pending, startTransition] = useTransition();
  const [state, formAction, createPending] = useActionState<CreateAuthorState, FormData>(adminCreateAuthor, undefined);
  const router = useRouter();

  function onRemove(id: string, nome: string) {
    const ok = window.confirm(
      `Remover ${nome} do coletivo? Isso apaga também os livros, eventos, fotos e mensagens dele(a). Essa ação não pode ser desfeita.`
    );
    if (!ok) return;
    startTransition(async () => {
      await removeAuthor(id);
      router.refresh();
    });
  }

  useEffect(() => {
    if (state?.success) {
      router.refresh();
    }
  }, [state, router]);

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Autores do Coletivo</h2>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
        <form action={formAction} style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>✍️ Adicionar autor(a)</div>
          <p style={{ fontSize: "12px", color: "#666" }}>
            Cria a conta e envia um e-mail para o(a) autor(a) definir a própria senha e acessar o painel.
          </p>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Nome completo</label>
            <input name="nome" type="text" required placeholder="Ex: Maria Silva" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>E-mail</label>
            <input name="email" type="email" required placeholder="autor@email.com" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Plano</label>
            <select name="plano" style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}>
              {PLANOS_COM_VENDA.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          {state?.error && (
            <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>{state.error}</div>
          )}
          {state?.success && (
            <div style={{ color: "#009B3A", fontSize: "13px", background: "#E9F5EE", padding: "10px 14px", borderRadius: "6px" }}>
              ✓ Conta criada! E-mail enviado para definir a senha.
            </div>
          )}
          <button type="submit" disabled={createPending} style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: createPending ? 0.7 : 1 }}>
            {createPending ? "Criando..." : "Adicionar autor(a)"}
          </button>
        </form>

        <div style={{ background: "white", borderRadius: "10px", overflow: "hidden" }}>
          {autores.map((a) => (
            <div key={a.id} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #F0F0F0", flexWrap: "wrap" }}>
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#002776",
                  fontSize: "13px",
                  flexShrink: 0,
                  background: a.fotoUrl ? `center / cover no-repeat url(${a.fotoUrl})` : "#E0E0E0",
                }}
              >
                {!a.fotoUrl && initials(a.nome)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "14px" }}>{a.nome}</div>
                <div style={{ fontSize: "12px", color: "#666" }}>{a.generos.join(", ")} • {a.cidade}</div>
              </div>
              <div style={{ fontSize: "12px", color: "#666", textAlign: "center", flexShrink: 0, width: "90px" }}>📚 {a._count.books} livros</div>
              <div style={{ fontSize: "12px", fontWeight: 700, textAlign: "center", flexShrink: 0, width: "130px", color: "#009B3A" }}>{a.plano}</div>
              <Link href={`/perfil/${a.id}`} style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "#002776", flexShrink: 0 }}>
                Ver perfil
              </Link>
              <button
                onClick={() => onRemove(a.id, a.nome)}
                disabled={pending}
                title="Remover autor(a)"
                style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0, opacity: pending ? 0.6 : 1 }}
              >
                ✕
              </button>
            </div>
          ))}
          {autores.length === 0 && (
            <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>Nenhum autor cadastrado ainda.</div>
          )}
        </div>
      </div>
    </div>
  );
}
