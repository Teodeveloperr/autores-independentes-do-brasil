import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ContratoWizard from "@/components/contrato/ContratoWizard";
import { getCurrentAuthor } from "@/lib/auth";
import { carregarOcupacao } from "@/lib/contrato/agenda";
import { WHATSAPP_NEGOCIADO_EXIBIDO, WHATSAPP_NEGOCIADO_URL } from "@/lib/contrato/config";
import { carregarAssinaturaContratada } from "@/lib/contrato/servico";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contrato da Bienal do Livro Rio 2027",
  description: "Contrate a sua participação no estande dos Autores Independentes do Brasil na Bienal do Livro Rio 2027.",
};

export default async function ContratoBienalPage() {
  const [author, assinaturaContratada, ocupacao] = await Promise.all([
    getCurrentAuthor(),
    carregarAssinaturaContratada(),
    carregarOcupacao(),
  ]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
        <div style={{ maxWidth: "1100px", width: "100%", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
          <div style={{ textAlign: "center", maxWidth: "720px" }}>
            <h1 style={{ fontSize: "34px", fontWeight: 700, marginBottom: "12px" }}>Contrato da Bienal do Livro Rio 2027</h1>
            <p style={{ fontSize: "16px", lineHeight: 1.6 }}>
              Escolha o seu pacote, defina os horários no estande, assine o contrato e pague sem sair daqui. Tudo em poucos minutos, de 3 a 12 de setembro de 2027, no Riocentro.
            </p>
          </div>

          {assinaturaContratada ? (
            <ContratoWizard
              planoAutor={author?.plano ?? null}
              prefill={author ? { nome: author.nome, email: author.email, cpf: author.cpf ?? "" } : null}
              ocupacaoInicial={ocupacao}
            />
          ) : (
            <div style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px", maxWidth: "560px", textAlign: "center" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#002776", marginBottom: "10px" }}>Contratação indisponível no momento</h2>
              <p style={{ fontSize: "14px", lineHeight: 1.6, color: "#555", marginBottom: "16px" }}>
                A contratação online ainda não foi aberta. Fale com a nossa equipe pelo WhatsApp.
              </p>
              <a href={WHATSAPP_NEGOCIADO_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#0a6130", fontWeight: 700 }}>
                💬 {WHATSAPP_NEGOCIADO_EXIBIDO}
              </a>
            </div>
          )}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
