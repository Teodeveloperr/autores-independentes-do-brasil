"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { enviarPedidoImpressao, solicitarOrcamentoImpressao } from "@/app/painel/impressaoActions";
import {
  CAPA_CORES,
  CAPA_PAPEIS,
  ENCADERNACOES,
  ESPECIFICACOES_PADRAO,
  FORMATOS,
  IMPRESSAO_MAX_CAPA_BYTES,
  IMPRESSAO_MAX_MIOLO_BYTES,
  LAMINACOES,
  MIOLO_CORES,
  MIOLO_PAPEIS,
  STATUS_IMPRESSAO,
  medidasDoFormato,
  numeroDoPedidoImpressao,
  prefixoImpressao,
  tamanhoLegivel,
  validarEspecificacoes,
  type EspecificacoesImpressao,
} from "@/lib/impressao";
import type { PedidoImpressaoResumo } from "./types";

// Tela "Imprimir meu livro": o autor configura o livro, escolhe os PDFs de capa e miolo, folheia a
// pré-impressão e envia o pedido. Os PDFs são lidos no próprio navegador (pdf.js) para a prévia e
// só sobem para o armazenamento privado na hora do envio.

type PdfDoc = { numPages: number; getPage: (n: number) => Promise<PdfPagina> };
type PdfPagina = {
  getViewport: (o: { scale: number }) => { width: number; height: number };
  render: (o: { canvas: HTMLCanvasElement; viewport: unknown; background?: string }) => { promise: Promise<void>; cancel: () => void };
  cleanup: () => void;
};
type ArquivoPdf = { arquivo: File; doc: PdfDoc; paginas: number; larguraCm: number; alturaCm: number; /** Libera o PDF da memória. */ fechar: () => void };
type Parte = "capa" | "miolo";

const card: React.CSSProperties = { background: "white", borderRadius: "10px", padding: "22px" };
const h2: React.CSSProperties = { margin: "0 0 14px", fontSize: "16px", fontWeight: 700, color: "#002776" };
const rotulo: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" };
const campo: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "12px", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "14px" };
const grupo: React.CSSProperties = { fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#002776", borderBottom: "2px solid #FFDF00", paddingBottom: "6px", marginBottom: "14px" };
const botaoVerde: React.CSSProperties = { minHeight: "48px", padding: "0 26px", background: "#009B3A", color: "white", border: "none", borderRadius: "6px", fontSize: "15px", fontWeight: 700 };
const botaoBorda: React.CSSProperties = { minHeight: "48px", padding: "0 22px", background: "white", color: "#002776", border: "2px solid #002776", borderRadius: "6px", fontSize: "15px", fontWeight: 700 };

function chip(ativo: boolean): React.CSSProperties {
  return {
    minHeight: "44px",
    padding: "0 14px",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: 500,
    background: ativo ? "#009B3A" : "white",
    color: ativo ? "white" : "#262626",
    border: `1px solid ${ativo ? "#009B3A" : "#CFCFCF"}`,
  };
}

function Opcoes({ lista, valor, onChange, colunas }: { lista: readonly string[]; valor: string; onChange: (v: string) => void; colunas?: number }) {
  const estilo: React.CSSProperties = colunas
    ? { display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${colunas}px, 1fr))`, gap: "8px" }
    : { display: "flex", flexWrap: "wrap", gap: "8px" };
  return (
    <div style={estilo}>
      {lista.map((o) => (
        <button key={o} type="button" aria-pressed={valor === o} onClick={() => onChange(o)} style={chip(valor === o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

function pastaAleatoria(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function abrirPdf(arquivo: File): Promise<ArquivoPdf> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
  let doc: PdfDoc;
  const tarefa = pdfjs.getDocument({ data: new Uint8Array(await arquivo.arrayBuffer()), verbosity: 0 });
  const fechar = () => void tarefa.destroy().catch(() => undefined);
  try {
    doc = (await tarefa.promise) as unknown as PdfDoc;
  } catch (e) {
    fechar();
    if (e instanceof Error && e.name === "PasswordException") throw new Error("Este PDF tem senha. Remova a senha e escolha o arquivo de novo.");
    throw new Error("Não foi possível abrir este PDF. Confira se o arquivo não está corrompido.");
  }
  if (doc.numPages < 1) {
    fechar();
    throw new Error("O PDF não tem páginas.");
  }
  const primeira = await doc.getPage(1);
  const v = primeira.getViewport({ scale: 1 });
  primeira.cleanup();
  // O PDF mede em pontos (1/72 de polegada).
  const cm = (pt: number) => Math.round((pt / 72) * 2.54 * 10) / 10;
  return { arquivo, doc, paginas: doc.numPages, larguraCm: cm(v.width), alturaCm: cm(v.height), fechar };
}

/** Desenha uma página do PDF num canvas, na largura pedida. */
function PaginaPdf({ doc, numero, largura }: { doc: PdfDoc; numero: number; largura: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelado = false;
    let tarefa: { promise: Promise<void>; cancel: () => void } | null = null;
    (async () => {
      const pagina = await doc.getPage(numero);
      const canvas = ref.current;
      if (cancelado || !canvas) return;
      const base = pagina.getViewport({ scale: 1 });
      const densidade = Math.min(2, window.devicePixelRatio || 1);
      const viewport = pagina.getViewport({ scale: (largura / base.width) * densidade });
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      canvas.style.width = `${largura}px`;
      canvas.style.height = `${Math.round((largura / base.width) * base.height)}px`;
      tarefa = pagina.render({ canvas, viewport, background: "#ffffff" });
      await tarefa.promise.catch(() => undefined);
    })().catch(() => undefined);
    return () => {
      cancelado = true;
      tarefa?.cancel();
    };
  }, [doc, numero, largura]);

  return <canvas ref={ref} role="img" aria-label={`Página ${numero}`} style={{ display: "block", background: "white" }} />;
}

type ItemConferencia = { nome: string; texto: string; ok: boolean };

function conferir(e: EspecificacoesImpressao, capa: ArquivoPdf, miolo: ArquivoPdf): ItemConferencia[] {
  const itens: ItemConferencia[] = [];
  const medidas = medidasDoFormato(e.formato);

  itens.push(
    miolo.paginas === e.paginas
      ? { nome: "Número de páginas", texto: `O PDF do miolo tem ${miolo.paginas} páginas, como informado no pedido.`, ok: true }
      : { nome: "Número de páginas", texto: `O PDF do miolo tem ${miolo.paginas} páginas, mas o pedido informa ${e.paginas}. Corrija o número ou troque o arquivo.`, ok: false }
  );

  if (medidas) {
    const sobraL = miolo.larguraCm - medidas.largura;
    const sobraA = miolo.alturaCm - medidas.altura;
    const tamanho = `${String(miolo.larguraCm).replace(".", ",")} x ${String(miolo.alturaCm).replace(".", ",")} cm`;
    if (Math.abs(sobraL) <= 0.2 && Math.abs(sobraA) <= 0.2) {
      itens.push({ nome: "Formato das páginas", texto: `As páginas do miolo medem ${tamanho}, igual ao formato escolhido.`, ok: true });
    } else if (sobraL > 0 && sobraA > 0 && sobraL <= 1.5 && sobraA <= 1.5) {
      itens.push({ nome: "Formato das páginas", texto: `As páginas do miolo medem ${tamanho}: o formato escolhido com margem de sangria.`, ok: true });
    } else {
      itens.push({ nome: "Formato das páginas", texto: `As páginas do miolo medem ${tamanho}, diferente do formato escolhido (${e.formato}).`, ok: false });
    }

    itens.push(
      capa.larguraCm >= medidas.largura * 2
        ? { nome: "Capa aberta", texto: "A largura da capa comporta contracapa, lombada e capa.", ok: true }
        : { nome: "Capa aberta", texto: `A capa mede ${String(capa.larguraCm).replace(".", ",")} cm de largura. O esperado é um arquivo aberto, com contracapa, lombada e capa lado a lado.`, ok: false }
    );
  }

  itens.push(
    capa.paginas === 1
      ? { nome: "Arquivo da capa", texto: "O PDF da capa tem uma página.", ok: true }
      : { nome: "Arquivo da capa", texto: `O PDF da capa tem ${capa.paginas} páginas. O mais comum é uma página só; se a capa tiver impressão no verso (4x4), duas.`, ok: capa.paginas === 2 && e.capaCor.startsWith("4x4") }
  );

  return itens;
}

export default function ImprimirView({ authorId, pedidos, nomeInicial = "", emailInicial = "" }: { authorId: string; pedidos: PedidoImpressaoResumo[]; nomeInicial?: string; emailInicial?: string }) {
  const router = useRouter();
  const [orc, setOrc] = useState({ nome: nomeInicial, email: emailInicial, telefone: "", projeto: "" });
  const [orcErro, setOrcErro] = useState("");
  const [orcEnviando, setOrcEnviando] = useState(false);
  const [orcOk, setOrcOk] = useState(false);
  const [e, setE] = useState<EspecificacoesImpressao>(ESPECIFICACOES_PADRAO);
  const [capa, setCapa] = useState<ArquivoPdf | null>(null);
  const [miolo, setMiolo] = useState<ArquivoPdf | null>(null);
  const [lendo, setLendo] = useState<Parte | null>(null);
  const [etapa, setEtapa] = useState<"formulario" | "previa">("formulario");
  const [aba, setAba] = useState<Parte>("miolo");
  const [esquerda, setEsquerda] = useState(0);
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState<string | null>(null);
  const [enviado, setEnviado] = useState<string | null>(null);
  const [pasta, setPasta] = useState(pastaAleatoria);

  const mudar = <K extends keyof EspecificacoesImpressao>(chave: K, valor: EspecificacoesImpressao[K]) => {
    setE((atual) => ({ ...atual, [chave]: valor }));
    setErro("");
  };

  async function escolher(parte: Parte, arquivo: File | undefined) {
    if (!arquivo) return;
    setErro("");
    const limite = parte === "capa" ? IMPRESSAO_MAX_CAPA_BYTES : IMPRESSAO_MAX_MIOLO_BYTES;
    if (arquivo.size > limite) return setErro(`O arquivo ${parte === "capa" ? "da capa" : "do miolo"} tem mais de ${Math.round(limite / 1024 / 1024)} MB.`);
    setLendo(parte);
    try {
      const pdf = await abrirPdf(arquivo);
      if (parte === "capa") {
        capa?.fechar();
        setCapa(pdf);
      } else {
        miolo?.fechar();
        setMiolo(pdf);
        setEsquerda(0);
        // Preenche o número de páginas a partir do arquivo quando o autor ainda não informou.
        setE((atual) => (atual.paginas > 0 ? atual : { ...atual, paginas: pdf.paginas }));
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível ler o arquivo.");
    } finally {
      setLendo(null);
    }
  }

  function problema(): string | null {
    const erroDados = validarEspecificacoes(e);
    if (erroDados) return erroDados;
    if (!capa) return "Escolha o PDF da capa.";
    if (!miolo) return "Escolha o PDF do miolo.";
    return null;
  }

  function abrirPrevia() {
    const p = problema();
    if (p) return setErro(p);
    setErro("");
    setEtapa("previa");
    window.scrollTo({ top: 0 });
  }

  async function enviar() {
    const p = problema();
    if (p) return setErro(p);
    if (!aceite) return setErro("Marque a confirmação antes de enviar o pedido.");
    if (!capa || !miolo) return;
    setErro("");

    try {
      const subir = async (parte: Parte, pdf: ArquivoPdf) => {
        await upload(`${prefixoImpressao(authorId, pasta)}${parte}.pdf`, pdf.arquivo, {
          access: "private",
          handleUploadUrl: "/api/painel/impressao/upload",
          contentType: "application/pdf",
          multipart: pdf.arquivo.size > 8 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setEnviando(`Enviando ${parte === "capa" ? "a capa" : "o miolo"}: ${Math.round(percentage)}%`),
        });
      };
      setEnviando("Enviando a capa: 0%");
      await subir("capa", capa);
      setEnviando("Enviando o miolo: 0%");
      await subir("miolo", miolo);

      setEnviando("Registrando o pedido...");
      const r = await enviarPedidoImpressao(e, { pasta, capaNome: capa.arquivo.name, mioloNome: miolo.arquivo.name });
      if (r.error || !r.numero) {
        setErro(r.error ?? "Não foi possível enviar o pedido.");
        return;
      }

      capa.fechar();
      miolo.fechar();
      setEnviado(r.numero);
      setCapa(null);
      setMiolo(null);
      setE(ESPECIFICACOES_PADRAO);
      setAceite(false);
      setEtapa("formulario");
      setPasta(pastaAleatoria());
      window.scrollTo({ top: 0 });
      router.refresh();
    } catch (err) {
      console.error(err);
      setErro("Falha ao enviar os arquivos. Confira a conexão e tente de novo.");
    } finally {
      setEnviando(null);
    }
  }

  async function pedirOrcamento(ev: React.FormEvent) {
    ev.preventDefault();
    if (orcEnviando) return;
    setOrcErro("");
    setOrcEnviando(true);
    try {
      const r = await solicitarOrcamentoImpressao(orc, e);
      if (r.error) setOrcErro(r.error);
      else setOrcOk(true);
    } catch (err) {
      console.error(err);
      setOrcErro("Não foi possível enviar agora. Confira a conexão e tente de novo.");
    } finally {
      setOrcEnviando(false);
    }
  }

  const resumo: Array<[string, string]> = [
    ["Título", e.titulo.trim() || "A definir"],
    ["Formato", e.formato],
    ["Páginas", e.paginas > 0 ? String(e.paginas) : "A definir"],
    ["Tiragem", e.tiragem > 0 ? `${e.tiragem} exemplares` : "A definir"],
    ["ISBN", e.temIsbn ? "Sim" : "Não"],
    ["Miolo", `${e.mioloCor}, ${e.mioloPapel}`],
    ["Encadernação", e.encadernacao],
    ["Capa", `${e.capaPapel}, ${e.capaCor}`],
    ["Laminação", e.laminacao],
    ["Orelhas", e.orelhas ? "Sim" : "Não"],
  ];

  const blocoResumo = (
    <div style={card}>
      <h2 style={{ ...h2, fontSize: "15px", marginBottom: "12px" }}>Resumo do pedido</h2>
      <dl style={{ margin: 0, display: "grid", gridTemplateColumns: "auto 1fr", gap: "8px 12px", fontSize: "13px" }}>
        {resumo.map(([nome, valor]) => (
          <div key={nome} style={{ display: "contents" }}>
            <dt style={{ color: "#555" }}>{nome}</dt>
            <dd style={{ margin: 0, fontWeight: 500, textAlign: "right", overflowWrap: "anywhere" }}>{valor}</dd>
          </div>
        ))}
      </dl>
    </div>
  );

  const blocoErro = erro && (
    <div role="alert" style={{ background: "#FDEDEC", color: "#A93226", padding: "12px 16px", borderRadius: "8px", fontSize: "13px" }}>
      {erro}
    </div>
  );

  const confirmacao = (
    <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13px", lineHeight: 1.5 }}>
      <input type="checkbox" checked={aceite} onChange={(ev) => { setAceite(ev.target.checked); setErro(""); }} style={{ width: "18px", height: "18px", marginTop: "1px", accentColor: "#009B3A" }} />
      <span>Confirmo que conferi a capa e o miolo, que tenho os direitos sobre a obra e que quero enviar estes arquivos para orçamento e impressão.</span>
    </label>
  );

  // ── Pré-impressão ────────────────────────────────────────────────────────────────────────────
  if (etapa === "previa" && capa && miolo) {
    const itens = conferir(e, capa, miolo);
    const direita = esquerda + 1;
    const larguraPagina = 230;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <div>
            <button type="button" onClick={() => setEtapa("formulario")} style={{ background: "none", border: "none", padding: 0, color: "#002776", fontSize: "13px", fontWeight: 600, textDecoration: "underline" }}>
              ← Voltar para o pedido
            </button>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", margin: "6px 0 0" }}>Pré-impressão: {e.titulo.trim()}</h2>
          </div>
          <span style={{ background: "#FFF6CC", color: "#5c4800", fontSize: "13px", fontWeight: 700, padding: "8px 14px", borderRadius: "20px" }}>Ainda não enviado</span>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
            <section style={card}>
              <h2 style={h2}>1. Seus arquivos como serão enviados</h2>
              <div role="tablist" aria-label="Parte do livro" style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                {(["miolo", "capa"] as const).map((p) => (
                  <button key={p} type="button" role="tab" aria-selected={aba === p} onClick={() => setAba(p)} style={{ ...chip(aba === p), padding: "0 18px" }}>
                    {p === "miolo" ? "Miolo" : "Capa"}
                  </button>
                ))}
              </div>

              <div style={{ background: "#5E6470", borderRadius: "8px", padding: "24px 12px", display: "flex", justifyContent: "center", overflowX: "auto" }}>
                {aba === "miolo" ? (
                  <div style={{ display: "flex", boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}>
                    <div style={{ width: `${larguraPagina}px`, minHeight: "120px", background: esquerda >= 1 ? "white" : "transparent", borderRight: "1px solid #DDD" }}>
                      {esquerda >= 1 && <PaginaPdf doc={miolo.doc} numero={esquerda} largura={larguraPagina} />}
                    </div>
                    <div style={{ width: `${larguraPagina}px`, minHeight: "120px", background: direita <= miolo.paginas ? "white" : "transparent" }}>
                      {direita <= miolo.paginas && <PaginaPdf doc={miolo.doc} numero={direita} largura={larguraPagina} />}
                    </div>
                  </div>
                ) : (
                  <div style={{ boxShadow: "0 6px 20px rgba(0,0,0,0.35)" }}>
                    <PaginaPdf doc={capa.doc} numero={1} largura={460} />
                  </div>
                )}
              </div>

              {aba === "miolo" ? (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "14px", marginTop: "14px" }}>
                  <button type="button" onClick={() => setEsquerda((n) => Math.max(0, n - 2))} disabled={esquerda === 0} aria-label="Páginas anteriores" style={{ minWidth: "44px", minHeight: "44px", background: "white", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "16px", color: "#002776", opacity: esquerda === 0 ? 0.4 : 1 }}>
                    ←
                  </button>
                  <div style={{ fontSize: "14px", fontWeight: 500, minWidth: "190px", textAlign: "center" }}>
                    {esquerda >= 1 && direita <= miolo.paginas ? `Páginas ${esquerda} e ${direita}` : `Página ${esquerda >= 1 ? esquerda : direita}`} de {miolo.paginas}
                  </div>
                  <button type="button" onClick={() => setEsquerda((n) => (n + 2 <= miolo.paginas ? n + 2 : n))} disabled={esquerda + 2 > miolo.paginas} aria-label="Próximas páginas" style={{ minWidth: "44px", minHeight: "44px", background: "white", border: "1px solid #CFCFCF", borderRadius: "6px", fontSize: "16px", color: "#002776", opacity: esquerda + 2 > miolo.paginas ? 0.4 : 1 }}>
                    →
                  </button>
                </div>
              ) : (
                <p style={{ margin: "14px 0 0", fontSize: "13px", color: "#555", textAlign: "center" }}>Primeira página do arquivo da capa ({capa.arquivo.name}).</p>
              )}
            </section>

            <section style={card}>
              <h2 style={{ ...h2, marginBottom: "4px" }}>2. Verificação automática</h2>
              <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#555" }}>Checagem básica feita aqui no seu navegador. A conferência completa dos arquivos é feita pela gráfica.</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                {itens.map((i) => (
                  <li key={i.nome} style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "flex-start", border: "1px solid #E0E0E0", borderRadius: "6px", padding: "12px 14px" }}>
                    <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 700 }}>{i.nome}</div>
                      <div style={{ fontSize: "13px", color: "#555", lineHeight: 1.5, marginTop: "2px" }}>{i.texto}</div>
                    </div>
                    <span style={{ background: i.ok ? "#E3F4EA" : "#FFF6CC", color: i.ok ? "#0a6130" : "#5c4800", fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "12px", whiteSpace: "nowrap" }}>
                      {i.ok ? "Tudo certo" : "Precisa da sua atenção"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section style={{ ...card, display: "flex", flexDirection: "column", gap: "14px" }}>
              <h2 style={{ ...h2, margin: 0 }}>3. Enviar o pedido</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#555", lineHeight: 1.6 }}>
                Ao enviar, nossa equipe recebe as especificações e os arquivos, e responde por e-mail com o orçamento e os próximos passos. Nada é cobrado agora.
              </p>
              {confirmacao}
              {blocoErro}
              {enviando && <div role="status" style={{ fontSize: "13px", color: "#002776", fontWeight: 600 }}>{enviando}</div>}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                <button type="button" onClick={enviar} disabled={!!enviando} style={{ ...botaoVerde, opacity: enviando ? 0.6 : 1 }}>
                  {enviando ? "Enviando..." : "Enviar pedido"}
                </button>
                <button type="button" onClick={() => setEtapa("formulario")} disabled={!!enviando} style={botaoBorda}>
                  Voltar e trocar os arquivos
                </button>
              </div>
            </section>
          </div>

          <aside style={{ flex: "1 1 280px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
            {blocoResumo}
            <div style={card}>
              <h2 style={{ ...h2, fontSize: "15px", marginBottom: "10px" }}>Antes de enviar, confira</h2>
              <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: 1.7, color: "#444" }}>
                <li>Título, nome do autor e ISBN na capa</li>
                <li>Texto da lombada centralizado</li>
                <li>Numeração e ordem das páginas</li>
                <li>Imagens nítidas e sem cortes</li>
                <li>Margens e quebras de capítulo</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  // ── Formulário do pedido ─────────────────────────────────────────────────────────────────────
  const caixaArquivo = (parte: Parte, pdf: ArquivoPdf | null, titulo: string, dica: string) => (
    <div style={{ border: "2px dashed #CFCFCF", borderRadius: "8px", padding: "18px", textAlign: "center", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
      <div style={{ fontWeight: 700, color: "#002776" }}>{titulo}</div>
      <div style={{ fontSize: "13px", color: "#555" }}>{dica}</div>
      {pdf && (
        <div style={{ fontSize: "13px", color: "#0a6130", fontWeight: 600, overflowWrap: "anywhere" }}>
          {pdf.arquivo.name} ({tamanhoLegivel(pdf.arquivo.size)}, {pdf.paginas} {pdf.paginas === 1 ? "página" : "páginas"})
        </div>
      )}
      <label style={{ ...chip(false), display: "inline-flex", alignItems: "center", cursor: "pointer", color: "#002776", borderColor: "#002776", fontWeight: 700 }}>
        {lendo === parte ? "Lendo o arquivo..." : pdf ? "Trocar arquivo" : "Escolher arquivo"}
        <input
          type="file"
          accept="application/pdf,.pdf"
          disabled={lendo !== null}
          onChange={(ev) => {
            void escolher(parte, ev.target.files?.[0]);
            ev.target.value = "";
          }}
          style={{ position: "absolute", width: "1px", height: "1px", opacity: 0, overflow: "hidden" }}
        />
      </label>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Imprimir meu livro</h2>
        <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.6 }}>Configure o livro, envie a capa e o miolo e peça a impressão sem sair da plataforma.</p>
      </div>

      {enviado && (
        <div role="status" style={{ background: "#E3F4EA", color: "#0a6130", padding: "14px 18px", borderRadius: "8px", fontSize: "14px", lineHeight: 1.6 }}>
          <strong>Pedido {enviado} enviado.</strong> Nossa equipe vai conferir as informações e responder por e-mail com o orçamento e os próximos passos.
        </div>
      )}

      <div style={{ background: "#002776", color: "white", borderRadius: "12px", padding: "22px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "18px" }}>
        {[
          ["1", "Configure o livro", "Formato, papel, encadernação e tiragem."],
          ["2", "Envie capa e miolo", "Folheie a pré-impressão antes de enviar."],
          ["3", "Receba o orçamento", "Nossa equipe responde por e-mail."],
        ].map(([n, titulo, texto]) => (
          <div key={n} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
            <div style={{ flex: "0 0 34px", height: "34px", borderRadius: "50%", background: "#FFDF00", color: "#002776", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{n}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px" }}>{titulo}</div>
              <div style={{ fontSize: "13px", lineHeight: 1.5, opacity: 0.9 }}>{texto}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", alignItems: "flex-start" }}>
        <div style={{ flex: "999 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          <section style={card}>
            <h2 style={h2}>1. Título do livro</h2>
            <label htmlFor="imp-titulo" style={rotulo}>Título</label>
            <input id="imp-titulo" type="text" maxLength={200} value={e.titulo} onChange={(ev) => mudar("titulo", ev.target.value)} placeholder="Digite o título do seu livro" style={campo} />
          </section>

          <section style={card}>
            <h2 style={{ ...h2, marginBottom: "4px" }}>2. Formato</h2>
            <p style={{ margin: "0 0 14px", fontSize: "13px", color: "#555" }}>Largura x altura do livro fechado, em centímetros.</p>
            <Opcoes lista={FORMATOS} valor={e.formato} onChange={(v) => mudar("formato", v)} colunas={104} />
          </section>

          <section style={{ ...card, display: "flex", flexDirection: "column", gap: "22px" }}>
            <h2 style={{ ...h2, margin: 0 }}>3. Especificações</h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px" }}>
              <div>
                <label htmlFor="imp-paginas" style={rotulo}>Número de páginas</label>
                <input id="imp-paginas" type="number" min={1} inputMode="numeric" value={e.paginas || ""} onChange={(ev) => mudar("paginas", Math.max(0, Math.floor(Number(ev.target.value) || 0)))} placeholder="Ex.: 180" style={campo} />
              </div>
              <div>
                <label htmlFor="imp-tiragem" style={rotulo}>Tiragem (exemplares)</label>
                <input id="imp-tiragem" type="number" min={1} inputMode="numeric" value={e.tiragem || ""} onChange={(ev) => mudar("tiragem", Math.max(0, Math.floor(Number(ev.target.value) || 0)))} placeholder="Ex.: 100" style={campo} />
              </div>
              <div>
                <div style={rotulo}>O livro tem ISBN?</div>
                <Opcoes lista={["Sim", "Não"]} valor={e.temIsbn ? "Sim" : "Não"} onChange={(v) => mudar("temIsbn", v === "Sim")} />
              </div>
            </div>

            <div>
              <div style={grupo}>Miolo</div>
              <div style={{ ...rotulo, marginBottom: "8px" }}>Cor da impressão</div>
              <div style={{ marginBottom: "16px" }}>
                <Opcoes lista={MIOLO_CORES} valor={e.mioloCor} onChange={(v) => mudar("mioloCor", v)} />
              </div>
              <div style={{ ...rotulo, marginBottom: "8px" }}>Papel e gramatura</div>
              <Opcoes lista={MIOLO_PAPEIS} valor={e.mioloPapel} onChange={(v) => mudar("mioloPapel", v)} colunas={150} />
            </div>

            <div>
              <div style={grupo}>Encadernação</div>
              <Opcoes lista={ENCADERNACOES} valor={e.encadernacao} onChange={(v) => mudar("encadernacao", v)} colunas={210} />
            </div>

            <div>
              <div style={grupo}>Capa</div>
              <div style={{ ...rotulo, marginBottom: "8px" }}>Papel</div>
              <div style={{ marginBottom: "16px" }}>
                <Opcoes lista={CAPA_PAPEIS} valor={e.capaPapel} onChange={(v) => mudar("capaPapel", v)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "16px" }}>
                <div>
                  <div style={{ ...rotulo, marginBottom: "8px" }}>Impressão</div>
                  <Opcoes lista={CAPA_CORES} valor={e.capaCor} onChange={(v) => mudar("capaCor", v)} />
                </div>
                <div>
                  <div style={{ ...rotulo, marginBottom: "8px" }}>Laminação</div>
                  <Opcoes lista={LAMINACOES} valor={e.laminacao} onChange={(v) => mudar("laminacao", v)} />
                </div>
                <div>
                  <div style={{ ...rotulo, marginBottom: "8px" }}>Orelhas</div>
                  <Opcoes lista={["Não", "Sim"]} valor={e.orelhas ? "Sim" : "Não"} onChange={(v) => mudar("orelhas", v === "Sim")} />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="imp-obs" style={rotulo}>Observações (opcional)</label>
              <textarea id="imp-obs" rows={3} maxLength={2000} value={e.observacoes} onChange={(ev) => mudar("observacoes", ev.target.value)} placeholder="Algo que a gráfica precise saber sobre o seu livro." style={{ ...campo, resize: "vertical", fontFamily: "inherit" }} />
            </div>
          </section>

          <section style={{ ...card, display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <h2 style={{ ...h2, marginBottom: "4px" }}>4. Envie seus arquivos</h2>
              <p style={{ margin: 0, fontSize: "13px", color: "#555" }}>Capa e miolo em PDF, fechados para impressão. Capa até 100 MB e miolo até 200 MB.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
              {caixaArquivo("capa", capa, "Capa", "PDF com contracapa, lombada e capa")}
              {caixaArquivo("miolo", miolo, "Miolo", "PDF com todas as páginas internas")}
            </div>
            {confirmacao}
            {blocoErro}
            {enviando && <div role="status" style={{ fontSize: "13px", color: "#002776", fontWeight: 600 }}>{enviando}</div>}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              <button type="button" onClick={abrirPrevia} disabled={!!enviando} style={botaoBorda}>
                Visualizar pré-impressão
              </button>
              <button type="button" onClick={enviar} disabled={!!enviando} style={{ ...botaoVerde, opacity: enviando ? 0.6 : 1 }}>
                {enviando ? "Enviando..." : "Enviar pedido"}
              </button>
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: "#555" }}>Na pré-impressão você folheia a capa e o miolo e também pode enviar o pedido de lá. Nada é cobrado agora: o orçamento chega por e-mail.</p>
          </section>
        </div>

        <aside style={{ flex: "1 1 280px", minWidth: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
          {blocoResumo}
          <div style={card}>
            <h2 style={{ ...h2, fontSize: "15px", marginBottom: "10px" }}>Depois do envio</h2>
            <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", lineHeight: 1.7, color: "#444" }}>
              <li>Nossa equipe confere o pedido e os arquivos.</li>
              <li>Você recebe o orçamento por e-mail.</li>
              <li>Com a sua aprovação, o livro segue para a gráfica.</li>
            </ol>
          </div>
        </aside>
      </div>

      {pedidos.length > 0 && (
        <section style={card}>
          <h2 style={h2}>Meus pedidos de impressão</h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", minWidth: "520px" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#555" }}>
                  <th style={{ padding: "8px 10px", borderBottom: "1px solid #E0E0E0" }}>Pedido</th>
                  <th style={{ padding: "8px 10px", borderBottom: "1px solid #E0E0E0" }}>Título</th>
                  <th style={{ padding: "8px 10px", borderBottom: "1px solid #E0E0E0" }}>Tiragem</th>
                  <th style={{ padding: "8px 10px", borderBottom: "1px solid #E0E0E0" }}>Enviado em</th>
                  <th style={{ padding: "8px 10px", borderBottom: "1px solid #E0E0E0" }}>Situação</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id}>
                    <td style={{ padding: "10px", borderBottom: "1px solid #F0F0F0", fontWeight: 700, color: "#002776", whiteSpace: "nowrap" }}>{numeroDoPedidoImpressao(p.numero)}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #F0F0F0" }}>{p.titulo}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #F0F0F0", whiteSpace: "nowrap" }}>{p.tiragem} un.</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #F0F0F0", whiteSpace: "nowrap" }}>{p.enviadoEm}</td>
                    <td style={{ padding: "10px", borderBottom: "1px solid #F0F0F0" }}>
                      <span style={{ background: p.status === "cancelado" ? "#FDEDEC" : "#EAF0FB", color: p.status === "cancelado" ? "#A93226" : "#002776", fontSize: "12px", fontWeight: 700, padding: "4px 10px", borderRadius: "12px", whiteSpace: "nowrap" }}>
                        {STATUS_IMPRESSAO[p.status] ?? p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section style={card}>
        <h2 style={{ ...h2, marginBottom: "4px" }}>Receber esse orçamento em meu e-mail</h2>
        <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#555" }}>
          Enviamos a configuração que você montou acima para a nossa equipe, que responde com o orçamento por e-mail. Não precisa enviar os arquivos agora.
        </p>
        {orcOk ? (
          <div role="status" style={{ background: "#E8F5EC", color: "#0B5D2A", padding: "14px 16px", borderRadius: "8px", fontSize: "14px", lineHeight: 1.6 }}>
            <strong>Pedido de orçamento enviado.</strong> Você receberá a resposta no e-mail informado.
          </div>
        ) : (
          <form onSubmit={pedirOrcamento} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "14px" }}>
              <div>
                <label htmlFor="orc-nome" style={rotulo}>Nome</label>
                <input id="orc-nome" type="text" autoComplete="name" required maxLength={120} value={orc.nome} onChange={(ev) => { setOrc({ ...orc, nome: ev.target.value }); setOrcErro(""); }} style={campo} />
              </div>
              <div>
                <label htmlFor="orc-email" style={rotulo}>E-mail</label>
                <input id="orc-email" type="email" autoComplete="email" required maxLength={200} value={orc.email} onChange={(ev) => { setOrc({ ...orc, email: ev.target.value }); setOrcErro(""); }} style={campo} />
              </div>
              <div>
                <label htmlFor="orc-telefone" style={rotulo}>Telefone</label>
                <input id="orc-telefone" type="tel" autoComplete="tel" inputMode="tel" required maxLength={30} value={orc.telefone} onChange={(ev) => { setOrc({ ...orc, telefone: ev.target.value }); setOrcErro(""); }} placeholder="(00) 00000-0000" style={campo} />
              </div>
              <div>
                <label htmlFor="orc-projeto" style={rotulo}>Nome do projeto</label>
                <input id="orc-projeto" type="text" required maxLength={200} value={orc.projeto} onChange={(ev) => { setOrc({ ...orc, projeto: ev.target.value }); setOrcErro(""); }} style={campo} />
              </div>
            </div>
            {orcErro && (
              <div role="alert" style={{ background: "#FDEDEC", color: "#A93226", padding: "12px 16px", borderRadius: "8px", fontSize: "13px" }}>{orcErro}</div>
            )}
            <div>
              <button type="submit" disabled={orcEnviando} style={{ ...botaoVerde, opacity: orcEnviando ? 0.6 : 1 }}>
                {orcEnviando ? "Enviando..." : "Receber orçamento"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
