import Image from "next/image";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/format";

export default async function HomePage() {
  const authors = await prisma.author.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="home" showContato={false} />

      <section style={{ background: "white", padding: "60px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "42px", fontWeight: 700, color: "#002776", lineHeight: 1.3, marginBottom: "24px" }}>
            Literatura
            <br />independente
            <br />conectando
            <br />autores e leitores
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
            src="/hero-books.png"
            alt="Pilha de livros do coletivo Autores Independentes do Brasil com caneca e caderno"
            width={640}
            height={480}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
      </section>

      <section style={{ background: "#002776", color: "white", padding: "32px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", margin: "0 40px", borderRadius: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ fontSize: "24px", flexShrink: 0 }}>📅</div>
          <div>
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>Estaremos na Bienal do Livro de São Paulo!</div>
            <div style={{ fontSize: "14px" }}>de 6 a 15 de setembro • Espaço Central Norte • São Paulo</div>
          </div>
        </div>
        <Link href="/eventos" style={{ background: "#FFDF00", color: "#002776", padding: "12px 32px", fontWeight: 700, borderRadius: "4px" }}>
          SAIBA MAIS
        </Link>
      </section>

      <section style={{ background: "white", padding: "60px 40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center", marginTop: "40px" }}>
        <div>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776", marginBottom: "24px" }}>Sobre o coletivo</h2>
          <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.6 }}>
            Reunimos escritores de diferentes gêneros e estilos com um mesmo propósito: levar boas histórias a cada vez mais pessoas
          </p>
          <Link href="/coletivo" style={{ display: "inline-block", background: "white", border: "2px solid #002776", color: "#002776", padding: "10px 24px", fontWeight: 600, marginTop: "24px", borderRadius: "4px" }}>
            CONHEÇA NOSSA HISTÓRIA
          </Link>
        </div>
        <div style={{ background: "#E0E0E0", padding: "40px", borderRadius: "8px", textAlign: "center", height: "300px" }}>
          <div style={{ color: "#999" }}>Foto do coletivo</div>
        </div>
      </section>

      <section style={{ background: "white", padding: "60px 40px", marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776" }}>Autores em destaque</h2>
          <Link href="/autores" style={{ fontWeight: 600, color: "#002776" }}>VER TODOS OS AUTORES →</Link>
        </div>
        {authors.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "24px" }}>
            {authors.map((a) => (
              <Link
                key={a.id}
                href={`/perfil/${a.id}`}
                style={{ background: "#F6F6F6", padding: "24px", borderRadius: "8px", textAlign: "center", textDecoration: "none", color: "inherit", display: "block" }}
              >
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
                <div style={{ fontSize: "14px", color: "#666" }}>{a.genero || "—"}</div>
              </Link>
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

      <section style={{ background: "white", padding: "60px 40px", marginTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776" }}>Livros recentes</h2>
          <Link href="/livros" style={{ fontWeight: 600, color: "#002776" }}>VER TODOS OS LIVROS →</Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "24px" }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} style={{ background: "#E0E0E0", aspectRatio: "3/4", borderRadius: "4px" }} />
          ))}
        </div>
      </section>

      <section style={{ background: "white", padding: "60px 40px", marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" }}>
        <div>
          <h3 style={{ fontSize: "24px", fontWeight: 700, color: "#002776", marginBottom: "32px" }}>Próximos eventos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {[
              { dia: "03", mes: "SET", nome: "Bienal do Livro de São Paulo", quando: "03 a 13 de setembro • São Paulo/SP" },
              { dia: "20", mes: "SET", nome: "Lançamento Coletivo", quando: "20 de setembro • Fortaleza/CE" },
              { dia: "10", mes: "OUT", nome: "Sarau Literário", quando: "10 de outubro • Fortaleza/CE" },
            ].map((ev) => (
              <div key={ev.nome} style={{ borderLeft: "4px solid #002776", paddingLeft: "16px" }}>
                <div style={{ fontSize: "28px", fontWeight: 700, color: "#002776" }}>{ev.dia}</div>
                <div style={{ fontSize: "12px", color: "#666", textTransform: "uppercase", marginBottom: "8px" }}>{ev.mes}</div>
                <div style={{ fontWeight: 600, marginBottom: "4px" }}>{ev.nome}</div>
                <div style={{ fontSize: "14px", color: "#666" }}>{ev.quando}</div>
              </div>
            ))}
          </div>
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

      <section id="contato" style={{ background: "white", padding: "60px 40px", marginTop: "40px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px" }}>
        <div>
          <h2 style={{ fontSize: "32px", fontWeight: 700, color: "#002776", marginBottom: "24px" }}>Contato</h2>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#262626", marginBottom: "16px" }}>Fale conosco</h3>
          <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6, marginBottom: "32px" }}>
            Entre em contato para parcerias, convites e mais informações
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
            <div>📧 contato@escritoresdobrasil.com.br</div>
            <div>📱 (79) 99182 - 1546</div>
            <div>📍 Fortaleza - CE</div>
          </div>
        </div>
        <div>
          <form style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <input type="text" placeholder="Nome" style={{ padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }} />
            <input type="email" placeholder="E-mail" style={{ padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }} />
            <input type="text" placeholder="Assunto" style={{ padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px" }} />
            <textarea placeholder="Mensagem" style={{ padding: "12px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "14px", minHeight: "120px", resize: "none" }} />
            <button type="submit" style={{ background: "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px" }}>
              ENVIAR MENSAGEM
            </button>
          </form>
        </div>
      </section>

      <PublicFooter showAdminLink />
    </div>
  );
}
