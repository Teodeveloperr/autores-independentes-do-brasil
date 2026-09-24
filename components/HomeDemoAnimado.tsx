"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const INTERVALO_MS = 5500;
const VELOCIDADE_MS_POR_CARACTERE = 45;

const PASSOS = ["Acesse seu painel", "Cadastre seu livro", "Configure sua chave Pix"];

const MENU_ITENS = [
  { icon: "📊", label: "Dashboard" },
  { icon: "👤", label: "Meu Perfil" },
  { icon: "📚", label: "Meus Livros" },
  { icon: "📋", label: "Pedidos" },
  { icon: "💰", label: "Vendas e Relatórios" },
  { icon: "💬", label: "Mensagens" },
  { icon: "⚙️", label: "Configurações" },
];

const ATIVO_POR_PASSO = ["Dashboard", "Meus Livros", "Configurações"];

function CampoDigitado({ texto, delayMs }: { texto: string; delayMs: number }) {
  const duracaoMs = texto.length * VELOCIDADE_MS_POR_CARACTERE;
  return (
    <span
      className="home-demo-typed"
      style={
        {
          animation: `home-demo-digitar ${duracaoMs}ms steps(${texto.length}) ${delayMs}ms both`,
          "--typed-width": `${texto.length}ch`,
        } as React.CSSProperties
      }
    >
      {texto}
    </span>
  );
}

function CampoForm({ label, children, comCursor }: { label: string; children: React.ReactNode; comCursor?: boolean }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ fontSize: "11px", fontWeight: 600, color: "#444", marginBottom: "4px" }}>{label}</div>
      <div
        className={comCursor ? "home-demo-cursor" : undefined}
        style={{ border: "1px solid #E0E0E0", borderRadius: "6px", padding: "8px 10px", fontSize: "13px", color: "#262626", background: "#FAFAFA", minHeight: "16px" }}
      >
        {children}
      </div>
    </div>
  );
}

function StatCard({ icon, cor, label, valor }: { icon: string; cor: string; label: string; valor: string }) {
  return (
    <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "10px 12px", display: "flex", gap: "10px", alignItems: "center" }}>
      <div
        style={{
          width: "26px",
          height: "26px",
          borderRadius: "50%",
          background: cor,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "12px",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "10px", color: "#999" }}>{label}</div>
        <div style={{ fontSize: "13px", fontWeight: 700, color: "#002776" }}>{valor}</div>
      </div>
    </div>
  );
}

// Demo "como funciona" da home: um mockup do painel real (sidebar + telas), que se
// preenche sozinho (efeito de digitação em CSS puro via home-demo-digitar), passando por
// 3 passos — acessar o painel, cadastrar o livro, configurar a chave Pix — trocando de
// passo sozinho a cada alguns segundos. Não é uma gravação real, é uma recriação
// simplificada das telas do painel, só pra ilustrar o fluxo.
export default function HomeDemoAnimado() {
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => setPasso((p) => (p + 1) % PASSOS.length), INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <section className="section-pad-lg" style={{ background: "white", padding: "48px 40px", marginTop: "20px" }}>
      <div style={{ textAlign: "center", maxWidth: "640px", margin: "0 auto 32px" }}>
        <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Veja como é fácil vender seus livros</h2>
        <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.6 }}>
          Direto do seu painel: cadastre seu livro, configure sua chave Pix e comece a vender pra quem lê você.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "12px", marginBottom: "24px" }}>
        {PASSOS.map((titulo, i) => (
          <div
            key={titulo}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              borderRadius: "20px",
              background: i === passo ? "#002776" : "#F6F6F6",
              transition: "background 300ms ease",
            }}
          >
            <div
              style={{
                width: "20px",
                height: "20px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "11px",
                fontWeight: 700,
                background: i === passo ? "white" : "#DDD",
                color: i === passo ? "#002776" : "#999",
                flexShrink: 0,
                transition: "background 300ms ease, color 300ms ease",
              }}
            >
              {i + 1}
            </div>
            <div style={{ fontSize: "13px", fontWeight: 600, color: i === passo ? "white" : "#666", whiteSpace: "nowrap", transition: "color 300ms ease" }}>
              {titulo}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          maxWidth: "820px",
          margin: "0 auto",
          background: "white",
          borderRadius: "12px",
          boxShadow: "0 20px 50px rgba(0,39,118,0.15)",
          overflow: "hidden",
          border: "1px solid #EEE",
        }}
      >
        <div style={{ background: "#F6F6F6", padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px", borderBottom: "1px solid #E5E5E5" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF5F57" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FEBC2E" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28C840" }} />
          <span style={{ marginLeft: "10px", fontSize: "11px", color: "#999" }}>painel.autoresdobrasil.com.br</span>
        </div>
        <div className="home-demo-shell" style={{ display: "flex", minHeight: "400px" }}>
          <div className="home-demo-sidebar" style={{ width: "170px", flexShrink: 0, background: "#002776", padding: "16px 10px" }}>
            {MENU_ITENS.map((item) => {
              const ativo = item.label === ATIVO_POR_PASSO[passo];
              return (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    borderRadius: "6px",
                    background: ativo ? "#009B3A" : "transparent",
                    color: "white",
                    fontSize: "12px",
                    marginBottom: "2px",
                    transition: "background 300ms ease",
                  }}
                >
                  <span style={{ fontSize: "13px" }}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div key={passo} style={{ flex: 1, padding: "24px", minWidth: 0 }}>
            {passo === 0 && (
              <>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Olá, Monyque! 👋</div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "18px" }}>Bem-vinda ao seu painel.</div>
                <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "20px" }}>
                  <StatCard icon="📗" cor="#8FE3AE" label="Vendas (mês)" valor="R$ 0,00" />
                  <StatCard icon="📦" cor="#FFE28A" label="Pedidos" valor="2" />
                  <StatCard icon="👁️" cor="#9FB6E8" label="Visualizações" valor="27" />
                  <StatCard icon="⭐" cor="#D3B8F5" label="Avaliações" valor="—" />
                </div>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#444", marginBottom: "8px" }}>Ações rápidas</div>
                <div
                  className="home-demo-cursor"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    background: "#FDECEC",
                    border: "1px solid #F5C6C6",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    color: "#C0392B",
                    width: "fit-content",
                  }}
                >
                  ➕ Adicionar novo livro
                </div>
              </>
            )}
            {passo === 1 && (
              <>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#002776", marginBottom: "14px" }}>📕 Colocar livro à venda</div>
                <CampoForm label="Título do livro" comCursor>
                  <CampoDigitado texto="O Silêncio dos Labirintos" delayMs={0} />
                </CampoForm>
                <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <CampoForm label="Gênero">
                    <span style={{ color: "#262626" }}>Romance</span>
                  </CampoForm>
                  <CampoForm label="Preço (R$)">
                    <CampoDigitado texto="49,90" delayMs={1300} />
                  </CampoForm>
                </div>
                <button style={{ background: "#009B3A", color: "white", border: "none", padding: "9px 18px", borderRadius: "6px", fontWeight: 600, fontSize: "13px", marginTop: "10px" }}>
                  Publicar livro à venda
                </button>
              </>
            )}
            {passo === 2 && (
              <>
                <div style={{ fontSize: "16px", fontWeight: 700, color: "#002776", marginBottom: "6px" }}>Recebimento de vendas</div>
                <p style={{ fontSize: "12px", color: "#666", marginBottom: "14px", lineHeight: 1.5 }}>
                  Cadastre sua chave Pix pra receber o valor das vendas automaticamente.
                </p>
                <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "10px" }}>
                  <CampoForm label="Chave Pix" comCursor>
                    <CampoDigitado texto="autor@exemplo.com" delayMs={0} />
                  </CampoForm>
                  <CampoForm label="Tipo">
                    <span style={{ color: "#262626" }}>E-mail</span>
                  </CampoForm>
                </div>
                <button style={{ background: "#009B3A", color: "white", border: "none", padding: "9px 18px", borderRadius: "6px", fontWeight: 600, fontSize: "13px", marginTop: "10px" }}>
                  Salvar chave Pix
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: "28px" }}>
        <Link href="/cadastro" style={{ display: "inline-block", background: "#009B3A", color: "white", padding: "12px 32px", fontWeight: 600, borderRadius: "4px" }}>
          CRIAR MINHA CONTA
        </Link>
      </div>
    </section>
  );
}
