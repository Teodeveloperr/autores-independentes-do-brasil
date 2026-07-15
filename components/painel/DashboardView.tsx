"use client";

import { brl } from "@/lib/format";
import type { AuthorWithRelations, PainelView } from "./types";

const chipStyle = (status: string): React.CSSProperties => ({
  fontSize: "11px",
  fontWeight: 700,
  padding: "4px 10px",
  borderRadius: "12px",
  background: status === "Confirmado" ? "#E3F4E9" : "#FDF3D7",
  color: status === "Confirmado" ? "#009B3A" : "#A87900",
  whiteSpace: "nowrap",
  flexShrink: 0,
});

const quickBtn: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
  background: "white",
  border: "1px solid #DDD",
  borderRadius: "6px",
  padding: "10px 12px",
  fontSize: "13px",
  fontWeight: 600,
  textAlign: "left",
};

export default function DashboardView({
  author,
  onNavigate,
}: {
  author: AuthorWithRelations;
  onNavigate: (view: PainelView) => void;
}) {
  const now = new Date();
  const vendasMes = author.orders
    .filter((o) => o.status === "Pago" && o.createdAt.getMonth() === now.getMonth() && o.createdAt.getFullYear() === now.getFullYear())
    .reduce((sum, o) => sum + o.valorCentavos, 0);

  return (
    <div>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", marginBottom: "24px" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#009B3A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>📖</div>
          <div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Vendas (mês)</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>{brl(vendasMes)}</div>
          </div>
        </div>
        <button onClick={() => onNavigate("pedidos")} style={{ background: "white", border: "none", borderRadius: "10px", padding: "20px", display: "flex", gap: "14px", alignItems: "flex-start", textAlign: "left" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#FFDF00", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>🛍️</div>
          <div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Pedidos</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>{author.orders.length}</div>
            <div style={{ fontSize: "12px", color: "#009B3A", marginTop: "4px" }}>Ver todos os pedidos →</div>
          </div>
        </button>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#002776", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>👁️</div>
          <div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Visualizações</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>—</div>
          </div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "20px", display: "flex", gap: "14px", alignItems: "flex-start" }}>
          <div style={{ width: "46px", height: "46px", borderRadius: "50%", background: "#6B4EAF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", flexShrink: 0 }}>⭐</div>
          <div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>Avaliações</div>
            <div style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>
              {author.avaliacaoMedia?.toFixed(1) ?? "—"} <span style={{ color: "#FFB800", fontSize: "15px" }}>★★★★★</span>
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>Baseado em {author.avaliacoesQtd} avaliações</div>
          </div>
        </div>
      </div>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 0.9fr", gap: "20px", marginBottom: "24px" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontWeight: 700, color: "#002776" }}>Desempenho de vendas</div>
            <select style={{ padding: "6px 10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "12px" }}>
              <option>Este mês</option>
              <option>Últimos 3 meses</option>
              <option>Este ano</option>
            </select>
          </div>
          <svg viewBox="0 0 520 200" style={{ width: "100%", height: "210px" }}>
            <path d="M0,180 L40,150 L80,158 L120,120 L160,132 L200,95 L240,112 L280,72 L320,95 L360,58 L400,74 L440,42 L480,55 L520,20 L520,200 L0,200 Z" fill="rgba(0,155,58,0.10)" />
            <polyline points="0,180 40,150 80,158 120,120 160,132 200,95 240,112 280,72 320,95 360,58 400,74 440,42 480,55 520,20" fill="none" stroke="#009B3A" strokeWidth={3} />
          </svg>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontWeight: 700, color: "#002776" }}>Pedidos recentes</div>
            <button onClick={() => onNavigate("pedidos")} style={{ background: "white", fontSize: "12px", fontWeight: 600, color: "#009B3A", padding: 0 }}>Ver todos</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {author.orders.slice(0, 4).map((p) => (
              <div key={p.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "42px", height: "56px", background: "#E0E0E0", borderRadius: "4px", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{p.livro}</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>Pedido #{p.id.slice(-6)} • {p.createdAt.toLocaleDateString("pt-BR")}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#009B3A" }}>{p.status}</div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#002776" }}>{brl(p.valorCentavos)}</div>
                </div>
              </div>
            ))}
            {author.orders.length === 0 && <p style={{ fontSize: "13px", color: "#666" }}>Nenhum pedido ainda.</p>}
          </div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ fontWeight: 700, color: "#002776", marginBottom: "16px" }}>Ações rápidas</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button onClick={() => onNavigate("livros")} style={quickBtn}>📕 Adicionar novo livro</button>
            <button onClick={() => onNavigate("livros")} style={quickBtn}>📖 Gerenciar livros</button>
            <button onClick={() => onNavigate("pedidos")} style={quickBtn}>📋 Ver pedidos</button>
            <button onClick={() => onNavigate("perfil")} style={quickBtn}>👤 Editar meu perfil</button>
            <button onClick={() => onNavigate("galeria")} style={quickBtn}>🖼️ Adicionar fotos</button>
            <button onClick={() => onNavigate("mensagens")} style={quickBtn}>💬 Ver mensagens</button>
          </div>
        </div>
      </div>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr 0.9fr", gap: "20px", marginBottom: "24px" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontWeight: 700, color: "#002776" }}>Seus livros</div>
            <button onClick={() => onNavigate("livros")} style={{ background: "white", fontSize: "12px", fontWeight: 600, color: "#009B3A", padding: 0 }}>Ver todos os livros</button>
          </div>
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px" }}>
            {author.books.slice(0, 3).map((b) => (
              <div key={b.id}>
                <div
                  style={{
                    aspectRatio: "3/4",
                    borderRadius: "6px",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                    textAlign: "center",
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#555",
                    background: b.capaUrl ? `center / cover no-repeat url(${b.capaUrl})` : "#E0E0E0",
                  }}
                >
                  {!b.capaUrl && b.titulo}
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700 }}>{brl(b.precoCentavos)}</div>
                <div style={{ fontSize: "11px", color: "#666" }}>Estoque: {b.estoque}</div>
              </div>
            ))}
            <button onClick={() => onNavigate("livros")} style={{ background: "white", border: "2px dashed #BBB", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px", fontWeight: 600, color: "#002776", minHeight: "120px" }}>
              <span style={{ fontSize: "24px" }}>＋</span>
              Adicionar novo livro
            </button>
          </div>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontWeight: 700, color: "#002776" }}>Mensagens</div>
            <button onClick={() => onNavigate("mensagens")} style={{ background: "white", fontSize: "12px", fontWeight: 600, color: "#009B3A", padding: 0 }}>Ver todas</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {author.conversas.slice(0, 3).map((c) => (
              <div key={c.id} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                <div style={{ width: "36px", height: "36px", background: "#E0E0E0", borderRadius: "50%", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "13px" }}>{c.nome}</div>
                  <div style={{ fontSize: "12px", color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.mensagens[c.mensagens.length - 1]?.texto ?? ""}
                  </div>
                </div>
              </div>
            ))}
            {author.conversas.length === 0 && <p style={{ fontSize: "13px", color: "#666" }}>Nenhuma mensagem ainda.</p>}
          </div>
          <button onClick={() => onNavigate("mensagens")} style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "10px", width: "100%", fontSize: "13px", fontWeight: 600, marginTop: "16px" }}>
            Responder mensagens
          </button>
        </div>
        <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ fontWeight: 700, color: "#002776" }}>Próximos eventos</div>
            <button onClick={() => onNavigate("eventos")} style={{ background: "white", fontSize: "12px", fontWeight: 600, color: "#009B3A", padding: 0 }}>Ver todos</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {author.eventos.slice(0, 3).map((ev) => (
              <div key={ev.id} style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ background: "#F6F6F6", border: "1px solid #E0E0E0", borderRadius: "6px", padding: "6px 10px", textAlign: "center", flexShrink: 0 }}>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#C0392B" }}>{ev.dia}</div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#666" }}>{ev.mes}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "12px" }}>{ev.nome}</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>📍 {ev.local}</div>
                </div>
                <span style={chipStyle(ev.status)}>{ev.status}</span>
              </div>
            ))}
            {author.eventos.length === 0 && <p style={{ fontSize: "13px", color: "#666" }}>Nenhum evento ainda.</p>}
          </div>
          <button onClick={() => onNavigate("eventos")} style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", padding: "10px", width: "100%", fontSize: "13px", fontWeight: 600, marginTop: "16px" }}>
            Ver calendário completo 📅
          </button>
        </div>
      </div>

      <div style={{ background: "#E9F5EE", border: "1px solid #BFE3CE", borderRadius: "10px", padding: "16px 20px", display: "flex", gap: "12px", alignItems: "center" }}>
        <span style={{ fontSize: "20px" }}>💡</span>
        <div style={{ flex: 1, fontSize: "13px" }}>
          <strong>Dica importante:</strong> Mantenha seu perfil atualizado e publique novos livros para aumentar suas vendas e visibilidade no coletivo!
        </div>
        <button onClick={() => onNavigate("perfil")} style={{ background: "#009B3A", color: "white", padding: "8px 16px", fontWeight: 600, borderRadius: "6px", fontSize: "13px" }}>
          Atualizar perfil
        </button>
      </div>
    </div>
  );
}
