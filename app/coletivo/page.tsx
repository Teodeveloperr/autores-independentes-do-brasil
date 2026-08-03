import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CounterStats from "@/components/CounterStats";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "O Coletivo" };

export default function ColetivoPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="coletivo" />
      <section className="section-pad-lg" style={{ background: "white", padding: "60px 40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "48px", fontWeight: 700, color: "#002776", marginBottom: "32px" }}>Nossa história</h1>
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center", marginBottom: "60px" }}>
          <div>
            <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8, marginBottom: "24px" }}>
              O Coletivo Autores do Brasil é um ecossistema colaborativo voltado ao fortalecimento da literatura brasileira, reunindo mais de 600 autores, poetas, escritores independentes, ilustradores, revisores, diagramadores, editores, produtores culturais, livreiros, mediadores de leitura e demais profissionais da cadeia produtiva do livro em todo o país.
            </p>
            <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8, marginBottom: "24px" }}>
              Mais do que um grupo literário, o Autores do Brasil funciona como uma ampla rede de conexão, formação, divulgação e oportunidades, promovendo o intercâmbio entre profissionais da literatura e aproximando escritores de leitores, instituições culturais, editoras, bibliotecas, escolas e eventos literários.
            </p>
            <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8 }}>
              O ecossistema é composto por diversos grupos temáticos e regionais, canais de comunicação, redes sociais, programas de entrevistas, transmissões ao vivo, divulgação de editais, premiações, concursos literários, feiras, bienais, festivais, chamadas públicas e oportunidades de participação em projetos culturais em todo o Brasil.
            </p>
          </div>
          <div style={{ background: "#E0E0E0", aspectRatio: "16/9", borderRadius: "8px" }} />
        </div>
        <div className="section-pad-md" style={{ background: "#002776", color: "white", padding: "60px", borderRadius: "8px", textAlign: "center" }}>
          <CounterStats
            stats={[
              { value: 50, suffix: "+", label: "AUTORES" },
              { value: 200, suffix: "+", label: "LIVROS PUBLICADOS" },
              { value: 30, label: "PARTICIPAÇÕES EM BIENAIS" },
            ]}
          />
        </div>
        <div className="responsive-grid" style={{ marginTop: "60px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          <div style={{ background: "#E0E0E0", aspectRatio: "1", borderRadius: "8px" }} />
          <div style={{ background: "#E0E0E0", aspectRatio: "1", borderRadius: "8px" }} />
          <div style={{ background: "#E0E0E0", aspectRatio: "1", borderRadius: "8px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#002776", display: "inline-block" }} />
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#DDD", display: "inline-block" }} />
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#DDD", display: "inline-block" }} />
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
