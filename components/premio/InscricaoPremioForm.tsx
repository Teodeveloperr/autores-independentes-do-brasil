"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import TurnstileWidget from "@/components/TurnstileWidget";
import { enviarInscricaoPremio, iniciarEnvioPremio } from "@/app/premio/actions";
import { validarCpf } from "@/lib/cpf";
import { MENSAGEM_VERIFICACAO_INDISPONIVEL, erroDoTurnstile, reiniciarTurnstile, tokenTurnstile } from "@/lib/turnstileCliente";
import {
  PREMIO_ARQUIVOS,
  PREMIO_CATEGORIAS,
  PREMIO_PIX_INSTITUTO,
  PREMIO_VALOR_CENTAVOS,
  arquivosDaForma,
  extensaoDoArquivo,
  prefixoPremio,
  tipoDaExtensao,
  validarArquivoPremio,
  validarDadosPremio,
  type ArquivoPremio,
  type FormaPagamentoPremio,
} from "@/lib/premio";

const VALOR_TEXTO = (PREMIO_VALOR_CENTAVOS / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const campo: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "14px", background: "white" };
const rotulo: React.CSSProperties = { display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" };

const TEM_ANTI_ROBO = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

export default function InscricaoPremioForm() {
  const [dados, setDados] = useState({ nome: "", nomeArtistico: "", telefone: "", email: "", titulo: "", categoria: "" });
  const [arquivos, setArquivos] = useState<Partial<Record<ArquivoPremio, File>>>({});
  const [forma, setForma] = useState<FormaPagamentoPremio>("cartao");
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState("");
  const [enviado, setEnviado] = useState(false);

  function problema(): string | null {
    const d = validarDadosPremio(dados);
    if (d) return d;
    if (forma === "cartao" && !validarCpf(cpf)) return "Informe um CPF válido para o pagamento no cartão.";
    for (const tipo of arquivosDaForma(forma)) {
      const f = arquivos[tipo];
      if (!f) return `Anexe o arquivo: ${PREMIO_ARQUIVOS[tipo].rotulo}.`;
      const e = validarArquivoPremio(tipo, f.name, f.size);
      if (e) return e;
    }
    return null;
  }

  async function enviar(ev: React.FormEvent) {
    ev.preventDefault();
    if (enviando) return;
    const p = problema();
    if (p) return setErro(p);
    setErro("");

    try {
      // Sem o token do anti-robô o servidor recusaria o envio: avisa já, antes de subir arquivos grandes.
      const token = tokenTurnstile();
      if (TEM_ANTI_ROBO && !token) {
        setErro(MENSAGEM_VERIFICACAO_INDISPONIVEL);
        return;
      }
      setEnviando("Verificando...");
      const inicio = await iniciarEnvioPremio(token);
      reiniciarTurnstile();
      if (inicio.error || !inicio.sessao) {
        setErro(inicio.error ?? "Não foi possível iniciar o envio.");
        return;
      }
      const sessao = inicio.sessao;

      const nomes: Partial<Record<ArquivoPremio, string>> = {};
      for (const tipo of arquivosDaForma(forma)) {
        const f = arquivos[tipo] as File;
        const ext = extensaoDoArquivo(f.name) as string;
        nomes[tipo] = f.name;
        setEnviando(`Enviando ${PREMIO_ARQUIVOS[tipo].rotulo.toLowerCase()}: 0%`);
        await upload(`${prefixoPremio(sessao.pasta)}${tipo}.${ext}`, f, {
          access: "private",
          handleUploadUrl: "/api/premio/upload",
          clientPayload: JSON.stringify(sessao),
          contentType: tipoDaExtensao(ext) ?? undefined,
          multipart: f.size > 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setEnviando(`Enviando ${PREMIO_ARQUIVOS[tipo].rotulo.toLowerCase()}: ${Math.round(percentage)}%`),
        });
      }

      setEnviando(forma === "cartao" ? "Abrindo o pagamento..." : "Enviando a inscrição...");
      const r = await enviarInscricaoPremio(dados, sessao, nomes, { forma, cpf });
      if (r.error || !r.ok) {
        setErro(r.error ?? "Não foi possível enviar a inscrição.");
        return;
      }
      if (r.pagamentoUrl) {
        // Cartão: a Asaas recebe o pagamento e devolve a pessoa para /premio/obrigado.
        window.location.href = r.pagamentoUrl;
        return;
      }
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("[premio] Falha no envio:", err);
      setErro(
        erroDoTurnstile(err)
          ? MENSAGEM_VERIFICACAO_INDISPONIVEL
          : err instanceof Error && err.message
            ? err.message
            : "O envio falhou. Confira a sua conexão e tente de novo."
      );
    } finally {
      setEnviando("");
    }
  }

  if (enviado) {
    return (
      <div role="status" style={{ background: "#E8F5E9", color: "#1B5E20", padding: "24px", borderRadius: "8px", fontSize: "15px", lineHeight: 1.6 }}>
        <b style={{ fontSize: "18px" }}>Inscrição enviada!</b>
        <p style={{ margin: "8px 0 0" }}>
          Recebemos os seus dados e arquivos. Enviamos uma confirmação para {dados.email}. A inscrição só é efetivada depois da conferência dos arquivos e da confirmação do pagamento.
        </p>
      </div>
    );
  }

  const set = (k: keyof typeof dados) => (ev: React.ChangeEvent<HTMLInputElement>) => {
    setDados({ ...dados, [k]: ev.target.value });
    setErro("");
  };

  return (
    <form onSubmit={enviar} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#002776", margin: 0 }}>Ficha de inscrição</h2>
      <div>
        <label htmlFor="pr-nome" style={rotulo}>Nome Completo *</label>
        <input id="pr-nome" type="text" autoComplete="name" required maxLength={150} value={dados.nome} onChange={set("nome")} style={campo} />
      </div>
      <div>
        <label htmlFor="pr-artistico" style={rotulo}>Nome Artístico *</label>
        <input id="pr-artistico" type="text" required maxLength={150} value={dados.nomeArtistico} onChange={set("nomeArtistico")} style={campo} />
      </div>
      <div>
        <label htmlFor="pr-telefone" style={rotulo}>Telefone de contato com DDD *</label>
        <input id="pr-telefone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={30} value={dados.telefone} onChange={set("telefone")} placeholder="(00) 00000-0000" style={campo} />
      </div>
      <div>
        <label htmlFor="pr-email" style={rotulo}>Seu e-mail de contato *</label>
        <input id="pr-email" type="email" autoComplete="email" required maxLength={200} value={dados.email} onChange={set("email")} style={campo} />
      </div>
      <div>
        <label htmlFor="pr-titulo" style={rotulo}>Título do Livro *</label>
        <input id="pr-titulo" type="text" required maxLength={200} value={dados.titulo} onChange={set("titulo")} style={campo} />
      </div>

      <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
        <legend style={rotulo}>Categoria * <span style={{ fontWeight: 400, color: "#666" }}>(marque apenas 1 opção)</span></legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {PREMIO_CATEGORIAS.map((c) => (
            <label key={c} style={{ display: "flex", gap: "10px", alignItems: "center", fontSize: "14px", cursor: "pointer" }}>
              <input type="radio" name="categoria" value={c} checked={dados.categoria === c} onChange={() => { setDados({ ...dados, categoria: c }); setErro(""); }} />
              {c}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset style={{ border: "1px solid #E0E0E0", borderRadius: "8px", padding: "16px", margin: 0 }}>
        <legend style={{ ...rotulo, padding: "0 8px", marginBottom: 0 }}>Pagamento da taxa de inscrição ({VALOR_TEXTO}) *</legend>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px", cursor: "pointer" }}>
            <input type="radio" name="forma-pagamento" checked={forma === "cartao"} onChange={() => { setForma("cartao"); setErro(""); }} style={{ marginTop: "3px" }} />
            <span>
              <b>Cartão de crédito à vista, pela plataforma</b>
              <br />
              <span style={{ color: "#555" }}>Você paga em uma página segura e a inscrição é confirmada na hora, <b>sem enviar comprovante</b>.</span>
            </span>
          </label>
          <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px", cursor: "pointer" }}>
            <input type="radio" name="forma-pagamento" checked={forma === "comprovante"} onChange={() => { setForma("comprovante"); setErro(""); }} style={{ marginTop: "3px" }} />
            <span>
              <b>Pix para o Instituto Palavra que Liberta</b>
              <br />
              <span style={{ color: "#555" }}>Pague por Pix na chave abaixo e anexe o comprovante.</span>
            </span>
          </label>
        </div>

        {forma === "cartao" ? (
          <div style={{ marginTop: "16px" }}>
            <label htmlFor="pr-cpf" style={rotulo}>CPF de quem vai pagar * <span style={{ fontWeight: 400, color: "#666" }}>(exigido pela operadora de pagamento)</span></label>
            <input id="pr-cpf" type="text" inputMode="numeric" autoComplete="off" maxLength={14} value={cpf} onChange={(ev) => { setCpf(ev.target.value); setErro(""); }} placeholder="000.000.000-00" style={campo} />
            <p style={{ fontSize: "12px", color: "#666", margin: "8px 0 0", lineHeight: 1.5 }}>
              Ao enviar, você será levado à página de pagamento. Se precisar pedir estorno depois, fale com a organização pelo WhatsApp (79) 99182-1546.
            </p>
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#444", margin: "16px 0 0", lineHeight: 1.6, background: "#F6F6F6", padding: "10px 12px", borderRadius: "6px" }}>
            Chave Pix: <b>{PREMIO_PIX_INSTITUTO.chave}</b>
            <br />
            Favorecido: {PREMIO_PIX_INSTITUTO.favorecido}
          </p>
        )}
      </fieldset>

      {arquivosDaForma(forma).map((tipo) => (
        <div key={tipo}>
          <label htmlFor={`pr-${tipo}`} style={rotulo}>
            {PREMIO_ARQUIVOS[tipo].rotulo} * <span style={{ fontWeight: 400, color: "#666" }}>({PREMIO_ARQUIVOS[tipo].dica})</span>
          </label>
          <input
            id={`pr-${tipo}`}
            type="file"
            className="arquivo-premio"
            required
            accept={PREMIO_ARQUIVOS[tipo].extensoes.map((x) => `.${x}`).join(",")}
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              setArquivos((a) => ({ ...a, [tipo]: f }));
              setErro(f ? validarArquivoPremio(tipo, f.name, f.size) ?? "" : "");
            }}
            style={{ ...campo, padding: "8px" }}
          />
        </div>
      ))}

      <TurnstileWidget />

      {erro && <div role="alert" style={{ background: "#FDECEA", color: "#B71C1C", padding: "12px 14px", borderRadius: "6px", fontSize: "14px" }}>{erro}</div>}
      <button
        type="submit"
        disabled={!!enviando}
        style={{ background: enviando ? "#8a98b8" : "#002776", color: "white", border: "none", padding: "14px 24px", borderRadius: "6px", fontSize: "15px", fontWeight: 700, cursor: enviando ? "wait" : "pointer" }}
      >
        {enviando || (forma === "cartao" ? `Enviar e pagar ${VALOR_TEXTO}` : "Enviar inscrição")}
      </button>
      <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>Ao enviar, você declara conhecer e aceitar o regulamento acima.</p>
    </form>
  );
}
