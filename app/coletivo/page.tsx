import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CounterStats from "@/components/CounterStats";
import ColetivoCarousel from "@/components/ColetivoCarousel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "O Coletivo" };

export default function ColetivoPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="coletivo" />
      <section className="section-pad-lg" style={{ background: "white", padding: "60px 40px", flex: 1 }}>
      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
        <h1 style={{ fontSize: "48px", fontWeight: 700, color: "#002776", marginBottom: "32px" }}>Nossa história</h1>
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "start", marginBottom: "60px" }}>
          <div>
            <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8, marginBottom: "24px" }}>
              O Coletivo Autores do Brasil é um ecossistema colaborativo voltado ao fortalecimento da literatura brasileira, reunindo mais de 800 autores, poetas, escritores independentes, ilustradores, revisores, diagramadores, editores, produtores culturais, livreiros, mediadores de leitura e demais profissionais da cadeia produtiva do livro em todo o país.
            </p>
            <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8, marginBottom: "24px" }}>
              Mais do que um grupo literário, o Autores do Brasil funciona como uma ampla rede de conexão, formação, divulgação e oportunidades, promovendo o intercâmbio entre profissionais da literatura e aproximando escritores de leitores, instituições culturais, editoras, bibliotecas, escolas e eventos literários.
            </p>
            <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8 }}>
              O ecossistema é composto por diversos grupos temáticos e regionais, canais de comunicação, redes sociais, programas de entrevistas, transmissões ao vivo, divulgação de editais, premiações, concursos literários, feiras, bienais, festivais, chamadas públicas e oportunidades de participação em projetos culturais em todo o Brasil.
            </p>
          </div>
          <div>
            <div style={{ background: "center / cover no-repeat url(/coletivo-banner.webp)", aspectRatio: "2/1", borderRadius: "8px", marginBottom: "24px" }} />
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
              {[
                {
                  icon: "🎯",
                  titulo: "Missão",
                  texto: "Conectar, fortalecer e promover autores e profissionais do livro, criando oportunidades de desenvolvimento, circulação literária e acesso ao mercado cultural.",
                },
                {
                  icon: "👁️",
                  titulo: "Visão",
                  texto: "Ser a maior rede colaborativa de autores e profissionais da literatura brasileira, reconhecida pela promoção da diversidade literária, da formação cultural e da democratização do acesso ao livro e à leitura.",
                },
                {
                  icon: "💎",
                  titulo: "Valores",
                  texto: "Cooperação, diversidade, inclusão, inovação, democratização cultural, valorização da literatura brasileira, compartilhamento de conhecimento, ética, compromisso social e incentivo permanente à formação de leitores e escritores.",
                },
              ].map((item) => (
                <div
                  key={item.titulo}
                  className="hover-lift"
                  style={{ background: "#F6F6F6", padding: "12px 10px", borderRadius: "8px" }}
                >
                  <div style={{ fontSize: "18px", marginBottom: "6px" }}>{item.icon}</div>
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>{item.titulo}</h3>
                  <p style={{ fontSize: "10.5px", color: "#262626", lineHeight: 1.4 }}>{item.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="section-pad-md" style={{ background: "#002776", color: "white", padding: "60px", borderRadius: "8px", textAlign: "center", marginBottom: "60px" }}>
          <CounterStats
            stats={[
              { value: 50, suffix: "+", label: "AUTORES" },
              { value: 200, suffix: "+", label: "LIVROS PUBLICADOS" },
              { value: 30, label: "PARTICIPAÇÕES EM BIENAIS" },
            ]}
          />
        </div>

        <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#002776", marginBottom: "24px" }}>
          Entre suas ações permanentes estão:
        </h3>
        <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "20px", marginBottom: "60px" }}>
          {[
            { icon: "📢", texto: "Divulgação de editais culturais e literários" },
            { icon: "📚", texto: "Compartilhamento de oportunidades de publicação e participação em antologias" },
            { icon: "🎤", texto: "Promoção de eventos literários presenciais e virtuais" },
            { icon: "🎪", texto: "Cobertura de feiras, bienais e festivais do livro" },
            { icon: "🎙️", texto: "Entrevistas com autores e profissionais do mercado editorial" },
            { icon: "🎓", texto: "Formação e capacitação para escritores iniciantes e experientes" },
            { icon: "📖", texto: "Incentivo à leitura e à produção literária" },
            { icon: "🤝", texto: "Fortalecimento do networking entre autores e agentes culturais" },
            { icon: "🚀", texto: "Divulgação de lançamentos de livros e trajetórias literárias" },
            { icon: "💰", texto: "Circulação de informações sobre leis de incentivo à cultura e mecanismos de financiamento cultural" },
          ].map((item) => (
            <div
              key={item.texto}
              className="hover-lift"
              style={{ display: "flex", gap: "16px", alignItems: "center", background: "#F6F6F6", padding: "20px 24px", borderRadius: "8px" }}
            >
              <div style={{ fontSize: "28px", flexShrink: 0 }}>{item.icon}</div>
              <p style={{ fontSize: "15px", color: "#262626", lineHeight: 1.5 }}>{item.texto}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8, marginBottom: "24px" }}>
          O coletivo também mantém presença ativa em redes sociais, canais digitais e plataformas de vídeo, ampliando o alcance das produções literárias brasileiras por meio de conteúdos informativos, programas de entrevistas, debates, mesas-redondas, podcasts e transmissões ao vivo com autores de diferentes regiões do país.
        </p>
        <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8 }}>
          Com uma atuação pautada pela colaboração e pelo compartilhamento de conhecimento, o Autores do Brasil busca reduzir as barreiras enfrentadas pelos escritores independentes, oferecendo visibilidade, acesso à informação, formação continuada e oportunidades concretas de crescimento profissional.
        </p>

        <div style={{ marginTop: "60px" }}>
          <ColetivoCarousel />
        </div>
      </div>
      </section>
      <PublicFooter />
    </div>
  );
}
