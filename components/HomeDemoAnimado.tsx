"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const INTERVALO_MS = 5000;
const VELOCIDADE_MS_POR_CARACTERE = 45;

const PASSOS = ["Cadastre seu livro", "Configure sua chave Pix", "Comece a vender"];

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

function Campo({ label, children, comCursor }: { label: string; children: React.ReactNode; comCursor?: boolean }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <div style={{ fontSize: "12px", color: "#999", marginBottom: "6px" }}>{label}</div>
      <div
        className={comCursor ? "home-demo-cursor" : undefined}
        style={{ border: "1px solid #E0E0E0", borderRadius: "6px", padding: "10px 12px", fontSize: "14px", color: "#262626", background: "#FAFAFA", minHeight: "18px" }}
      >
        {children}
      </div>
    </div>
  );
}

// Demo "como funciona" da home: um mockup do painel que se preenche sozinho (efeito de
// digitação em CSS puro via home-demo-digitar), passando por 3 passos — cadastrar livro,
// configurar Pix, vender — trocando de passo sozinho a cada alguns segundos. Não é uma
// gravação real do painel, é uma recriação simplificada só pra ilustrar o fluxo.
export default function HomeDemoAnimado() {
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    const intervalo = setInterval(() => setPasso((p) => (p + 1) % PASSOS.length), INTERVALO_MS);
    return () => clearInterval(intervalo);
  }, []);

  return (
    <section
      className="responsive-grid section-pad-lg"
      style={{ background: "white", padding: "48px 40px", marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}
    >
      <div>
        <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776", marginBottom: "16px" }}>Veja como é fácil vender seus livros</h2>
        <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.6, marginBottom: "28px" }}>
          Cadastre seu livro, configure sua chave Pix e comece a vender direto pra quem lê você — sem complicação.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "28px" }}>
          {PASSOS.map((titulo, i) => (
            <div key={titulo} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "13px",
                  fontWeight: 700,
                  background: i === passo ? "#002776" : "#F6F6F6",
                  color: i === passo ? "white" : "#999",
                  transition: "background 300ms ease, color 300ms ease",
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: "15px", fontWeight: i === passo ? 700 : 400, color: i === passo ? "#002776" : "#666", transition: "color 300ms ease" }}>
                {titulo}
              </div>
            </div>
          ))}
        </div>
        <Link href="/cadastro" style={{ display: "inline-block", background: "#009B3A", color: "white", padding: "12px 32px", fontWeight: 600, borderRadius: "4px" }}>
          CRIAR MINHA CONTA
        </Link>
      </div>

      <div style={{ background: "white", borderRadius: "12px", boxShadow: "0 20px 50px rgba(0,39,118,0.15)", overflow: "hidden", maxWidth: "420px", margin: "0 auto", width: "100%" }}>
        <div style={{ background: "#F6F6F6", padding: "10px 16px", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FF5F57" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#FEBC2E" }} />
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#28C840" }} />
          <span style={{ marginLeft: "10px", fontSize: "11px", color: "#999" }}>painel.autoresdobrasil.com.br</span>
        </div>
        <div key={passo} style={{ padding: "32px 28px", minHeight: "300px" }}>
          {passo === 0 && (
            <>
              <Campo label="Título do livro" comCursor>
                <CampoDigitado texto="O Silêncio dos Labirintos" delayMs={0} />
              </Campo>
              <Campo label="Preço">
                <CampoDigitado texto="R$ 30,00" delayMs={1300} />
              </Campo>
              <button
                style={{ background: "#009B3A", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", fontWeight: 600, fontSize: "13px", marginTop: "8px" }}
              >
                📖 Publicar livro
              </button>
            </>
          )}
          {passo === 1 && (
            <>
              <Campo label="Tipo de chave">
                <span style={{ color: "#262626" }}>E-mail</span>
              </Campo>
              <Campo label="Chave Pix" comCursor>
                <CampoDigitado texto="autor@exemplo.com" delayMs={400} />
              </Campo>
              <button
                style={{ background: "#002776", color: "white", border: "none", padding: "10px 20px", borderRadius: "6px", fontWeight: 600, fontSize: "13px", marginTop: "8px" }}
              >
                ✅ Salvar chave Pix
              </button>
            </>
          )}
          {passo === 2 && (
            <div>
              <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "16px", marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
                <div style={{ width: "50px", height: "66px", background: "#E0E0E0", borderRadius: "4px", flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>O Silêncio dos Labirintos</div>
                  <div style={{ fontSize: "13px", color: "#009B3A", fontWeight: 700 }}>R$ 30,00</div>
                </div>
              </div>
              <div style={{ background: "#E8F8ED", color: "#009B3A", padding: "14px", borderRadius: "8px", fontWeight: 600, fontSize: "14px" }}>
                💰 Nova venda! R$ 30,00 recebidos via Pix
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
