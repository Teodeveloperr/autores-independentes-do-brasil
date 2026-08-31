"use client";

import { useMemo, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { updatePortfolio, addPortfolioEvento, removePortfolioEvento } from "@/app/painel/actions";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useMultiImageUpload } from "@/hooks/useMultiImageUpload";
import { precoComDescontoCentavos } from "@/lib/desconto";
import { PORTFOLIO_EVENTOS_MAX_INICIANTE } from "@/lib/plans";
import PortfolioDocument, { type PortfolioData } from "./PortfolioDocument";
import type { AuthorWithRelations } from "./types";

const PDFViewer = dynamic(() => import("@react-pdf/renderer").then((m) => m.PDFViewer), {
  ssr: false,
  loading: () => <p style={{ fontSize: "13px", color: "#666" }}>Carregando pré-visualização...</p>,
});
const PDFDownloadLink = dynamic(() => import("@react-pdf/renderer").then((m) => m.PDFDownloadLink), { ssr: false });

const inputStyle: React.CSSProperties = { width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" };

export default function PortfolioView({ author }: { author: AuthorWithRelations }) {
  const [formacao, setFormacao] = useState(author.portfolioFormacao ?? "");
  const [premios, setPremios] = useState(author.portfolioPremios ?? "");
  const [citacao, setCitacao] = useState(author.portfolioCitacao ?? "");
  const [obraDestaqueId, setObraDestaqueId] = useState(author.portfolioObraDestaqueId ?? "");
  const capa = useImageUpload("portfolio", author.portfolioCapaUrl ?? "");
  const [showPreview, setShowPreview] = useState(false);
  const [salvando, startSalvar] = useTransition();
  const [salvo, setSalvo] = useState(false);
  const router = useRouter();

  const [tituloEvento, setTituloEvento] = useState("");
  const [descricaoEvento, setDescricaoEvento] = useState("");
  const fotosEvento = useMultiImageUpload("portfolio-eventos", 6);
  const [erroEvento, setErroEvento] = useState("");
  const [salvandoEvento, startSalvarEvento] = useTransition();
  const [pendingEventos, startPendingEventos] = useTransition();

  const ehIniciante = author.plano === "Iniciante";
  const atingiuLimiteEventos = ehIniciante && author.portfolioEventos.length >= PORTFOLIO_EVENTOS_MAX_INICIANTE;

  function onAdicionarEvento() {
    setErroEvento("");
    const fd = new FormData();
    fd.set("titulo", tituloEvento);
    fd.set("descricao", descricaoEvento);
    fotosEvento.urls.forEach((url) => fd.append("fotos", url));
    startSalvarEvento(async () => {
      try {
        await addPortfolioEvento(fd);
        setTituloEvento("");
        setDescricaoEvento("");
        fotosEvento.reset();
        router.refresh();
      } catch (err) {
        setErroEvento(err instanceof Error ? err.message : "Não foi possível adicionar o evento.");
      }
    });
  }

  function onRemoverEvento(id: string) {
    startPendingEventos(async () => {
      await removePortfolioEvento(id);
      router.refresh();
    });
  }

  function onSalvar() {
    setSalvo(false);
    const fd = new FormData();
    fd.set("portfolioFormacao", formacao);
    fd.set("portfolioPremios", premios);
    fd.set("portfolioCitacao", citacao);
    fd.set("portfolioObraDestaqueId", obraDestaqueId);
    fd.set("portfolioCapaUrl", capa.url);
    startSalvar(async () => {
      await updatePortfolio(fd);
      setSalvo(true);
      router.refresh();
    });
  }

  const data: PortfolioData = useMemo(() => {
    const obra = author.books.find((b) => b.id === obraDestaqueId) ?? null;
    return {
      nome: author.nome,
      cidade: author.cidade,
      bio: author.bio,
      fotoUrl: author.fotoUrl,
      capaUrl: capa.url || null,
      email: author.email,
      instagramUrl: author.instagramUrl,
      twitterUrl: author.twitterUrl,
      siteUrl: author.siteUrl,
      formacao,
      premios,
      citacao,
      obraDestaque: obra
        ? { titulo: obra.titulo, capaUrl: obra.capaUrl, descricao: obra.descricao, genero: obra.genero }
        : null,
      livros: author.books.map((b) => ({ titulo: b.titulo, capaUrl: b.capaUrl, genero: b.genero, precoCentavos: precoComDescontoCentavos(b.precoCentavos, b.descontoPercentual) })),
      avaliacoes: author.avaliacoes.slice(0, 10).map((a) => ({ nome: a.nome, texto: a.texto, estrelas: a.estrelas })),
      fotos: author.fotos.map((f) => ({ url: f.url, titulo: f.titulo })),
      eventos: author.portfolioEventos.map((e) => ({ titulo: e.titulo, descricao: e.descricao, fotos: e.fotos })),
    };
  }, [author, formacao, premios, citacao, obraDestaqueId, capa.url]);

  const nomeArquivo = `portfolio-${author.nome.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`;

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Portfólio</h2>
      <p style={{ fontSize: "13px", color: "#666", marginBottom: "20px", maxWidth: "640px" }}>
        Gere um portfólio em PDF pronto pra enviar por e-mail ou imprimir. Ele já usa automaticamente seus dados de perfil (bio, foto, livros e redes sociais) — preencha só o que for específico do portfólio abaixo.
      </p>

      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: showPreview ? "1fr 1fr" : "1fr", gap: "20px", alignItems: "start" }}>
        <div style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label style={labelStyle}>Imagem da capa</label>
            <label
              htmlFor="portfolioCapaInput"
              onDrop={capa.onDrop}
              onDragOver={capa.onDragOver}
              style={{
                border: "2px dashed #BBB",
                borderRadius: "8px",
                padding: "16px",
                textAlign: "center",
                fontSize: "13px",
                color: "#666",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                minHeight: "110px",
                justifyContent: "center",
                background: capa.url ? `center / cover no-repeat url(${capa.url})` : "transparent",
              }}
            >
              {!capa.url && <div>{capa.uploading ? "Enviando..." : "🖼️ Arraste uma imagem aqui ou clique para selecionar"}</div>}
            </label>
            <input id="portfolioCapaInput" type="file" accept="image/*" onChange={capa.onInputChange} style={{ display: "none" }} />
            {capa.error && <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "6px" }}>{capa.error}</p>}
            <p style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
              {capa.url ? "Se não enviar nenhuma, usamos sua foto de perfil." : "Opcional — se não enviar, usamos sua foto de perfil na capa."}
            </p>
            {capa.url && (
              <button
                type="button"
                onClick={() => capa.setUrl("")}
                style={{ marginTop: "6px", background: "none", border: "none", color: "#C0392B", fontSize: "12px", cursor: "pointer", padding: 0 }}
              >
                Remover imagem
              </button>
            )}
          </div>
          <div>
            <label style={labelStyle}>Formação acadêmica / profissional</label>
            <textarea
              value={formacao}
              onChange={(e) => setFormacao(e.target.value)}
              placeholder="Ex: Formada em Letras, com pós-graduação em..."
              style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Prêmios e conquistas</label>
            <textarea
              value={premios}
              onChange={(e) => setPremios(e.target.value)}
              placeholder="Ex: Vencedor(a) do Prêmio X em 2025..."
              style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
            />
          </div>
          <div>
            <label style={labelStyle}>Obra em destaque</label>
            <select value={obraDestaqueId} onChange={(e) => setObraDestaqueId(e.target.value)} style={inputStyle}>
              <option value="">Nenhuma</option>
              {author.books.map((b) => (
                <option key={b.id} value={b.id}>{b.titulo}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Citação de fechamento</label>
            <textarea
              value={citacao}
              onChange={(e) => setCitacao(e.target.value)}
              placeholder="Uma frase pessoal sobre sua trajetória como autor(a)..."
              style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
            />
          </div>

          {salvo && (
            <div style={{ color: "#009B3A", fontSize: "13px", background: "#E3F4E9", padding: "10px 14px", borderRadius: "6px" }}>
              ✅ Dados salvos.
            </div>
          )}

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              onClick={onSalvar}
              disabled={salvando}
              style={{ background: "white", border: "1px solid #002776", color: "#002776", padding: "12px 20px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: salvando ? 0.7 : 1 }}
            >
              {salvando ? "Salvando..." : "Salvar dados"}
            </button>
            <button
              onClick={() => setShowPreview(true)}
              style={{ flex: 1, background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px" }}
            >
              👁️ Pré-visualizar portfólio
            </button>
          </div>
        </div>

        {showPreview && (
          <div style={{ background: "white", borderRadius: "10px", padding: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", gap: "12px", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 700, color: "#002776" }}>Pré-visualização</div>
              <PDFDownloadLink
                document={<PortfolioDocument data={data} />}
                fileName={nomeArquivo}
                style={{ background: "#FFDF00", color: "#002776", padding: "10px 18px", fontWeight: 700, borderRadius: "6px", fontSize: "13px", textDecoration: "none" }}
              >
                {({ loading }: { loading: boolean }) => (loading ? "Gerando..." : "⬇️ Baixar PDF")}
              </PDFDownloadLink>
            </div>
            <PDFViewer style={{ width: "100%", height: "700px", border: "1px solid #E0E0E0", borderRadius: "6px" }} showToolbar>
              <PortfolioDocument data={data} />
            </PDFViewer>
            <p style={{ fontSize: "11px", color: "#999", marginTop: "10px" }}>
              Pra imprimir, baixe o PDF e imprima pelo seu leitor de PDF de preferência.
            </p>
          </div>
        )}
      </div>

      <div style={{ marginTop: "24px" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#002776", marginBottom: "8px" }}>Eventos e feiras literárias</h3>
        <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px", maxWidth: "640px" }}>
          Cada evento vira uma página no portfólio, com título, fotos e um texto sobre a experiência.
        </p>
        {ehIniciante && (
          <p style={{ fontSize: "13px", color: "#666", marginBottom: "16px" }}>
            O plano Iniciante permite até {PORTFOLIO_EVENTOS_MAX_INICIANTE} eventos no portfólio ({author.portfolioEventos.length}/{PORTFOLIO_EVENTOS_MAX_INICIANTE}).{" "}
            <a href="/assinatura" style={{ color: "#002776", fontWeight: 600 }}>Fazer upgrade →</a> pra adicionar mais.
          </p>
        )}
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "20px", alignItems: "start" }}>
          <div style={{ background: "white", borderRadius: "10px", padding: "24px", display: "flex", flexDirection: "column", gap: "14px", opacity: atingiuLimiteEventos ? 0.6 : 1 }}>
            <div style={{ fontWeight: 700, color: "#002776" }}>📅 Adicionar evento</div>
            <div>
              <label style={labelStyle}>Título</label>
              <input
                type="text"
                value={tituloEvento}
                onChange={(e) => setTituloEvento(e.target.value)}
                disabled={atingiuLimiteEventos}
                placeholder="Ex: Bienal do Livro de São Paulo - 2026"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Descrição (opcional)</label>
              <textarea
                value={descricaoEvento}
                onChange={(e) => setDescricaoEvento(e.target.value)}
                disabled={atingiuLimiteEventos}
                placeholder="Conte como foi participar desse evento..."
                style={{ ...inputStyle, minHeight: "70px", resize: "vertical" }}
              />
            </div>
            <div>
              <label style={labelStyle}>Fotos do evento ({fotosEvento.urls.length}/6)</label>
              <label
                htmlFor="fotosEventoInput"
                onDrop={atingiuLimiteEventos ? undefined : fotosEvento.onDrop}
                onDragOver={atingiuLimiteEventos ? undefined : fotosEvento.onDragOver}
                style={{
                  border: "2px dashed #BBB",
                  borderRadius: "8px",
                  padding: "16px",
                  textAlign: "center",
                  fontSize: "13px",
                  color: "#666",
                  cursor: atingiuLimiteEventos ? "not-allowed" : "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  minHeight: "80px",
                  justifyContent: "center",
                }}
              >
                {fotosEvento.uploading ? "Enviando..." : "📷 Arraste as fotos aqui ou clique para selecionar (até 6, 5MB cada)"}
              </label>
              <input
                id="fotosEventoInput"
                type="file"
                accept="image/*"
                multiple
                disabled={atingiuLimiteEventos}
                onChange={fotosEvento.onInputChange}
                style={{ display: "none" }}
              />
              {fotosEvento.urls.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                  {fotosEvento.urls.map((url) => (
                    <div key={url} style={{ position: "relative", width: "56px", height: "56px" }}>
                      <div style={{ width: "100%", height: "100%", borderRadius: "4px", background: `center / cover no-repeat url(${url})` }} />
                      <button
                        type="button"
                        onClick={() => fotosEvento.remove(url)}
                        title="Remover foto"
                        style={{ position: "absolute", top: "-6px", right: "-6px", background: "white", border: "1px solid #DDD", borderRadius: "50%", width: "20px", height: "20px", fontSize: "10px", color: "#C0392B", lineHeight: 1 }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {fotosEvento.error && <p style={{ fontSize: "12px", color: "#C0392B", marginTop: "6px" }}>{fotosEvento.error}</p>}
            </div>
            {erroEvento && <p style={{ fontSize: "12px", color: "#C0392B" }}>{erroEvento}</p>}
            <button
              type="button"
              onClick={onAdicionarEvento}
              disabled={salvandoEvento || atingiuLimiteEventos}
              style={{ background: "#009B3A", color: "white", padding: "12px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", border: "none", opacity: salvandoEvento || atingiuLimiteEventos ? 0.6 : 1 }}
            >
              {atingiuLimiteEventos ? "Limite atingido" : salvandoEvento ? "Adicionando..." : "Adicionar evento"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {author.portfolioEventos.map((ev) => (
              <div key={ev.id} style={{ background: "white", borderRadius: "10px", padding: "16px 20px", display: "flex", gap: "14px", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                  {ev.fotos.slice(0, 3).map((url) => (
                    <div key={url} style={{ width: "40px", height: "40px", borderRadius: "4px", background: `center / cover no-repeat url(${url})` }} />
                  ))}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "13px" }}>{ev.titulo}</div>
                  <div style={{ fontSize: "11px", color: "#666" }}>{ev.fotos.length} foto{ev.fotos.length === 1 ? "" : "s"}</div>
                </div>
                <button
                  onClick={() => onRemoverEvento(ev.id)}
                  disabled={pendingEventos}
                  title="Remover evento"
                  style={{ background: "white", border: "1px solid #DDD", borderRadius: "6px", width: "28px", height: "28px", fontSize: "12px", color: "#C0392B", flexShrink: 0 }}
                >
                  ✕
                </button>
              </div>
            ))}
            {author.portfolioEventos.length === 0 && (
              <div style={{ background: "white", borderRadius: "10px", padding: "32px", textAlign: "center", color: "#666", fontSize: "14px" }}>
                Você ainda não adicionou eventos ao portfólio.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
