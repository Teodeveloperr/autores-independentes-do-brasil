import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { prisma } from "@/lib/db";
import { extrairYoutubeId } from "@/lib/youtube";
import TalkShowDescricao from "@/components/TalkShowDescricao";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Talk Show / Conteúdos" };

export default async function TalkShowPage() {
  const videos = await prisma.talkShowVideo.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="talkshow" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "48px 40px" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "16px" }}>🎙️</div>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>Talk Show / Conteúdos</h1>
          <p style={{ fontSize: "16px" }}>Entrevistas, bate-papos e outros conteúdos com autores do coletivo.</p>
        </div>
      </section>
      <section className="section-pad-lg" style={{ flex: 1, padding: "48px 40px", background: "#F6F6F6" }}>
        {videos.length === 0 ? (
          <div style={{ maxWidth: "640px", margin: "0 auto", textAlign: "center", color: "#666", fontSize: "15px" }}>
            Em breve, entrevistas, bate-papos e outros conteúdos com autores do coletivo vão aparecer por aqui.
          </div>
        ) : (
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "32px", maxWidth: "1100px", margin: "0 auto" }}>
            {videos.map((v) => {
              const id = extrairYoutubeId(v.youtubeUrl);
              return (
                <div key={v.id} style={{ background: "white", borderRadius: "10px", overflow: "hidden", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                  {id && (
                    <div style={{ position: "relative", paddingTop: "56.25%" }}>
                      <iframe
                        src={`https://www.youtube.com/embed/${id}`}
                        title={v.titulo}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                      />
                    </div>
                  )}
                  <div style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", color: "#002776", marginBottom: "6px" }}>{v.titulo}</div>
                    {v.descricao && <TalkShowDescricao texto={v.descricao} />}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <PublicFooter />
    </div>
  );
}
