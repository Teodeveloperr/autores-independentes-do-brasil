"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { iniciarAssinatura, type AssinarState } from "@/app/assinatura/actions";
import { PLANOS_PAGOS, CICLO_MESES, valorCicloCentavos, PLANO_RANK, parcelasDisponiveis, type CicloAssinatura } from "@/lib/plans";
import { buscarEnderecoPorCep } from "@/lib/cep";
import AssinaturaPremiumPopup from "./AssinaturaPremiumPopup";

function brl(centavos: number) {
  return "R$ " + (centavos / 100).toFixed(2).replace(".", ",");
}

const CICLOS: { id: CicloAssinatura; label: string }[] = [
  { id: "mensal", label: "Mensal" },
  { id: "semestral", label: "Semestral (-10%)" },
  { id: "anual", label: "Anual (menor preço)" },
];

const DIAS_AVISO_RENOVACAO_PARCELADO = 15;

function estaPertoDeVencer(planoParceladoAte: Date | null): boolean {
  if (!planoParceladoAte) return false;
  return planoParceladoAte.getTime() - Date.now() < DIAS_AVISO_RENOVACAO_PARCELADO * 24 * 60 * 60 * 1000;
}

function PlanoPagoCard({
  slug,
  ciclo,
  destaqueLabel,
  elevado,
  recursos,
  isLoggedIn,
  planoAtual,
  descontoFidelidadePct,
  planoParceladoAte,
}: {
  slug: "essencial" | "premium" | "premiumPlus";
  ciclo: CicloAssinatura;
  destaqueLabel?: string;
  elevado?: boolean;
  recursos: string[];
  isLoggedIn: boolean;
  planoAtual: string;
  descontoFidelidadePct: number;
  planoParceladoAte: Date | null;
}) {
  const [state, formAction, pending] = useActionState<AssinarState, FormData>(iniciarAssinatura, undefined);
  const [metodoEscolhido, setMetodoEscolhido] = useState<"cartao" | null>(null);
  const [parcelasEscolhidas, setParcelasEscolhidas] = useState<number | null>(null);
  const [cep, setCep] = useState("");
  const [enderecoResumo, setEnderecoResumo] = useState("");
  const [buscandoCep, setBuscandoCep] = useState(false);
  const plano = PLANOS_PAGOS[slug];
  // Premium+ só existe no ciclo anual — ignora o ciclo global (o seletor de ciclo no topo
  // não se aplica a esse card) e sempre calcula/cobra no anual.
  const ciclo2 = slug === "premiumPlus" ? "anual" : ciclo;
  const meses = CICLO_MESES[ciclo2];
  const totalCiclo = valorCicloCentavos(plano, ciclo2);
  const jaAssinante = planoAtual === plano.nome;
  // Plano parcelado (sem renovação automática) perto de vencer: em vez do badge estático
  // de "plano atual", mostra o formulário de compra de novo, pra renovar.
  const parceladoPertoDeVencer = jaAssinante && estaPertoDeVencer(planoParceladoAte);
  const ehUpgrade = planoAtual !== "Iniciante" && !jaAssinante && (PLANO_RANK[plano.nome] ?? 0) > (PLANO_RANK[planoAtual] ?? 0);
  const temDesconto = ehUpgrade && descontoFidelidadePct > 0;
  const totalCicloComDesconto = temDesconto ? Math.round(totalCiclo * (1 - descontoFidelidadePct / 100)) : totalCiclo;
  const porMes = Math.round(totalCicloComDesconto / meses);
  // Parcelas do cartão: a pessoa escolhe de 1 até `meses`; se a seleção guardada não
  // existir mais nas opções do ciclo atual (trocou de ciclo depois de escolher), o
  // Math.min cai pro máximo válido em vez de sumir a seleção.
  const parcelasOpcoes = parcelasDisponiveis(ciclo2);
  const parcelasSelecionadas = Math.min(parcelasEscolhidas ?? meses, meses);
  const valorParcelaCentavos = Math.round(totalCicloComDesconto / parcelasSelecionadas);

  async function onCepBlur() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    const endereco = await buscarEnderecoPorCep(cep);
    setBuscandoCep(false);
    if (endereco) {
      setEnderecoResumo(`${endereco.logradouro}, ${endereco.bairro} - ${endereco.localidade}/${endereco.uf}`);
    }
  }

  return (
    <div
      id={slug === "premiumPlus" ? "premium-plus-card" : undefined}
      style={{
        background: "white",
        color: "#262626",
        borderRadius: elevado ? "12px" : "8px",
        padding: elevado ? "38px 32px 32px" : "32px",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        border: destaqueLabel ? "3px solid #FFDF00" : undefined,
        boxShadow: elevado ? "0 12px 32px rgba(0,39,118,0.18)" : undefined,
        marginTop: elevado ? "-20px" : undefined,
        position: "relative",
      }}
    >
      {destaqueLabel && (
        <div style={{ position: "absolute", top: "-15px", left: "50%", transform: "translateX(-50%)", background: "#FFDF00", color: "#002776", fontSize: "12px", fontWeight: 700, padding: "5px 16px", borderRadius: "12px", whiteSpace: "nowrap" }}>
          {destaqueLabel}
        </div>
      )}
      <div>
        <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>{plano.nome}</div>
        {temDesconto && (
          <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "14px", color: "#999", textDecoration: "line-through" }}>{brl(Math.round(totalCiclo / meses))}</span>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "white", background: "#C0392B", padding: "1px 6px", borderRadius: "10px" }}>
              🎉 Fidelidade: -{descontoFidelidadePct}%
            </span>
          </div>
        )}
        <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>
          {brl(porMes)}
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>/mês</span>
        </div>
        <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>
          {ciclo2 === "mensal" ? "Cobrado mensalmente" : `Cobrado a cada ${meses} meses: ${brl(totalCicloComDesconto)}`}
        </p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", flex: 1 }}>
        {recursos.map((r) => (
          <div key={r} style={{ display: "flex", gap: "8px" }}>
            ✅ {r}
          </div>
        ))}
      </div>
      {state?.error && (
        <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
          {state.error}
        </div>
      )}
      {!isLoggedIn ? (
        <Link
          href={`/cadastro?plano=${slug}&ciclo=${ciclo2}`}
          style={{ display: "block", textAlign: "center", background: destaqueLabel ? "#009B3A" : "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}
        >
          Assinar {plano.nome.replace("Autor ", "")}
        </Link>
      ) : jaAssinante && !parceladoPertoDeVencer ? (
        <div style={{ textAlign: "center", background: "#E3F4E9", color: "#009B3A", padding: "12px", fontWeight: 600, borderRadius: "4px", fontSize: "14px" }}>
          ✓ Seu plano atual
        </div>
      ) : state?.pixQrCode ? (
        <div style={{ textAlign: "center", background: "#F6F6F6", borderRadius: "6px", padding: "16px" }}>
          <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "10px" }}>Escaneie com o app do seu banco pra autorizar a cobrança automática:</p>
          {state.pixQrCode.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`data:image/png;base64,${state.pixQrCode.image}`} alt="QR Code Pix Automático" style={{ width: "180px", height: "180px", margin: "0 auto 10px" }} />
          )}
          <textarea
            readOnly
            value={state.pixQrCode.payload}
            onClick={(e) => e.currentTarget.select()}
            rows={3}
            style={{ width: "100%", fontSize: "11px", padding: "8px", border: "1px solid #DDD", borderRadius: "4px", resize: "none" }}
          />
          <p style={{ fontSize: "11px", color: "#666", marginTop: "10px" }}>
            Depois de autorizar, seu plano é ativado automaticamente — você pode fechar esta tela e conferir no seu painel.
          </p>
        </div>
      ) : (
        <form action={formAction}>
          {parceladoPertoDeVencer && (
            <div style={{ background: "#FEF6E7", color: "#8A6116", fontSize: "12px", padding: "10px 12px", borderRadius: "4px", marginBottom: "10px", textAlign: "center" }}>
              ⏳ Seu plano parcelado vence em breve — renove abaixo pra continuar com acesso.
            </div>
          )}
          <input type="hidden" name="planoSlug" value={slug} />
          <input type="hidden" name="ciclo" value={ciclo2} />
          <input
            name="cpf"
            type="text"
            placeholder="Seu CPF"
            required
            style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px", marginBottom: "10px" }}
          />
          {metodoEscolhido === "cartao" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
              <input
                name="telefone"
                type="tel"
                placeholder="Telefone"
                required
                style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}
              />
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  name="cep"
                  type="text"
                  placeholder="CEP"
                  required
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={onCepBlur}
                  style={{ flex: 1, padding: "10px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}
                />
                <input
                  name="numero"
                  type="text"
                  placeholder="Número"
                  required
                  style={{ flex: 1, padding: "10px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}
                />
              </div>
              {buscandoCep && <p style={{ fontSize: "11px", color: "#999" }}>Buscando endereço...</p>}
              {enderecoResumo && <p style={{ fontSize: "11px", color: "#666" }}>{enderecoResumo}</p>}
              <input
                name="complemento"
                type="text"
                placeholder="Complemento (opcional)"
                style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "4px", fontSize: "13px" }}
              />
            </div>
          )}
          <p style={{ fontSize: "11px", color: "#999", marginBottom: "6px" }}>
            Cartão e Pix renovam automaticamente a cada ciclo, cobrando o valor cheio.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            {metodoEscolhido === "cartao" ? (
              <button
                type="submit"
                name="metodoPagamento"
                value="cartao"
                disabled={pending}
                style={{ flex: 1, background: "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", border: "none", fontSize: "13px", opacity: pending ? 0.7 : 1 }}
              >
                {pending ? "..." : "Confirmar pagamento"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setMetodoEscolhido("cartao")}
                  disabled={pending}
                  style={{ flex: 1, background: "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", border: "none", fontSize: "13px", opacity: pending ? 0.7 : 1 }}
                >
                  Cartão à vista
                </button>
                <button
                  type="submit"
                  name="metodoPagamento"
                  value="pix"
                  disabled={pending}
                  style={{ flex: 1, background: destaqueLabel ? "#009B3A" : "#002776", color: "white", padding: "12px", fontWeight: 600, borderRadius: "4px", border: "none", fontSize: "13px", opacity: pending ? 0.7 : 1 }}
                >
                  {pending ? "..." : "Pix"}
                </button>
              </>
            )}
          </div>
          {metodoEscolhido !== "cartao" && ciclo2 !== "mensal" && (
            <div style={{ background: "#FFF9E6", border: "2px solid #FFDF00", borderRadius: "6px", padding: "12px", marginTop: "12px" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#8A6116", marginBottom: "8px" }}>
                💳 Ou parcele no cartão
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <label htmlFor={`parcelas-${slug}`} style={{ fontSize: "13px", fontWeight: 600, color: "#262626" }}>
                  Em quantas parcelas?
                </label>
                <select
                  id={`parcelas-${slug}`}
                  name="parcelas"
                  value={parcelasSelecionadas}
                  onChange={(e) => setParcelasEscolhidas(Number(e.target.value))}
                  style={{ flex: 1, padding: "8px 10px", border: "1px solid #CCC", borderRadius: "4px", fontSize: "13px", fontWeight: 600 }}
                >
                  {parcelasOpcoes.map((n) => (
                    <option key={n} value={n}>
                      {n}x de {brl(Math.round(totalCicloComDesconto / n))}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                name="metodoPagamento"
                value="parcelado"
                disabled={pending}
                style={{ width: "100%", background: "#002776", border: "none", color: "white", padding: "12px", fontWeight: 700, borderRadius: "4px", fontSize: "14px", opacity: pending ? 0.7 : 1 }}
              >
                {pending ? "..." : `Parcelar no cartão — ${parcelasSelecionadas}x de ${brl(valorParcelaCentavos)}`}
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
}

export default function AssinaturaPlanos({
  isLoggedIn,
  planoAtual,
  descontoFidelidadePct,
  cta,
  planoParceladoAte,
}: {
  isLoggedIn: boolean;
  planoAtual: string;
  descontoFidelidadePct: number;
  cta: string;
  planoParceladoAte?: Date | null;
}) {
  const [ciclo, setCiclo] = useState<CicloAssinatura>("mensal");

  return (
    <>
      <AssinaturaPremiumPopup planoAtual={planoAtual} isLoggedIn={isLoggedIn} />
      <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
        {CICLOS.map((c) => (
          <button
            key={c.id}
            onClick={() => setCiclo(c.id)}
            className="pulse-btn"
            style={{
              background: ciclo === c.id ? "#FFDF00" : "rgba(255,255,255,0.1)",
              color: ciclo === c.id ? "#002776" : "white",
              border: "none",
              padding: "10px 18px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: 700,
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px", maxWidth: "1360px", margin: "0 auto", alignItems: "start" }}>
        <div style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "8px" }}>Iniciante</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#002776" }}>
              R$ 0<span style={{ fontSize: "14px", fontWeight: 500, color: "#666" }}>/mês</span>
            </div>
            <p style={{ fontSize: "13px", color: "#666", marginTop: "8px" }}>Comece sua jornada, construa sua presença e apresente sua trajetória ao mundo.</p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", flex: 1 }}>
            <div style={{ display: "flex", gap: "8px" }}>✅ Perfil público limitado</div>
            <div style={{ display: "flex", gap: "8px" }}>✅ Foto e minibio (até 300 caracteres)</div>
            <div style={{ display: "flex", gap: "8px" }}>✅ Redes sociais</div>
            <div style={{ display: "flex", gap: "8px" }}>✅ Portfólio cultural em PDF limitado</div>
            <div style={{ display: "flex", gap: "8px" }}>✅ Avaliações de leitores</div>
          </div>
          {isLoggedIn && planoAtual === "Iniciante" ? (
            <div style={{ textAlign: "center", background: "#E3F4E9", color: "#009B3A", padding: "12px", fontWeight: 600, borderRadius: "4px", fontSize: "14px" }}>
              ✓ Seu plano atual
            </div>
          ) : (
            <Link href={cta} style={{ display: "block", textAlign: "center", background: "white", border: "2px solid #002776", color: "#002776", padding: "12px", fontWeight: 600, borderRadius: "4px", textDecoration: "none" }}>
              Começar grátis
            </Link>
          )}
        </div>

        <PlanoPagoCard
          slug="essencial"
          ciclo={ciclo}
          isLoggedIn={isLoggedIn}
          planoAtual={planoAtual}
          descontoFidelidadePct={descontoFidelidadePct}
          planoParceladoAte={planoParceladoAte ?? null}
          recursos={[
            "Perfil público completo",
            "Portfólio cultural em PDF completo",
            "Venda de livros (comissão de 25%)",
            "Galeria de fotos",
            "Agenda de eventos",
            "Loja própria",
            "Relatório de vendas básico",
          ]}
        />

        <PlanoPagoCard
          slug="premium"
          ciclo={ciclo}
          isLoggedIn={isLoggedIn}
          planoAtual={planoAtual}
          descontoFidelidadePct={descontoFidelidadePct}
          planoParceladoAte={planoParceladoAte ?? null}
          recursos={[
            "Tudo do Autor Essencial",
            "Comissão reduzida (10%)",
            "Destaque nas páginas de Autores e Livros",
            "Destaque na página inicial",
            "Selo de perfil verificado",
            "Desconto de 10% em bienais",
            "Relatório de vendas detalhado",
            "Prioridade no suporte",
          ]}
        />

        <PlanoPagoCard
          slug="premiumPlus"
          ciclo={ciclo}
          destaqueLabel="★ MAIS COMPLETO"
          elevado
          isLoggedIn={isLoggedIn}
          planoAtual={planoAtual}
          descontoFidelidadePct={descontoFidelidadePct}
          planoParceladoAte={planoParceladoAte ?? null}
          recursos={[
            "Tudo do Autor Premium",
            "Card exclusivo no Instagram do coletivo",
            "2 horas de participação em uma Bienal de 2027",
            "Acesso ao Grupo Premium exclusivo",
            "Acesso a editais e chamadas exclusivas",
            "Até 20% de desconto em pacotes de Bienal",
          ]}
        />
      </div>
    </>
  );
}
