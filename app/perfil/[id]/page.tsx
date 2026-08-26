import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import PerfilTabs from "@/components/PerfilTabs";
import EnviarMensagemButton from "@/components/EnviarMensagemButton";
import InstagramIcon from "@/components/InstagramIcon";
import CompartilharPerfilButton from "@/components/CompartilharPerfilButton";
import { prisma } from "@/lib/db";
import { brl } from "@/lib/format";
import { getCurrentAuthor } from "@/lib/auth";
import { temSeloVerificado } from "@/lib/plans";
import { calcularPerfilCompleto } from "@/lib/perfilCompleto";
import { calcularConquistas } from "@/lib/conquistas";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const author = await prisma.author.findUnique({ where: { id } });
  return { title: author ? author.nome : "Perfil não encontrado" };
}

export default async function PerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [author, currentAuthor, visualizacoesAgg] = await Promise.all([
    prisma.author.findUnique({
      where: { id },
      include: {
        books: { orderBy: { createdAt: "desc" } },
        eventos: { orderBy: { createdAt: "desc" } },
        fotos: { orderBy: { createdAt: "desc" } },
        avaliacoes: { orderBy: { createdAt: "desc" } },
      },
    }),
    getCurrentAuthor(),
    prisma.author.aggregate({ where: { status: "ativo" }, _max: { visualizacoes: true } }),
  ]);

  if (!author || author.status === "suspenso") notFound();

  const isOwner = currentAuthor?.id === author.id;

  if (!isOwner) {
    await prisma.author.update({ where: { id: author.id }, data: { visualizacoes: { increment: 1 } } });
  }

  const { percentual: percentualPerfil } = calcularPerfilCompleto(author, author.books.length);
  const conquistasConquistadas = calcularConquistas(author, {
    percentualPerfil,
    numLivros: author.books.length,
    numEventos: author.eventos.length,
    maxVisualizacoesGlobal: visualizacoesAgg._max.visualizacoes ?? 0,
  }).filter((c) => c.conquistada);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="autores" />
      <section className="section-pad-lg" style={{ background: "white", padding: "40px", flex: 1 }}>
        <div
          style={{
            height: "260px",
            borderRadius: "16px",
            marginBottom: "32px",
            position: "relative",
            maxWidth: "1280px",
            marginLeft: "auto",
            marginRight: "auto",
            backgroundColor: "#E0E0E0",
            backgroundImage: author.bannerUrl ? `url(${author.bannerUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: `${author.bannerPositionX}% ${author.bannerPositionY}%`,
            backgroundRepeat: "no-repeat",
          }}
        >
          {(author.verificado || temSeloVerificado(author.plano)) && (
            <div style={{ position: "absolute", top: "16px", left: "16px", background: "white", padding: "8px 16px", borderRadius: "4px", fontSize: "14px", fontWeight: 600 }}>
              ✓ Autor verificado
            </div>
          )}
        </div>
        <div className="responsive-flex-row" style={{ display: "flex", gap: "32px", marginBottom: "40px", maxWidth: "1280px", marginLeft: "auto", marginRight: "auto" }}>
          <div className="flex-fixed-basis" style={{ flex: "0 0 200px" }}>
            <div
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "8px",
                marginBottom: "16px",
                background: author.fotoUrl ? `center / cover no-repeat url(${author.fotoUrl})` : "#E0E0E0",
              }}
            />
            <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#262626", marginBottom: "8px" }}>{author.nome}</h1>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "4px" }}>
              Escritor{author.profissoes ? ` | ${author.profissoes}` : ""} • {author.generos.join(", ")} • {author.cidade}
            </p>
            {author.fraseApresentacao && (
              <p style={{ fontSize: "14px", color: "#002776", fontStyle: "italic", marginTop: "8px" }}>&quot;{author.fraseApresentacao}&quot;</p>
            )}
            {conquistasConquistadas.length > 0 && (
              <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
                {conquistasConquistadas.map((c) => (
                  <span key={c.label} title={c.label} style={{ fontSize: "20px" }}>
                    {c.emoji}
                  </span>
                ))}
              </div>
            )}
            {(author.instagramUrl || author.twitterUrl || author.siteUrl) && (
              <div style={{ display: "flex", gap: "12px", marginBottom: "16px", marginTop: "12px" }}>
                {author.instagramUrl && (
                  <a href={author.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", background: "#F6F6F6", borderRadius: "4px" }}>
                    <InstagramIcon />
                  </a>
                )}
                {author.twitterUrl && (
                  <a href={author.twitterUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", background: "#F6F6F6", borderRadius: "4px" }}>🐦</a>
                )}
                {author.siteUrl && (
                  <a href={author.siteUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", background: "#F6F6F6", borderRadius: "4px" }}>🌐</a>
                )}
              </div>
            )}
            <CompartilharPerfilButton nome={author.nome} />
            {!isOwner && <EnviarMensagemButton authorId={author.id} />}
          </div>
          <div style={{ flex: 1 }}>
            <div className="responsive-flex-row" style={{ display: "flex", gap: "24px", alignItems: "stretch", marginBottom: "40px" }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: "14px", color: "#444", lineHeight: 1.7, maxWidth: "640px", marginBottom: "20px" }}>{author.bio}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "18px" }}>
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#009B3A" }}>{author.avaliacaoMedia?.toFixed(1) ?? "—"}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>({author.avaliacoesQtd} avaliações)</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#002776" }}>{author.books.length}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>Livros</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#002776" }}>Desde {author.anoEntrada}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>no coletivo</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "24px", fontWeight: 700, color: "#002776" }}>{author.seguidores}</div>
                    <div style={{ fontSize: "12px", color: "#666" }}>seguidores</div>
                  </div>
                </div>
              </div>
              {author.videoUrl ? (
                <video controls playsInline src={author.videoUrl} style={{ width: "720px", height: "100%", minHeight: "200px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }} />
              ) : isOwner ? (
                <div style={{ width: "720px", flexShrink: 0, minHeight: "200px", display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "center", background: "#F6F6F6", borderRadius: "8px", padding: "16px 12px" }}>
                  <div style={{ fontSize: "22px", marginBottom: "6px" }}>🎥</div>
                  <p style={{ fontSize: "11px", color: "#666", lineHeight: 1.4 }}>Adicione um vídeo de até 30s se apresentando, em Meu Perfil.</p>
                </div>
              ) : null}
            </div>
            <PerfilTabs
              authorId={author.id}
              books={author.books.map((b) => ({
                id: b.id,
                titulo: b.titulo,
                genero: b.genero,
                capaUrl: b.capaUrl,
                preco: brl(b.precoCentavos),
                precoCentavos: b.precoCentavos,
                descricao: b.descricao,
                authorId: author.id,
                autorNome: author.nome,
              }))}
              fotos={author.fotos.map((f) => ({ id: f.id, url: f.url, titulo: f.titulo, categoria: f.categoria }))}
              eventos={author.eventos.map((e) => ({ id: e.id, nome: e.nome, diaInicio: e.diaInicio, diaFim: e.diaFim, mes: e.mes, ano: e.ano, local: e.local, status: e.status }))}
              avaliacoes={author.avaliacoes.map((r) => ({ id: r.id, nome: r.nome, texto: r.texto, estrelas: r.estrelas }))}
              autorPlano={author.plano}
              isOwner={isOwner}
            />
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
