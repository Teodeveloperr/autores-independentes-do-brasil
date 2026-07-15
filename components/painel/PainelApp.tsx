"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/painel/actions";
import { firstName, initials } from "@/lib/format";
import type { AuthorWithRelations, PainelView } from "./types";
import DashboardView from "./DashboardView";
import PerfilView from "./PerfilView";
import LivrosView from "./LivrosView";
import PedidosView from "./PedidosView";
import EventosView from "./EventosView";
import GaleriaView from "./GaleriaView";
import MensagensView from "./MensagensView";

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

export default function PainelApp({ author }: { author: AuthorWithRelations }) {
  const [view, setView] = useState<PainelView>("dash");

  const unreadCount = author.conversas.filter((c) => c.unread).length;
  const nome = author.nome || "Autor(a)";

  return (
    <div className="app-shell" style={{ display: "flex", minHeight: "100vh", background: "#F6F6F6" }}>
      <aside className="app-sidebar" style={{ flex: "0 0 250px", background: "#002776", color: "white", padding: "24px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
        <Link href="/" style={{ marginBottom: "20px", display: "block" }}>
          <Image src="/logo.png" alt="Logo" width={200} height={56} style={{ height: "56px", width: "100%", objectFit: "contain", background: "white", borderRadius: "8px", padding: "6px" }} />
        </Link>
        <button onClick={() => setView("dash")} style={sidebarBtn(view === "dash")}>📊 Dashboard</button>
        <button onClick={() => setView("perfil")} style={sidebarBtn(view === "perfil")}>👤 Meu Perfil</button>
        <button onClick={() => setView("livros")} style={sidebarBtn(view === "livros")}>📚 Meus Livros</button>
        <button onClick={() => setView("pedidos")} style={sidebarBtn(view === "pedidos")}>📋 Pedidos</button>
        <button onClick={() => setView("dash")} style={sidebarBtn(false)}>💰 Vendas e Relatórios</button>
        <button onClick={() => setView("galeria")} style={sidebarBtn(view === "galeria")}>🖼️ Galeria de Fotos</button>
        <button onClick={() => setView("eventos")} style={sidebarBtn(view === "eventos")}>📅 Eventos</button>
        <button onClick={() => setView("mensagens")} style={sidebarBtn(view === "mensagens")}>
          💬 Mensagens
          {unreadCount > 0 && (
            <span style={{ background: "#FFDF00", color: "#002776", padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 700, marginLeft: "auto" }}>
              {unreadCount}
            </span>
          )}
        </button>
        <button onClick={() => setView("dash")} style={sidebarBtn(false)}>⭐ Avaliações</button>
        <button onClick={() => setView("dash")} style={sidebarBtn(false)}>⚙️ Configurações</button>
        <button
          onClick={() => logout()}
          style={{ display: "flex", gap: "10px", alignItems: "center", padding: "10px 12px", color: "white", fontSize: "14px", fontWeight: 600, marginTop: "12px", background: "transparent", width: "100%", textAlign: "left" }}
        >
          ➜ Sair
        </button>
        <div className="app-sidebar-promo" style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.2)", padding: "20px 16px", borderRadius: "8px", marginTop: "20px", textAlign: "center" }}>
          <div style={{ fontWeight: 700, marginBottom: "8px", color: "#FFDF00" }}>Você faz parte de algo maior!</div>
          <p style={{ fontSize: "13px", lineHeight: 1.5, marginBottom: "16px" }}>Juntos, fortalecemos a literatura independente.</p>
          <Link href="/assinatura" style={{ display: "block", background: "#FFDF00", color: "#002776", padding: "8px 16px", fontWeight: 700, borderRadius: "4px", fontSize: "13px" }}>
            Ver planos →
          </Link>
        </div>
      </aside>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div className="app-topbar" style={{ background: "white", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E0E0E0", gap: "16px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#002776" }}>Olá, {firstName(nome)}! 👋</div>
            <div style={{ fontSize: "13px", color: "#666" }}>Bem-vindo(a) ao seu painel. Veja o que está acontecendo hoje.</div>
          </div>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
            <input type="text" placeholder="🔍 Buscar no painel..." className="mobile-hide-search" style={{ padding: "10px 16px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", width: "220px" }} />
            <Link href="/" style={{ border: "1px solid #DDD", padding: "10px 16px", borderRadius: "6px", fontSize: "13px", fontWeight: 600, color: "#002776" }}>
              Ver site público ↗
            </Link>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", borderLeft: "1px solid #E0E0E0", paddingLeft: "16px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  color: "#002776",
                  fontSize: "14px",
                  flexShrink: 0,
                  background: author.fotoUrl ? `center / cover no-repeat url(${author.fotoUrl})` : "#E0E0E0",
                }}
              >
                {!author.fotoUrl && initials(nome)}
              </div>
              <div>
                <div style={{ fontSize: "13px", fontWeight: 700 }}>{nome}</div>
                <Link href={`/perfil/${author.id}`} style={{ fontSize: "12px", color: "#666" }}>Ver perfil público ▾</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="section-pad-md" style={{ padding: "28px 32px", flex: 1, minWidth: 0 }}>
          {view === "dash" && <DashboardView author={author} onNavigate={setView} />}
          {view === "perfil" && <PerfilView author={author} />}
          {view === "livros" && <LivrosView author={author} />}
          {view === "pedidos" && <PedidosView author={author} />}
          {view === "eventos" && <EventosView author={author} />}
          {view === "galeria" && <GaleriaView author={author} />}
          {view === "mensagens" && <MensagensView author={author} />}
        </div>

        <div style={{ padding: "16px 32px", borderTop: "1px solid #E0E0E0", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#999" }}>
          <span>© 2026 Autores Independentes do Brasil. Todos os direitos reservados.</span>
          <span style={{ display: "flex", gap: "16px" }}>
            <a href="#" style={{ color: "#999" }}>Termos de uso</a>
            <a href="#" style={{ color: "#999" }}>Política de privacidade</a>
          </span>
        </div>
      </main>
    </div>
  );
}
