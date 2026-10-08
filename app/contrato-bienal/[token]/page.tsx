import type { Metadata } from "next";
import Link from "next/link";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import ContratoAcompanhamento from "@/components/contrato/ContratoAcompanhamento";
import { prisma } from "@/lib/db";
import { horariosDasReservas } from "@/lib/contrato/agenda";
import { LINK_GRUPO_WHATSAPP_BIENAL, PACOTES, WHATSAPP_NEGOCIADO_EXIBIDO, WHATSAPP_NEGOCIADO_URL, formatarNumeroContrato, rotuloHorario, type PacoteContrato } from "@/lib/contrato/config";
import { ROTULO_FORMA_PAGAMENTO, garantirEmailsDoContratoPago, sincronizarPagamentoContrato } from "@/lib/contrato/servico";
import { brlMilhar } from "@/lib/contrato/texto";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Seu contrato da Bienal", robots: { index: false, follow: false } };

async function carregar(token: string) {
  return prisma.contratoBienal.findUnique({
    where: { token },
    omit: { pdf: true, assinaturaPng: true, codigoHash: true },
    include: { reservas: true },
  });
}

function Cartao({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ background: "#002776", padding: "40px", flex: 1, display: "flex", justifyContent: "center", alignItems: "flex-start" }}>
        <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "36px", borderRadius: "8px", maxWidth: "640px", width: "100%", display: "flex", flexDirection: "column", gap: "18px" }}>
          {children}
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}

export default async function ContratoAcompanhamentoPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let contrato = await carregar(token);

  if (contrato?.status === "assinado") {
    // Rede de segurança caso o aviso automático da Asaas atrase: confere o pagamento aqui.
    const mudou = await sincronizarPagamentoContrato(contrato).catch(() => false);
    if (mudou) contrato = await carregar(token);
  }
  if (contrato?.status === "pago" && !contrato.emailPagoEnviadoEm) {
    await garantirEmailsDoContratoPago(contrato.id).catch(() => undefined);
  }

  if (!contrato) {
    return (
      <Cartao>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>Contrato não encontrado</h1>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6 }}>Este link não é válido. Confira se você copiou o endereço inteiro.</p>
        <Link href="/contrato-bienal" style={{ color: "#002776", fontWeight: 600 }}>Fazer um novo contrato</Link>
      </Cartao>
    );
  }

  if (contrato.status === "rascunho") {
    return (
      <Cartao>
        <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#002776" }}>Este contrato ainda não foi assinado</h1>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6 }}>Volte para a página do contrato para escolher o pacote e assinar.</p>
        <Link href="/contrato-bienal" style={{ color: "#002776", fontWeight: 600 }}>Ir para o contrato</Link>
      </Cartao>
    );
  }

  const pago = contrato.status === "pago";
  const numeroTexto = contrato.numero ? formatarNumeroContrato(contrato.numero) : "";
  const pacoteNome = PACOTES[contrato.pacote as PacoteContrato]?.nome ?? contrato.pacote;
  const agenda = horariosDasReservas(contrato.reservas).map(rotuloHorario);

  return (
    <Cartao>
      <div>
        <div style={{ fontSize: "40px", marginBottom: "6px" }}>{pago ? "✅" : "⏳"}</div>
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#002776", marginBottom: "6px" }}>
          {pago ? "Pagamento confirmado" : "Contrato assinado, falta o pagamento"}
        </h1>
        <p style={{ fontSize: "14px", color: "#555", lineHeight: 1.6 }}>
          {pago
            ? "Sua participação na Bienal do Livro Rio 2027 está garantida. O contrato assinado também foi enviado para o seu e-mail."
            : "Seu contrato foi assinado. Finalize o pagamento para garantir a sua participação e os horários escolhidos."}
        </p>
      </div>

      <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "16px 18px", fontSize: "14px", lineHeight: 1.9 }}>
        <div><strong>Contrato:</strong> {numeroTexto}</div>
        <div><strong>Pacote:</strong> {pacoteNome}</div>
        <div><strong>Pagamento:</strong> {ROTULO_FORMA_PAGAMENTO[contrato.formaPagamento as keyof typeof ROTULO_FORMA_PAGAMENTO]}, {brlMilhar(contrato.valorCentavos)}</div>
      </div>

      {agenda.length > 0 && (
        <div>
          <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "6px" }}>Seus horários</div>
          <ul style={{ margin: 0, paddingLeft: "18px", fontSize: "14px", lineHeight: 1.8 }}>
            {agenda.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
          {pago && (
            <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
              Para trocar um horário, fale com a equipe pelo WhatsApp {WHATSAPP_NEGOCIADO_EXIBIDO}.
            </p>
          )}
        </div>
      )}

      <ContratoAcompanhamento token={token} status={pago ? "pago" : "assinado"} linkGrupo={LINK_GRUPO_WHATSAPP_BIENAL} />

      {!pago && (
        <p style={{ fontSize: "12px", color: "#666" }}>
          Os horários ficam reservados por 24 horas. Dúvidas?{" "}
          <a href={WHATSAPP_NEGOCIADO_URL} target="_blank" rel="noopener noreferrer" style={{ color: "#0a6130", fontWeight: 600 }}>
            Fale no WhatsApp
          </a>
          .
        </p>
      )}
    </Cartao>
  );
}
