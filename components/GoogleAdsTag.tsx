"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import Script from "next/script";
import { usePathname } from "next/navigation";

// ID público da conta do Google Ads (aparece no código de qualquer site que usa a tag).
const GOOGLE_ADS_ID = "AW-17960120967";

// Escolha do visitante sobre cookies de publicidade, guardada no próprio navegador.
const CHAVE = "aib_cookies_publicidade";
type Escolha = "aceito" | "recusado" | null | "servidor";

const ouvintes = new Set<() => void>();

function assinar(aviso: () => void) {
  ouvintes.add(aviso);
  window.addEventListener("storage", aviso);
  return () => {
    ouvintes.delete(aviso);
    window.removeEventListener("storage", aviso);
  };
}

function lerEscolha(): Escolha {
  try {
    const valor = localStorage.getItem(CHAVE);
    return valor === "aceito" || valor === "recusado" ? valor : null;
  } catch {
    // Sem acesso ao armazenamento (aba privada bloqueando, etc.): trata como recusa, sem insistir no aviso.
    return "recusado";
  }
}

function gravarEscolha(valor: "aceito" | "recusado" | null) {
  try {
    if (valor) localStorage.setItem(CHAVE, valor);
    else localStorage.removeItem(CHAVE);
  } catch {
    // Segue sem gravar; o aviso volta na próxima visita.
  }
  ouvintes.forEach((aviso) => aviso());
}

function useEscolha(): Escolha {
  return useSyncExternalStore(assinar, lerEscolha, () => "servidor" as Escolha);
}

/**
 * Tag do Google Ads com aviso de cookies (LGPD): a tag só é carregada depois que o visitante
 * aceita os cookies de publicidade. Fica fora do admin, que é uso interno.
 */
export default function GoogleAdsTag() {
  const pathname = usePathname();
  const escolha = useEscolha();

  if (pathname.startsWith("/admin")) return null;

  if (escolha === "aceito") {
    return (
      <>
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GOOGLE_ADS_ID}');`}
        </Script>
      </>
    );
  }

  if (escolha !== null) return null;

  return (
    <div
      role="region"
      aria-label="Aviso de cookies"
      style={{
        position: "fixed",
        left: "16px",
        right: "16px",
        bottom: "16px",
        zIndex: 900,
        maxWidth: "720px",
        margin: "0 auto",
        background: "white",
        color: "#262626",
        border: "1px solid #E0E0E0",
        borderTop: "4px solid #FFDF00",
        borderRadius: "10px",
        boxShadow: "0 8px 30px rgba(0,0,0,0.18)",
        padding: "18px 20px",
        display: "flex",
        flexWrap: "wrap",
        gap: "14px",
        alignItems: "center",
      }}
    >
      <p style={{ flex: "1 1 320px", margin: 0, fontSize: "13px", lineHeight: 1.6 }}>
        Usamos cookies de publicidade do Google para medir o resultado dos nossos anúncios. Eles só são ativados se você
        aceitar. Saiba mais na{" "}
        <Link href="/politica-de-privacidade" style={{ color: "#002776", fontWeight: 600, textDecoration: "underline" }}>
          Política de Privacidade
        </Link>
        .
      </p>
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => gravarEscolha("recusado")}
          style={{ background: "white", border: "1px solid #002776", color: "#002776", padding: "10px 18px", fontWeight: 700, borderRadius: "6px", fontSize: "13px" }}
        >
          Recusar
        </button>
        <button
          type="button"
          onClick={() => gravarEscolha("aceito")}
          style={{ background: "#009B3A", border: "1px solid #009B3A", color: "white", padding: "10px 18px", fontWeight: 700, borderRadius: "6px", fontSize: "13px" }}
        >
          Aceitar
        </button>
      </div>
    </div>
  );
}

/** Botão da Política de Privacidade para o visitante rever a escolha (o aviso volta a aparecer). */
export function RedefinirCookiesButton() {
  const escolha = useEscolha();
  const texto =
    escolha === "aceito" ? "Você aceitou os cookies de publicidade." : escolha === "recusado" ? "Você recusou os cookies de publicidade." : "";

  return (
    <span style={{ display: "inline-flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
      {texto && <span>{texto}</span>}
      <button
        type="button"
        onClick={() => {
          gravarEscolha(null);
          // Recarrega para a tag já carregada sair da página caso a escolha anterior fosse "aceito".
          window.location.reload();
        }}
        style={{ background: "white", border: "1px solid #002776", color: "#002776", padding: "8px 14px", fontWeight: 700, borderRadius: "6px", fontSize: "13px" }}
      >
        Rever minha escolha
      </button>
    </span>
  );
}
