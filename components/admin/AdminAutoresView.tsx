"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { removeAuthor, suspendAuthor, reactivateAuthor, alterarPlanoAutor, adminCreateAuthor, type CreateAuthorState } from "@/app/admin/actions";
import { initials } from "@/lib/format";
import { TODOS_PLANOS } from "@/lib/plans";
import type { AuthorWithCount } from "./types";

const AUTORES_POR_PAGINA = 6;

export default function AdminAutoresView({ autores }: { autores: AuthorWithCount[] }) {
  const [pending, startTransition] = useTransition();
  const [state, formAction, createPending] = useActionState<CreateAuthorState, FormData>(adminCreateAuthor, undefined);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const router = useRouter();

  const autoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return autores;
    return autores.filter((a) => a.nome.toLowerCase().includes(termo) || (a.cidade ?? "").toLowerCase().includes(termo) || a.email.toLowerCase().includes(termo));
  }, [autores, busca]);

  const totalPaginas = Math.max(1, Math.ceil(autoresFiltrados.length / AUTORES_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const autoresPagina = autoresFiltrados.slice((paginaAtual - 1) * AUTORES_POR_PAGINA, paginaAtual * AUTORES_POR_PAGINA);

  function onBuscaChange(valor: string) {
    setBusca(valor);
    setPagina(1);
  }

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

  function onSuspend(id: string, nome: string) {
    const ok = window.confirm(
      `Suspender ${nome}? O perfil, os livros e o painel dele(a) ficam indisponíveis até você reativar. Nada é apagado.`
    );
    if (!ok) return;
    startTransition(async () => {
      await suspendAuthor(id);
      router.refresh();
    });
  }

  function onReactivate(id: string) {
    startTransition(async () => {
      await reactivateAuthor(id);
      router.refresh();
    });
  }

  function onChangePlano(id: string, plano: string) {
    startTransition(async () => {
      await alterarPlanoAutor(id, plano);
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
              {TODOS_PLANOS.map((p) => (
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

        <div>
          <input
            type="text"
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            placeholder="🔍 Buscar por nome, cidade ou e-mail..."
            style={{ width: "100%", padding: "10px 14px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", marginBottom: "12px", background: "white" }}
          />
          <div style={{ background: "white", borderRadius: "10px", overflow: "hidden" }}>
            {autoresPagina.map((a) => (
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
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ fontWeight: 700, fontSize: "14px" }}>{a.nome}</div>
                  {a.status === "suspenso" && (
                    <span style={{ background: "#FDEDEC", color: "#C0392B", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "10px" }}>
                      Suspenso
                    </span>
                  )}
                </div>
                <div style={{ fontSize: "12px", color: "#666" }}>{a.generos.join(", ")} • {a.cidade}</div>
              </div>
              <div style={{ fontSize: "12px", color: "#666", textAlign: "center", flexShrink: 0, width: "90px" }}>📚 {a._count.books} livros</div>
              <select
                value={a.plano}
                onChange={(e) => onChangePlano(a.id, e.target.value)}
                disabled={pending}
                title="Alterar plano manualmente"
                style={{ fontSize: "12px", fontWeight: 700, textAlign: "center", flexShrink: 0, width: "150px", color: "#009B3A", border: "1px solid #DDD", borderRadius: "6px", padding: "6px 4px", background: "white" }}
              >
                {TODOS_PLANOS.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <Link href={`/perfil/${a.id}`} style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "#002776", flexShrink: 0 }}>
                Ver perfil
              </Link>
              {a.status === "suspenso" ? (
                <button
                  onClick={() => onReactivate(a.id)}
                  disabled={pending}
                  title="Reativar autor(a)"
                  style={{ background: "#E9F5EE", border: "1px solid #BFE3CE", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "#009B3A", flexShrink: 0, opacity: pending ? 0.6 : 1 }}
                >
                  Reativar
                </button>
              ) : (
                <button
                  onClick={() => onSuspend(a.id, a.nome)}
                  disabled={pending}
                  title="Suspender autor(a)"
                  style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "8px 14px", fontSize: "12px", fontWeight: 600, color: "#A87900", flexShrink: 0, opacity: pending ? 0.6 : 1 }}
                >
                  Suspender
                </button>
              )}
              <button
                onClick={() => onRemove(a.id, a.nome)}
                disabled={pending}
                title="Remover autor(a) definitivamente"
                style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "32px", height: "32px", fontSize: "13px", color: "#C0392B", flexShrink: 0, opacity: pending ? 0.6 : 1 }}
              >
                ✕
              </button>
            </div>
            ))}
            {autoresFiltrados.length === 0 && (
              <div style={{ padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                {autores.length === 0 ? "Nenhum autor cadastrado ainda." : "Nenhum autor encontrado para essa busca."}
              </div>
            )}
          </div>

          {totalPaginas > 1 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "14px", marginTop: "16px" }}>
              <button
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: 600, color: "#002776", opacity: paginaAtual === 1 ? 0.4 : 1 }}
              >
                ← Anterior
              </button>
              <span style={{ fontSize: "13px", color: "#666" }}>
                Página {paginaAtual} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "8px 14px", fontSize: "13px", fontWeight: 600, color: "#002776", opacity: paginaAtual === totalPaginas ? 0.4 : 1 }}
              >
                Próxima →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
