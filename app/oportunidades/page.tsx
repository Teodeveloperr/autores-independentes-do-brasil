import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import OportunidadesGrid from "@/components/OportunidadesGrid";
import { prisma } from "@/lib/db";
import { getCurrentAdmin, getCurrentAuthor } from "@/lib/auth";

export const dynamic = "force-dynamic";

const LIMITE_GRATUITO = 3;

export const metadata: Metadata = { title: "Oportunidades" };

export default async function OportunidadesPage() {
  // O prazo é guardado como data pura (meia-noite UTC do dia escolhido), e o servidor roda em
  // UTC — comparar com "agora" mostrava o edital como encerrado já à noite do último dia.
  // Compara com a data de hoje no horário de Brasília, que é o que vale pro usuário.
  const hoje = new Date(`${new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" })}T00:00:00Z`);

  const [author, admin, todas] = await Promise.all([
    getCurrentAuthor(),
    getCurrentAdmin(),
    prisma.opportunity.findMany({
      // prazoFinal nulo = fluxo contínuo (sem data de encerramento): nunca vence e vai pro fim da lista.
      where: { OR: [{ prazoFinal: { gte: hoje } }, { prazoFinal: null }] },
      orderBy: { prazoFinal: { sort: "asc", nulls: "last" } },
    }),
  ]);

  // Visitante sem conta e autor do plano Iniciante veem só as LIMITE_GRATUITO oportunidades
  // com prazo mais próximo de encerrar; quem tem plano pago (e o admin) vê tudo. O corte é feito aqui no servidor
  // de propósito: as demais nem chegam ao navegador, então não dá pra burlar pelo código da página.
  const acessoCompleto = Boolean(admin) || (author !== null && author.plano !== "Iniciante");
  // `todas` já vem ordenada por prazo final crescente, então as primeiras são as que encerram antes.
  const oportunidades = acessoCompleto ? todas : todas.slice(0, LIMITE_GRATUITO);
  const ocultas = todas.length - oportunidades.length;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="oportunidades" />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
        <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "16px" }}>🚀 Oportunidades</h1>
          <p style={{ fontSize: "16px", marginBottom: "40px" }}>
            Editais, bienais, feiras, concursos, prêmios e outras oportunidades pra autores independentes, tudo centralizado em um só lugar.
          </p>
          <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px" }}>
            <OportunidadesGrid
              oportunidades={oportunidades.map((o) => ({
                id: o.id,
                nome: o.nome,
                categoria: o.categoria,
                prazoFinal: o.prazoFinal ? o.prazoFinal.toISOString().slice(0, 10) : null,
                regiao: o.regiao,
                estado: o.estado,
                valor: o.valor,
                link: o.link,
              }))}
              ocultas={ocultas}
              logado={author !== null}
            />
          </div>
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
