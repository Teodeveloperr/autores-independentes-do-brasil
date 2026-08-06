import Image from "next/image";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import BlogCarousel from "@/components/BlogCarousel";
import ContactForm from "@/components/ContactForm";
import { prisma } from "@/lib/db";
import { initials, brl } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [authors, livros, artigos, eventos] = await Promise.all([
    prisma.author.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.book.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { author: true },
    }),
    prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.collectiveEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="home" showContato={false} />

      <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>

      <section className="responsive-grid section-pad-lg" style={{ background: "white", padding: "60px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "42px", fontWeight: 700, color: "#002776", lineHeight: 1.3, marginBottom: "24px" }}>
            Literatura
            <br />independente
            <br /><span style={{ color: "#009B3A" }}>conectando</span>
            <br /><span style={{ color: "#FFDF00" }}>autores e leitores</span>
          </h1>
          <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.6, marginBottom: "32px" }}>
            Somos um coletivo de escritores que acredita no poder das palavras para transformar o mundo.
          </p>
          <div style={{ display: "flex", gap: "16px" }}>
            <Link href="/livros" style={{ background: "#009B3A", color: "white", padding: "12px 32px", fontWeight: 600, borderRadius: "4px" }}>
              NOSSOS LIVROS
            </Link>
            <Link href="/coletivo" style={{ background: "white", border: "2px solid #009B3A", color: "#009B3A", padding: "10px 32px", fontWeight: 600, borderRadius: "4px" }}>
              O COLETIVO
            </Link>
          </div>
        </div>
        <div style={{ textAlign: "center" }}>
          <Image
            src="/hero-banner.webp"
            alt="Banner do coletivo Autores Independentes do Brasil: mais de 100 autores presentes, mais de 300 títulos no stand, sessão de autógrafos e lançamentos"
            width={2000}
            height={1000}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      </section>

      <section className="responsive-flex-row section-pad-md" style={{ background: "#002776", color: "white", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 40px", borderRadius: "8px", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontSize: "24px", flexShrink: 0 }}>📅</div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>Estaremos na Bienal do Livro de São Paulo!</div>
            <div style={{ fontSize: "14px" }}>de 4 a 13 de setembro • Distrito Anhembi • São Paulo</div>
          </div>
        </div>
        <Link href="/eventos" style={{ background: "#FFDF00", color: "#002776", padding: "12px 32px", fontWeight: 700, borderRadius: "4px" }}>
          SAIBA MAIS
        </Link>
      </section>

      <section className="responsive-grid section-pad-lg" style={{ background: "white", padding: "60px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center", marginTop: "40px" }}>
        <div>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776", marginBottom: "24px" }}>Sobre o coletivo</h2>
          <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.6 }}>
            O Coletivo Autores do Brasil é um ecossistema colaborativo voltado ao fortalecimento da literatura brasileira, reunindo mais de 800 autores, poetas, escritores independentes, ilustradores, revisores, diagramadores, editores, produtores culturais, livreiros, mediadores de leitura e demais profissionais da cadeia produtiva do livro em todo o país.
          </p>
          <Link href="/coletivo" style={{ display: "inline-block", background: "white", border: "2px solid #002776", color: "#002776", padding: "10px 24px", fontWeight: 600, marginTop: "24px", borderRadius: "4px" }}>
            CONHEÇA NOSSA HISTÓRIA
          </Link>
        </div>
        <div style={{ position: "relative", height: "300px", borderRadius: "8px", overflow: "hidden" }}>
          <Image
            src="/foto-coletivo-bienal.jpg"
            alt="Autores do coletivo reunidos no estande da Bienal do Livro"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>
      </section>

      <section className="section-pad-lg" style={{ background: "white", padding: "60px 40px", marginTop: "40px" }}>
        <div className="responsive-flex-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", gap: "12px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776" }}>Autores em destaque</h2>
          <Link href="/autores" style={{ fontWeight: 600, color: "#002776" }}>VER TODOS OS AUTORES →</Link>
        </div>
        {authors.length > 0 ? (
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "24px" }}>
            {authors.map((a) => (
              <div key={a.id} style={{ background: "#F6F6F6", padding: "24px", borderRadius: "8px", textAlign: "center" }}>
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    borderRadius: "50%",
                    margin: "0 auto 16px",
                    background: a.fotoUrl ? `center / cover no-repeat url(${a.fotoUrl})` : "#E0E0E0",
                    display: a.fotoUrl ? undefined : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    color: "#002776",
                  }}
                >
                  {!a.fotoUrl && initials(a.nome)}
                </div>
                <div style={{ fontWeight: 600, marginBottom: "8px", color: "#262626" }}>{a.nome}</div>
                <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px" }}>{a.generos.join(", ") || "—"}</div>
                <Link
                  href={`/perfil/${a.id}`}
                  style={{ display: "block", textAlign: "center", background: "#002776", color: "white", padding: "10px 20px", fontWeight: 600, width: "100%", borderRadius: "4px", textDecoration: "none" }}
                >
                  VER PERFIL
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>
              Ainda não há autores cadastrados no coletivo.
            </p>
            <Link href="/cadastro" style={{ display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
              Seja o primeiro a se cadastrar →
            </Link>
          </div>
        )}
      </section>

      <section className="section-pad-lg" style={{ background: "white", padding: "60px 40px", marginTop: "40px" }}>
        <div className="responsive-flex-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", gap: "12px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776" }}>Livros recentes</h2>
          <Link href="/livros" style={{ fontWeight: 600, color: "#002776" }}>VER TODOS OS LIVROS →</Link>
        </div>
        {livros.length > 0 ? (
          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "24px" }}>
            {livros.map((b) => (
              <Link key={b.id} href="/livros" style={{ display: "block", color: "inherit" }}>
                <div
                  style={{
                    background: b.capaUrl ? `center / cover no-repeat url(${b.capaUrl})` : "#E0E0E0",
                    aspectRatio: "3/4",
                    borderRadius: "4px",
                    marginBottom: "10px",
                  }}
                />
                <div style={{ fontWeight: 600, fontSize: "13px", marginBottom: "2px" }}>{b.titulo}</div>
                <div style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}>{b.author.nome}</div>
                <div style={{ color: "#009B3A", fontWeight: 700, fontSize: "13px" }}>{brl(b.precoCentavos)}</div>
              </Link>
            ))}
          </div>
        ) : (
          <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
            <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>
              Ainda não há livros publicados na plataforma.
            </p>
            <Link href="/cadastro" style={{ display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
              Seja o primeiro a publicar →
            </Link>
          </div>
        )}
      </section>

      <section className="section-pad-lg" style={{ background: "white", padding: "60px 40px", marginTop: "40px" }}>
        <div className="responsive-flex-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", gap: "12px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776" }}>Blog do Coletivo</h2>
          <Link href="/blog" style={{ fontWeight: 600, color: "#002776" }}>VER TODOS OS ARTIGOS →</Link>
        </div>
        <BlogCarousel artigos={artigos} />
        <Link
          href="/blog"
          style={{ display: "block", textAlign: "center", background: "#009B3A", color: "white", padding: "12px 32px", fontWeight: 700, marginTop: "32px", borderRadius: "4px", width: "100%" }}
        >
          VISITAR O BLOG
        </Link>
      </section>

      <section className="responsive-grid section-pad-lg" style={{ background: "white", padding: "60px 40px", marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" }}>
        <div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#002776", marginBottom: "32px" }}>Próximos eventos</h3>
          {eventos.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {eventos.map((ev) => (
                <div key={ev.id} style={{ borderLeft: "4px solid #002776", paddingLeft: "16px" }}>
                  <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{String(ev.dia).padStart(2, "0")}</div>
                  <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", marginBottom: "8px" }}>{ev.mes}</div>
                  <div style={{ fontWeight: 600, marginBottom: "4px" }}>{ev.nome}</div>
                  <div style={{ fontSize: "14px", color: "#666" }}>{ev.periodo ? `${ev.periodo} • ${ev.local}` : ev.local}</div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: "14px", color: "#666" }}>Nenhum evento cadastrado no momento.</p>
          )}
          <Link href="/eventos" style={{ display: "block", textAlign: "center", background: "#FFDF00", color: "#002776", padding: "12px 32px", fontWeight: 700, marginTop: "32px", borderRadius: "4px", width: "100%" }}>
            VER AGENDA COMPLETA
          </Link>
        </div>
        <div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#002776", marginBottom: "24px" }}>Depoimentos</h3>
          <div style={{ background: "#F6F6F6", padding: "24px", borderRadius: "8px" }}>
            <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
              <div style={{ width: "40px", height: "40px", background: "#E0E0E0", borderRadius: "50%" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "14px" }}>Monique Evelyn</div>
                <div style={{ fontSize: "12px", color: "#666" }}>Leitora</div>
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#262626", lineHeight: 1.6 }}>
              O coletivo é um espaço de troca, aprendizado e crescimento para todos os escritores que fazem parte disso.
            </p>
            <div style={{ display: "flex", gap: "4px", marginTop: "12px" }}>
              <span style={{ fontSize: "12px" }}>● ○ ○</span>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" className="responsive-grid section-pad-lg" style={{ background: "white", padding: "60px 40px", marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" }}>
        <div>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776", marginBottom: "24px" }}>Contato</h2>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#262626", marginBottom: "16px" }}>Fale conosco</h3>
          <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "32px" }}>
            Entre em contato para parcerias, convites e mais informações
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
            <div>📧 contato@autoresdobrasil.com.br</div>
            <div>📱 (85) 99956-6375</div>
            <div>📍 Fortaleza - CE</div>
          </div>
        </div>
        <div>
          <ContactForm />
        </div>
      </section>

      </div>

      <PublicFooter showAdminLink />
    </div>
  );
}
