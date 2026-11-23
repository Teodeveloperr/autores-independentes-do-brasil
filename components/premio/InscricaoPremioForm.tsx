"use client";

import { useState } from "react";
import { upload } from "@vercel/blob/client";
import TurnstileWidget from "@/components/TurnstileWidget";
import { enviarInscricaoPremio, iniciarEnvioPremio } from "@/app/premio/actions";
import {
  PREMIO_ARQUIVOS,
  PREMIO_CATEGORIAS,
  PREMIO_ORDEM_ARQUIVOS,
  extensaoDoArquivo,
  prefixoPremio,
  tipoDaExtensao,
  validarArquivoPremio,
  validarDadosPremio,
  type ArquivoPremio,
} from "@/lib/premio";

const campo: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "14px", background: "white" };
const rotulo: React.CSSProperties = { display: "block", fontSize: "14px", fontWeight: 600, marginBottom: "6px" };

function tokenAntiRobo(): string | null {
  return document.querySelector<HTMLInputElement>('input[name="cf-turnstile-response"]')?.value || null;
}

export default function InscricaoPremioForm() {
  const [dados, setDados] = useState({ nome: "", nomeArtistico: "", telefone: "", email: "", titulo: "", categoria: "" });
  const [arquivos, setArquivos] = useState<Partial<Record<ArquivoPremio, File>>>({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState("");
  const [enviado, setEnviado] = useState(false);

  function problema(): string | null {
    const d = validarDadosPremio(dados);
    if (d) return d;
    for (const tipo of PREMIO_ORDEM_ARQUIVOS) {
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
      setEnviando("Verificando...");
      const inicio = await iniciarEnvioPremio(tokenAntiRobo());
      (window as unknown as { turnstile?: { reset: () => void } }).turnstile?.reset();
      if (inicio.error || !inicio.sessao) {
        setErro(inicio.error ?? "Não foi possível iniciar o envio.");
        return;
      }
      const sessao = inicio.sessao;

      const nomes = {} as Record<ArquivoPremio, string>;
      for (const tipo of PREMIO_ORDEM_ARQUIVOS) {
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

      setEnviando("Enviando a inscrição...");
      const r = await enviarInscricaoPremio(dados, sessao, nomes);
      if (r.error || !r.ok) {
        setErro(r.error ?? "Não foi possível enviar a inscrição.");
        return;
      }
      setEnviado(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setErro(err instanceof Error && err.message ? err.message : "O envio falhou. Confira a sua conexão e tente de novo.");
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

      {PREMIO_ORDEM_ARQUIVOS.map((tipo) => (
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
        {enviando || "Enviar inscrição"}
      </button>
      <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>Ao enviar, você declara conhecer e aceitar o regulamento acima.</p>
    </form>
  );
}
