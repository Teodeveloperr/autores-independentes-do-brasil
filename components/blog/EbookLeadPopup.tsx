"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TurnstileWidget from "@/components/TurnstileWidget";
import { pedirEbookGuia } from "@/app/blog/ebook-actions";
import { EBOOK_GUIA, validarLeadEbook } from "@/lib/ebookLead";

// Pop-up de captação do e-book gratuito (blog): pede nome, e-mail e WhatsApp e libera o download.
// Abre sozinho em TODA visita à home, 2 segundos depois da entrada: não guarda nada no navegador para
// "lembrar" que a pessoa fechou ou já baixou (decisão do negócio: máxima captação).

function tokenAntiRobo(): string | null {
  return document.querySelector<HTMLInputElement>('.ebook-lead-form input[name="cf-turnstile-response"]')?.value || null;
}

const campo: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 12px", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "14px", background: "white" };
const rotulo: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "#262626" };

export function EbookLeadPopup({ origem, automatico = true, esperaMs = 2000 }: { origem: string; automatico?: boolean; esperaMs?: number }) {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState({ nome: "", email: "", whatsapp: "", aceite: false });
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [link, setLink] = useState("");
  const botaoFecharRef = useRef<HTMLButtonElement>(null);

  const fechar = useCallback(() => setAberto(false), []);

  // Abre sozinho depois de alguns segundos, a cada vez que a página é aberta.
  useEffect(() => {
    if (!automatico) return;
    const t = window.setTimeout(() => setAberto(true), esperaMs);
    return () => window.clearTimeout(t);
  }, [automatico, esperaMs]);

  // Esc fecha; a página de trás não rola enquanto o pop-up está aberto.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (ev: KeyboardEvent) => ev.key === "Escape" && fechar();
    window.addEventListener("keydown", aoTeclar);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    botaoFecharRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflow;
    };
  }, [aberto, fechar]);

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (enviando) return;
    const p = validarLeadEbook(dados);
    if (p) return setErro(p);
    setErro("");
    setEnviando(true);
    try {
      const r = await pedirEbookGuia(dados, tokenAntiRobo(), origem);
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
      if (r.error || !r.url) {
        setErro(r.error ?? "Não foi possível liberar o e-book agora.");
        return;
      }
      setLink(r.url);
      window.location.href = r.url; // começa o download sem sair da página
    } catch {
      setErro("O envio falhou. Confira a sua conexão e tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  if (!aberto) return null;

  const set = (k: "nome" | "email" | "whatsapp") => (ev: React.ChangeEvent<HTMLInputElement>) => {
    setDados({ ...dados, [k]: ev.target.value });
    setErro("");
  };

  return (
    <div
      onClick={(ev) => ev.target === ev.currentTarget && fechar()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,20,60,0.62)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", overflowY: "auto" }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ebook-lead-titulo"
        style={{ background: "white", borderRadius: "12px", width: "100%", maxWidth: "760px", display: "flex", overflow: "hidden", position: "relative", boxShadow: "0 20px 60px rgba(0,0,0,0.35)", margin: "auto" }}
      >
        <button
          ref={botaoFecharRef}
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          style={{ position: "absolute", top: "10px", right: "12px", background: "white", border: "1px solid #E0E0E0", borderRadius: "50%", width: "32px", height: "32px", fontSize: "18px", lineHeight: 1, cursor: "pointer", color: "#444", zIndex: 1 }}
        >
          ×
        </button>

        <div className="ebook-lead-capa" style={{ background: "#002776", padding: "28px 24px", alignItems: "center", justifyContent: "center", flex: "0 0 270px" }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- capa do e-book, imagem fixa e já otimizada */}
          <img src="/ebook-capa.jpg" alt={`Capa do e-book ${EBOOK_GUIA.titulo}`} width={320} height={451} style={{ width: "100%", height: "auto", borderRadius: "4px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }} />
        </div>

        <div style={{ flex: 1, padding: "28px 28px 24px", minWidth: 0 }}>
          {link ? (
            <div role="status">
              <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", color: "#009B3A", textTransform: "uppercase", marginBottom: "6px" }}>Tudo certo</div>
              <h2 id="ebook-lead-titulo" style={{ fontSize: "22px", fontWeight: 700, color: "#002776", margin: "0 0 10px" }}>O seu e-book está a caminho</h2>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#262626", margin: "0 0 18px" }}>
                O download começou. Se não começar, use o botão abaixo. O link vale por algumas horas; depois é só pedir de novo.
              </p>
              <a href={link} style={{ display: "inline-block", background: "#009B3A", color: "white", padding: "13px 22px", borderRadius: "6px", fontSize: "15px", fontWeight: 700, textDecoration: "none" }}>
                Baixar o e-book
              </a>
              <button type="button" onClick={() => setAberto(false)} style={{ display: "block", marginTop: "14px", background: "none", border: "none", color: "#666", fontSize: "13px", cursor: "pointer", padding: 0, textDecoration: "underline" }}>
                Fechar
              </button>
            </div>
          ) : (
            <form className="ebook-lead-form" onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: "11px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1.5px", color: "#009B3A", textTransform: "uppercase" }}>E-book gratuito</div>
              <h2 id="ebook-lead-titulo" style={{ fontSize: "22px", fontWeight: 700, color: "#002776", margin: 0, lineHeight: 1.2, paddingRight: "28px" }}>
                {EBOOK_GUIA.titulo}
              </h2>
              <p style={{ fontSize: "14px", lineHeight: 1.55, color: "#262626", margin: "0 0 4px" }}>
                Do texto ao livro pronto, da impressão à divulgação, e como o Coletivo Autores do Brasil pode ajudar na sua jornada. Preencha e baixe agora.
              </p>
              <div>
                <label htmlFor="eb-nome" style={rotulo}>Nome</label>
                <input id="eb-nome" type="text" autoComplete="name" required maxLength={150} value={dados.nome} onChange={set("nome")} style={campo} />
              </div>
              <div>
                <label htmlFor="eb-email" style={rotulo}>E-mail</label>
                <input id="eb-email" type="email" autoComplete="email" required maxLength={200} value={dados.email} onChange={set("email")} style={campo} />
              </div>
              <div>
                <label htmlFor="eb-whats" style={rotulo}>WhatsApp com DDD</label>
                <input id="eb-whats" type="tel" autoComplete="tel" inputMode="tel" required maxLength={30} value={dados.whatsapp} onChange={set("whatsapp")} placeholder="(00) 00000-0000" style={campo} />
              </div>
              <label style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "12px", lineHeight: 1.45, color: "#444", cursor: "pointer" }}>
                <input type="checkbox" checked={dados.aceite} onChange={(ev) => { setDados({ ...dados, aceite: ev.target.checked }); setErro(""); }} style={{ marginTop: "2px", flexShrink: 0 }} />
                <span>
                  Autorizo o envio do e-book e o contato do Coletivo Autores do Brasil por e-mail e WhatsApp, conforme a{" "}
                  <Link href="/politica-de-privacidade" target="_blank" style={{ color: "#002776", textDecoration: "underline" }}>Política de Privacidade</Link>.
                </span>
              </label>
              <TurnstileWidget />
              {erro && <div role="alert" style={{ background: "#FDECEA", color: "#B71C1C", padding: "10px 12px", borderRadius: "6px", fontSize: "13px" }}>{erro}</div>}
              <button
                type="submit"
                disabled={enviando}
                style={{ background: enviando ? "#8a98b8" : "#009B3A", color: "white", border: "none", padding: "13px 20px", borderRadius: "6px", fontSize: "15px", fontWeight: 700, cursor: enviando ? "wait" : "pointer" }}
              >
                {enviando ? "Liberando..." : "Quero baixar o e-book"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
