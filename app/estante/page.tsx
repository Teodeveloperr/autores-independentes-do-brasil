import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import { SairLeitorButton } from "@/components/leitor/LeitorForms";
import { prisma } from "@/lib/db";
import { EBOOK_STATUS_LEITURA } from "@/lib/ebook";
import { requireLeitor, MAX_APARELHOS } from "@/lib/leitorAuth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Minha estante", robots: { index: false, follow: false } };

function quandoFoi(data: Date): string {
  const minutos = Math.round((Date.now() - data.getTime()) / 60000);
  if (minutos < 2) return "agora há pouco";
  if (minutos < 60) return `há ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas} h`;
  return `há ${Math.round(horas / 24)} dia(s)`;
}

export default async function EstantePage() {
  const leitor = await requireLeitor();

  const [acessos, sessoes] = await Promise.all([
    prisma.acessoEbook.findMany({
      where: { leitorId: leitor.id, revogadoEm: null },
      orderBy: { concedidoEm: "desc" },
      include: { book: { select: { id: true, titulo: true, capaUrl: true, ebookStatus: true, ebookPaginas: true, author: { select: { nome: true } } } } },
    }),
    prisma.leitorSessao.findMany({ where: { leitorId: leitor.id, expiraEm: { gt: new Date() } }, orderBy: { ultimoUsoEm: "desc" }, select: { id: true, aparelho: true, ultimoUsoEm: true } }),
  ]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ flex: 1, background: "#F6F6F6", padding: "40px" }}>
        <div style={{ maxWidth: "1000px", width: "100%", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "8px" }}>
            <h1 style={{ fontSize: "32px", fontWeight: 700, color: "#002776" }}>Minha estante</h1>
            <SairLeitorButton />
          </div>
          <p style={{ fontSize: "14px", color: "#666", marginBottom: "28px" }}>
            Conectado como <strong>{leitor.nome ?? leitor.email}</strong>.
          </p>

          {acessos.length === 0 ? (
            <div style={{ background: "white", borderRadius: "8px", padding: "40px", textAlign: "center", color: "#666", fontSize: "15px", lineHeight: 1.6 }}>
              Você ainda não tem e-books na estante. Quando comprar um, ele aparece aqui.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "20px" }}>
              {acessos.map((a) => (
                <div key={a.id} style={{ background: "white", borderRadius: "8px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ aspectRatio: "3 / 4", background: "#E9E9E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {a.book.capaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.book.capaUrl} alt={`Capa de ${a.book.titulo}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: "40px" }}>📖</span>
                    )}
                  </div>
                  <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                    <div style={{ fontWeight: 700, color: "#262626", lineHeight: 1.3 }}>{a.book.titulo}</div>
                    <div style={{ fontSize: "13px", color: "#666" }}>{a.book.author.nome}</div>
                    {a.book.ebookPaginas ? <div style={{ fontSize: "12px", color: "#999" }}>{a.book.ebookPaginas} páginas</div> : null}
                    {a.book.ebookStatus && EBOOK_STATUS_LEITURA.includes(a.book.ebookStatus) ? (
                      <a
                        href={`/ler/${a.book.id}`}
                        style={{ marginTop: "auto", background: "#009B3A", color: "white", textAlign: "center", padding: "10px", fontWeight: 700, borderRadius: "4px", fontSize: "14px" }}
                      >
                        Ler agora
                      </a>
                    ) : (
                      <span style={{ marginTop: "auto", background: "#EEE", color: "#888", textAlign: "center", padding: "10px", fontWeight: 600, borderRadius: "4px", fontSize: "13px" }}>
                        Em preparação
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ background: "white", borderRadius: "8px", padding: "20px 24px", marginTop: "32px" }}>
            <div style={{ fontWeight: 700, color: "#002776", marginBottom: "6px" }}>Aparelhos conectados</div>
            <p style={{ fontSize: "13px", color: "#666", lineHeight: 1.5, marginBottom: "12px" }}>
              Você pode ler em até {MAX_APARELHOS} aparelhos ao mesmo tempo. Ao entrar num terceiro, o mais antigo é desconectado.
            </p>
            <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px", fontSize: "14px" }}>
              {sessoes.map((s) => (
                <li key={s.id}>
                  {s.aparelho ?? "Aparelho"} <span style={{ color: "#999" }}>· último uso {quandoFoi(s.ultimoUsoEm)}</span>
                  {s.id === leitor.sessaoId ? <strong style={{ color: "#009B3A" }}> · este aparelho</strong> : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
