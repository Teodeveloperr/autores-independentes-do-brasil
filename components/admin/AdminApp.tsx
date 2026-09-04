"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { adminLogout } from "@/app/admin/actions";
import type { AdminView, Article, AuthorWithCount, CollectiveEvent, CollectiveGalleryPhoto, Opportunity, ReviewWithAuthor, OrderWithAuthor, OrderComReceita, SubscriptionPaymentRow } from "./types";
import AdminAgendaView from "./AdminAgendaView";
import AdminOportunidadesView from "./AdminOportunidadesView";
import AdminGaleriaView from "./AdminGaleriaView";
import AdminAutoresView from "./AdminAutoresView";
import AdminBlogView from "./AdminBlogView";
import AdminAvaliacoesView from "./AdminAvaliacoesView";
import AdminPedidosView from "./AdminPedidosView";
import AdminReceitaView from "./AdminReceitaView";
import AdminSegurancaView from "./AdminSegurancaView";

const sidebarBtn = (active: boolean): React.CSSProperties => ({
  display: "flex",
  gap: "10px",
  alignItems: "center",
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  borderRadius: "6px",
  fontSize: "14px",
  fontWeight: active ? 700 : 500,
  background: active ? "#009B3A" : "transparent",
  color: "white",
});

export default function AdminApp({
  eventos,
  oportunidades,
  fotos,
  autores,
  artigos,
  avaliacoes,
  pedidos,
  pedidosReceita,
  assinaturaPagamentos,
  saldoAsaasCentavos,
  totpEnabled,
}: {
  eventos: CollectiveEvent[];
  oportunidades: Opportunity[];
  fotos: CollectiveGalleryPhoto[];
  autores: AuthorWithCount[];
  artigos: Article[];
  avaliacoes: ReviewWithAuthor[];
  pedidos: OrderWithAuthor[];
  pedidosReceita: OrderComReceita[];
  assinaturaPagamentos: SubscriptionPaymentRow[];
  saldoAsaasCentavos: number | null;
  totpEnabled: boolean;
}) {
  const [view, setView] = useState<AdminView>("dash");
  const totalLivros = autores.reduce((sum, a) => sum + a._count.books, 0);

  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100vh", background: "#F6F6F6" }}>
      <aside className="app-sidebar" style={{ flex: "0 0 250px", background: "#262626", color: "white", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <Link href="/" style={{ marginBottom: "20px", display: "block" }}>
          <Image src="/logo.png" alt="Logo" width={200} height={56} style={{ height: "56px", width: "100%", objectFit: "contain", background: "white", borderRadius: "8px", padding: "6px" }} />
        </Link>
        <div style={{ fontSize: "11px", fontWeight: 700, color: "#FFDF00", letterSpacing: "0.5px", padding: "0 12px", marginBottom: "8px" }}>
          PAINEL ADMINISTRATIVO
        </div>
        <button onClick={() => setView("dash")} style={sidebarBtn(view === "dash")}>📊 Visão geral</button>
        <button onClick={() => setView("agenda")} style={sidebarBtn(view === "agenda")}>📅 Agenda do Coletivo</button>
        <button onClick={() => setView("oportunidades")} style={sidebarBtn(view === "oportunidades")}>🚀 Oportunidades</button>
        <button onClick={() => setView("galeria")} style={sidebarBtn(view === "galeria")}>🖼️ Galeria do Coletivo</button>
        <button onClick={() => setView("blog")} style={sidebarBtn(view === "blog")}>📝 Blog do Coletivo</button>
        <button onClick={() => setView("autores")} style={sidebarBtn(view === "autores")}>✍️ Autores</button>
        <button onClick={() => setView("avaliacoes")} style={sidebarBtn(view === "avaliacoes")}>⭐ Avaliações</button>
        <button onClick={() => setView("pedidos")} style={sidebarBtn(view === "pedidos")}>📋 Pedidos</button>
        <button onClick={() => setView("receita")} style={sidebarBtn(view === "receita")}>💰 Receita</button>
        <button onClick={() => setView("seguranca")} style={sidebarBtn(view === "seguranca")}>🔐 Segurança</button>
        <button
          onClick={() => adminLogout()}
          style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 12px", color: "white", fontSize: "14px", fontWeight: 600, marginTop: "12px", background: "transparent" }}
        >
          ➜ Sair
        </button>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div style={{ background: "white", padding: "16px 32px", borderBottom: "1px solid #E0E0E0", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#002776" }}>Administração do coletivo</div>
            <div style={{ fontSize: "13px", color: "#666" }}>Gerencie a agenda, a galeria, o blog e acompanhe os autores da plataforma.</div>
          </div>
          <Link href="/" style={{ border: "1px solid #DDD", padding: "10px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "#002776", flexShrink: 0 }}>
            Ver site público ↗
          </Link>
        </div>

        <div className="section-pad-md" style={{ padding: "28px 32px", flex: 1, minWidth: 0 }}>
          {view === "dash" && (
            <div>
              {!totpEnabled && (
                <div style={{ background: "white", borderRadius: "10px", padding: "20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>🔐 Autenticação em duas etapas</div>
                    <div style={{ fontSize: "13px", color: "#666" }}>Sua conta de administrador ainda usa só senha. Ative a verificação em duas etapas pra proteger o acesso.</div>
                  </div>
                  <button onClick={() => setView("seguranca")} style={{ background: "#002776", color: "white", padding: "10px 20px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, flexShrink: 0 }}>
                    Ativar agora
                  </button>
                </div>
              )}
              <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "20px", marginBottom: "28px" }}>
                <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>✍️ Autores cadastrados</div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{autores.length}</div>
                </div>
                <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>📚 Livros publicados</div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{totalLivros}</div>
                </div>
                <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>📅 Eventos na agenda</div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{eventos.length}</div>
                </div>
                <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>🖼️ Fotos na galeria</div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{fotos.length}</div>
                </div>
                <div style={{ background: "white", borderRadius: "10px", padding: "20px" }}>
                  <div style={{ fontSize: "12px", color: "#666", marginBottom: "8px" }}>📝 Artigos no blog</div>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{artigos.length}</div>
                </div>
              </div>
              <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
                  <div style={{ fontWeight: 700, color: "#002776", marginBottom: "16px" }}>Ações rápidas</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <button onClick={() => setView("agenda")} style={{ display: "flex", gap: "8px", alignItems: "center", background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", fontWeight: 600, textAlign: "left" }}>
                      📅 Adicionar evento à agenda do coletivo
                    </button>
                    <button onClick={() => setView("galeria")} style={{ display: "flex", gap: "8px", alignItems: "center", background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", fontWeight: 600, textAlign: "left" }}>
                      🖼️ Adicionar foto à galeria do coletivo
                    </button>
                    <button onClick={() => setView("blog")} style={{ display: "flex", gap: "8px", alignItems: "center", background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", fontWeight: 600, textAlign: "left" }}>
                      📝 Publicar artigo no blog
                    </button>
                    <button onClick={() => setView("autores")} style={{ display: "flex", gap: "8px", alignItems: "center", background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "10px 12px", fontSize: "13px", fontWeight: 600, textAlign: "left" }}>
                      ✍️ Ver autores cadastrados
                    </button>
                  </div>
                </div>
                <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
                  <div style={{ fontWeight: 700, color: "#002776", marginBottom: "16px" }}>Próximos eventos do coletivo</div>
                  {eventos.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {eventos.slice(0, 3).map((ev) => (
                        <div key={ev.id} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                          <div style={{ background: "#F6F6F6", border: "1px solid #E0E0E0", borderRadius: "6px", padding: "6px 10px", textAlign: "center", flexShrink: 0 }}>
                            <div style={{ fontSize: "16px", fontWeight: 700, color: "#C0392B" }}>{ev.dia}</div>
                            <div style={{ fontSize: "10px", fontWeight: 700, color: "#666" }}>{ev.mes}/{ev.ano}</div>
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: "13px" }}>{ev.nome}</div>
                            <div style={{ fontSize: "11px", color: "#666" }}>📍 {ev.local}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: "#666" }}>Nenhum evento cadastrado ainda.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          {view === "agenda" && <AdminAgendaView eventos={eventos} />}
          {view === "oportunidades" && <AdminOportunidadesView oportunidades={oportunidades} />}
          {view === "galeria" && <AdminGaleriaView fotos={fotos} />}
          {view === "blog" && <AdminBlogView artigos={artigos} />}
          {view === "autores" && <AdminAutoresView autores={autores} />}
          {view === "avaliacoes" && <AdminAvaliacoesView avaliacoes={avaliacoes} />}
          {view === "pedidos" && <AdminPedidosView pedidos={pedidos} />}
          {view === "receita" && (
            <AdminReceitaView pedidos={pedidosReceita} assinaturaPagamentos={assinaturaPagamentos} saldoAsaasCentavos={saldoAsaasCentavos} />
          )}
          {view === "seguranca" && <AdminSegurancaView totpEnabled={totpEnabled} />}
        </div>
      </main>
    </div>
  );
}
