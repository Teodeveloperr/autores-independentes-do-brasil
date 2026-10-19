"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import type { AuthorWithRelations, PainelView } from "./types";

const card: React.CSSProperties = { background: "white", borderRadius: "10px", padding: "24px" };
const titulo: React.CSSProperties = { fontWeight: 700, color: "#002776", marginBottom: "6px" };
const subtitulo: React.CSSProperties = { fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "16px" };
const botaoPrimario: React.CSSProperties = { background: "#009B3A", color: "white", padding: "10px 18px", fontWeight: 700, borderRadius: "6px", fontSize: "13px", border: "none" };
const botaoSecundario: React.CSSProperties = { background: "white", color: "#002776", padding: "9px 14px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", border: "1px solid #DDD", textDecoration: "none", display: "inline-block" };

function copiarViaTextarea(texto: string): boolean {
  const textarea = document.createElement("textarea");
  textarea.value = texto;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  let sucesso = false;
  try {
    sucesso = document.execCommand("copy");
  } catch {
    sucesso = false;
  }
  document.body.removeChild(textarea);
  return sucesso;
}

async function copiarTexto(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    return copiarViaTextarea(texto);
  }
}

function BotaoCopiar({ texto, rotulo = "Copiar" }: { texto: string; rotulo?: string }) {
  const [copiado, setCopiado] = useState(false);
  async function aoClicar() {
    if (await copiarTexto(texto)) {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    }
  }
  return (
    <button type="button" onClick={aoClicar} style={copiado ? { ...botaoSecundario, color: "#009B3A", border: "1px solid #009B3A" } : botaoSecundario}>
      {copiado ? "✓ Copiado!" : rotulo}
    </button>
  );
}

/**
 * Kit de divulgação do perfil: o link pra copiar e compartilhar, o QR Code pra baixar e textos
 * prontos. Tudo feito no navegador do autor, sem serviço externo e sem custo.
 */
export default function DivulgacaoView({
  author,
  siteUrl,
  onNavigate,
}: {
  author: AuthorWithRelations;
  siteUrl: string;
  onNavigate: (view: PainelView) => void;
}) {
  const link = `${siteUrl.replace(/\/$/, "")}/perfil/${author.id}`;
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    QRCode.toDataURL(link, { width: 600, margin: 2, color: { dark: "#002776", light: "#FFFFFF" } })
      .then((url) => {
        if (ativo) setQrDataUrl(url);
      })
      .catch(() => {
        if (ativo) setQrDataUrl(null);
      });
    return () => {
      ativo = false;
    };
  }, [link]);

  const ultimoLivro = author.books[0]?.titulo ?? null;
  const textoCurto = `Conheça meu perfil de autor(a) no Autores Independentes do Brasil${ultimoLivro ? `: lá você encontra "${ultimoLivro}"` : ""}.`;

  const textos = [
    {
      rotulo: "Bio do Instagram",
      dica: "Cabe nos 150 caracteres da bio.",
      texto: `📚 Autor(a) independente\nMeus livros e novidades 👇\n${link}`,
    },
    {
      rotulo: "Mensagem para WhatsApp",
      dica: "Para grupos, listas de transmissão e conversas.",
      texto: `Oi! ${textoCurto}\n${link}`,
    },
    {
      rotulo: "Legenda de post",
      dica: "Para o Instagram, o Facebook ou o LinkedIn.",
      texto: `Meus livros estão reunidos no meu perfil do coletivo Autores Independentes do Brasil. Dá uma olhada, escolha o seu e apoie a literatura independente 💚\n\n${link}`,
    },
  ];

  const compartilhar = [
    { rotulo: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${textoCurto} ${link}`)}` },
    { rotulo: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}` },
    { rotulo: "X (Twitter)", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(textoCurto)}&url=${encodeURIComponent(link)}` },
    { rotulo: "Telegram", href: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(textoCurto)}` },
  ];

  const passos: { ok: boolean; texto: string; ir: PainelView; acao: string }[] = [
    { ok: Boolean(author.fotoUrl), texto: "Foto de perfil: aparece na prévia quando o link é compartilhado", ir: "perfil", acao: "Adicionar foto" },
    { ok: author.books.length > 0, texto: "Pelo menos um livro cadastrado", ir: "livros", acao: "Cadastrar livro" },
    { ok: Boolean(author.bannerUrl), texto: "Banner do perfil: deixa a sua página mais bonita", ir: "perfil", acao: "Adicionar banner" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "860px" }}>
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>📣 Divulgue seu perfil</h2>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5 }}>
          O seu perfil público é a sua vitrine: quanto mais gente chegar nele, mais chances de vender. Copie o link e compartilhe onde os seus leitores estão.
        </p>
      </div>

      <div style={card}>
        <div style={titulo}>Seu link</div>
        <p style={subtitulo}>Coloque na bio do Instagram, na assinatura de e-mail, nos grupos e em tudo o que você divulgar.</p>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "14px" }}>
          <input
            readOnly
            value={link}
            onClick={(e) => e.currentTarget.select()}
            aria-label="Link do seu perfil"
            style={{ flex: "1 1 280px", minWidth: 0, padding: "10px 12px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px", background: "#FAFAFA" }}
          />
          <BotaoCopiar texto={link} rotulo="Copiar link" />
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "#666", marginRight: "4px" }}>Compartilhar em:</span>
          {compartilhar.map((c) => (
            <a key={c.rotulo} href={c.href} target="_blank" rel="noopener noreferrer" style={botaoSecundario}>
              {c.rotulo}
            </a>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={titulo}>QR Code do seu perfil</div>
        <p style={subtitulo}>Quem apontar a câmera do celular vai direto para o seu perfil. Use em marcadores de livro, cartões, banners e no estande dos eventos.</p>
        <div style={{ display: "flex", gap: "24px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: "180px", height: "180px", border: "1px solid #E0E0E0", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "white", flexShrink: 0 }}>
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- QR gerado no navegador (data URL)
              <img src={qrDataUrl} alt="QR Code do seu perfil" width={168} height={168} />
            ) : (
              <span style={{ fontSize: "12px", color: "#999" }}>Gerando...</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {qrDataUrl && (
              <a href={qrDataUrl} download="qrcode-meu-perfil.png" style={{ ...botaoPrimario, textDecoration: "none", display: "inline-block", textAlign: "center" }}>
                Baixar QR Code (PNG)
              </a>
            )}
            <span style={{ fontSize: "12px", color: "#666", maxWidth: "260px", lineHeight: 1.5 }}>A imagem é grande e nítida, boa para imprimir.</span>
          </div>
        </div>
      </div>

      <div style={card}>
        <div style={titulo}>Textos prontos</div>
        <p style={subtitulo}>Copie, cole e, se quiser, ajuste com as suas palavras.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {textos.map((t) => (
            <div key={t.rotulo} style={{ border: "1px solid #E8E8E8", borderRadius: "8px", padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>{t.rotulo}</div>
                  <div style={{ fontSize: "11px", color: "#999" }}>{t.dica}</div>
                </div>
                <BotaoCopiar texto={t.texto} />
              </div>
              <div style={{ fontSize: "13px", color: "#444", whiteSpace: "pre-wrap", background: "#F6F6F6", borderRadius: "6px", padding: "10px 12px", lineHeight: 1.5, overflowWrap: "anywhere" }}>{t.texto}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={titulo}>Seu perfil está pronto para ser divulgado?</div>
        <p style={subtitulo}>Perfis completos chamam mais atenção quando o link é compartilhado.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {passos.map((p) => (
            <div key={p.texto} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", fontSize: "13px" }}>
              <span style={{ color: p.ok ? "#009B3A" : "#262626" }}>
                {p.ok ? "✅" : "⬜"} {p.texto}
              </span>
              {!p.ok && (
                <button type="button" onClick={() => onNavigate(p.ir)} style={botaoSecundario}>
                  {p.acao} →
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
