"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { enviarContratoPorEmail, gerarPagamento } from "@/app/contrato-bienal/actions";

const botao = (cor: string, desabilitado: boolean): React.CSSProperties => ({
  background: cor,
  color: "white",
  padding: "12px 22px",
  fontWeight: 700,
  borderRadius: "6px",
  fontSize: "14px",
  opacity: desabilitado ? 0.6 : 1,
  textDecoration: "none",
  display: "inline-block",
  textAlign: "center",
});

function Mensagem({ texto, tipo }: { texto: string; tipo: "erro" | "ok" }) {
  if (!texto) return null;
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      style={{
        fontSize: "13px",
        padding: "10px 14px",
        borderRadius: "6px",
        background: tipo === "erro" ? "#FDEDEC" : "#E3F4EA",
        color: tipo === "erro" ? "#C0392B" : "#0a6130",
      }}
    >
      {texto}
    </div>
  );
}

export default function ContratoAcompanhamento({
  token,
  status,
  linkGrupo,
}: {
  token: string;
  status: "assinado" | "pago";
  linkGrupo: string;
}) {
  const router = useRouter();
  const [pendente, iniciarTransicao] = useTransition();
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [popupAberto, setPopupAberto] = useState(status === "pago" && Boolean(linkGrupo));

  // Enquanto o pagamento não é confirmado, confere de tempos em tempos (a página consulta a Asaas).
  useEffect(() => {
    if (status !== "assinado") return;
    let tentativas = 0;
    const id = window.setInterval(() => {
      tentativas += 1;
      router.refresh();
      if (tentativas >= 20) window.clearInterval(id);
    }, 8000);
    return () => window.clearInterval(id);
  }, [status, router]);

  function irParaPagamento() {
    setErro("");
    iniciarTransicao(async () => {
      const resultado = await gerarPagamento(token);
      if ("erro" in resultado) return setErro(resultado.erro);
      if ("pago" in resultado) return router.refresh();
      window.location.assign(resultado.pagamentoUrl);
    });
  }

  function enviarEmail() {
    setErro("");
    setAviso("");
    iniciarTransicao(async () => {
      const resultado = await enviarContratoPorEmail(token);
      if (resultado.erro) return setErro(resultado.erro);
      setAviso(`Contrato enviado para ${resultado.enviadoPara}. Confira também a caixa de spam.`);
    });
  }

  if (status === "assinado") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "flex-start" }}>
        <button type="button" onClick={irParaPagamento} disabled={pendente} style={botao("#009B3A", pendente)}>
          {pendente ? "Abrindo pagamento..." : "Ir para o pagamento"}
        </button>
        <button type="button" onClick={() => router.refresh()} style={{ background: "none", border: "none", color: "#002776", fontWeight: 600, fontSize: "13px" }}>
          Já paguei. Verificar pagamento
        </button>
        <Mensagem texto={erro} tipo="erro" />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button type="button" onClick={enviarEmail} disabled={pendente} style={botao("#009B3A", pendente)}>
            {pendente ? "Enviando..." : "Enviar contrato por e-mail"}
          </button>
          <a href={`/api/contrato/${token}/pdf`} target="_blank" rel="noopener noreferrer" style={botao("#002776", false)}>
            Baixar PDF
          </a>
          {linkGrupo && (
            <button type="button" onClick={() => setPopupAberto(true)} style={botao("#25D366", false)}>
              💬 Grupo do WhatsApp
            </button>
          )}
        </div>
        <Mensagem texto={erro} tipo="erro" />
        <Mensagem texto={aviso} tipo="ok" />
      </div>

      {popupAberto && linkGrupo && (
        <div
          onClick={() => setPopupAberto(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Grupo de WhatsApp"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: "12px", padding: "36px", maxWidth: "440px", width: "100%", position: "relative", textAlign: "center" }}>
            <button
              type="button"
              onClick={() => setPopupAberto(false)}
              aria-label="Fechar"
              style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "20px", color: "#999", width: "32px", height: "32px" }}
            >
              ✕
            </button>
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>🎉</div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Sua participação está confirmada!</h2>
            <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.6, marginBottom: "24px" }}>
              Entre no nosso <strong>grupo de WhatsApp</strong> para receber as orientações da Bienal do Livro Rio 2027 e falar com a equipe e com os outros autores.
            </p>
            <a
              href={linkGrupo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPopupAberto(false)}
              style={{ display: "block", background: "#25D366", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", textDecoration: "none", marginBottom: "10px" }}
            >
              💬 Entrar no grupo do WhatsApp
            </a>
            <button
              type="button"
              onClick={() => setPopupAberto(false)}
              style={{ background: "white", border: "1px solid #DDD", color: "#666", padding: "10px", fontWeight: 600, borderRadius: "6px", fontSize: "13px", width: "100%" }}
            >
              Agora não
            </button>
          </div>
        </div>
      )}
    </>
  );
}
