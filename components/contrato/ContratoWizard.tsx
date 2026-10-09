"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  assinarContrato,
  corrigirEmail,
  iniciarContrato,
  obterDisponibilidade,
  reenviarCodigo,
  verificarCodigo,
  type DisponibilidadeAgenda,
} from "@/app/contrato-bienal/actions";
import {
  DESCONTO_PIX_PERCENTUAL,
  DESCONTO_PLANO_PERCENTUAL,
  ESTADOS_BR,
  FRASE_ACEITE,
  PACOTES,
  PACOTES_CONTRATO,
  WHATSAPP_NEGOCIADO_EXIBIDO,
  WHATSAPP_NEGOCIADO_URL,
  calcularPrecoContrato,
  type FormaPagamentoContrato,
  type HorarioEscolhido,
  type PacoteContrato,
} from "@/lib/contrato/config";
import { brlMilhar, type ContratoMontado } from "@/lib/contrato/texto";
import { buscarEnderecoPorCep } from "@/lib/cep";
import { validarCpf, validarCnpj } from "@/lib/cpf";
import GradeHorarios from "./GradeHorarios";
import SignaturePad from "./SignaturePad";
import ContratoTextoView from "./ContratoTextoView";
import TurnstileWidget from "../TurnstileWidget";

type Prefill = { nome: string; email: string; cpf: string } | null;

const inputStyle: React.CSSProperties = { width: "100%", padding: "12px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" };
const labelStyle: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" };
const botaoPrimario = (desabilitado: boolean): React.CSSProperties => ({
  background: "#009B3A",
  color: "white",
  padding: "14px 24px",
  fontWeight: 700,
  borderRadius: "6px",
  fontSize: "15px",
  opacity: desabilitado ? 0.6 : 1,
});
const botaoSecundario: React.CSSProperties = { background: "white", border: "1px solid #DDD", color: "#262626", padding: "14px 20px", fontWeight: 600, borderRadius: "6px", fontSize: "14px" };

const PASSOS = ["Pacote", "Horários", "Seus dados", "E-mail", "Assinatura"];

function Erro({ texto }: { texto: string }) {
  if (!texto) return null;
  return (
    <div role="alert" style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px" }}>
      {texto}
    </div>
  );
}

export default function ContratoWizard({
  planoAutor,
  prefill,
  ocupacaoInicial,
}: {
  planoAutor: string | null;
  prefill: Prefill;
  ocupacaoInicial: DisponibilidadeAgenda;
}) {
  const [passo, setPasso] = useState(1);
  const [pacote, setPacote] = useState<PacoteContrato>("standard");
  const [forma, setForma] = useState<FormaPagamentoContrato>("pix");
  const [ocupacao, setOcupacao] = useState(ocupacaoInicial);
  const [horarios, setHorarios] = useState<HorarioEscolhido[]>([]);
  const [erro, setErro] = useState("");
  const [pendente, iniciarTransicao] = useTransition();

  const [dados, setDados] = useState({
    tipoPessoa: "fisica" as "fisica" | "juridica",
    nome: prefill?.nome ?? "",
    cpfCnpj: prefill?.cpf ?? "",
    representanteNome: "",
    representanteCpf: "",
    email: prefill?.email ?? "",
    telefone: "",
    cep: "",
    endereco: "",
    cidade: "",
    uf: "",
  });

  const [token, setToken] = useState("");
  const [codigo, setCodigo] = useState("");
  const [codigoReenviado, setCodigoReenviado] = useState(false);
  const [corrigindoEmail, setCorrigindoEmail] = useState(false);
  const [emailNovo, setEmailNovo] = useState("");
  const [contratoMontado, setContratoMontado] = useState<ContratoMontado | null>(null);
  const [aceitou, setAceitou] = useState(false);
  const [assinaturaPng, setAssinaturaPng] = useState<string | null>(null);

  const preco = calcularPrecoContrato(pacote, forma, planoAutor);
  const descontoPlano = (planoAutor && DESCONTO_PLANO_PERCENTUAL[planoAutor]) || 0;
  const direitos = PACOTES[pacote];
  const horariosCompletos = horarios.filter((h) => h.tipo === "balcao").length === direitos.balcao && horarios.filter((h) => h.tipo === "auditorio").length === direitos.auditorio;

  function atualizar<K extends keyof typeof dados>(campo: K, valor: (typeof dados)[K]) {
    setDados((d) => ({ ...d, [campo]: valor }));
  }

  function irParaHorarios() {
    setErro("");
    setPasso(2);
    obterDisponibilidade()
      .then(setOcupacao)
      .catch(() => undefined);
  }

  function trocarPacote(novo: PacoteContrato) {
    setPacote(novo);
    setHorarios([]);
  }

  async function aoSairDoCep() {
    const endereco = await buscarEnderecoPorCep(dados.cep);
    if (!endereco) return;
    setDados((d) => ({
      ...d,
      endereco: d.endereco || [endereco.logradouro, endereco.bairro].filter(Boolean).join(", "),
      cidade: endereco.localidade || d.cidade,
      uf: endereco.uf || d.uf,
    }));
  }

  function enviarDados(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro("");
    const documento = dados.cpfCnpj.replace(/\D/g, "");
    if (dados.tipoPessoa === "fisica" && !validarCpf(documento)) return setErro("CPF inválido.");
    if (dados.tipoPessoa === "juridica" && !validarCnpj(documento)) return setErro("CNPJ inválido.");
    if (dados.tipoPessoa === "juridica" && !validarCpf(dados.representanteCpf.replace(/\D/g, ""))) {
      return setErro("CPF de quem assina pela empresa é inválido.");
    }

    const formData = new FormData();
    const turnstile = new FormData(e.currentTarget).get("cf-turnstile-response");
    if (typeof turnstile === "string") formData.set("cf-turnstile-response", turnstile);
    formData.set("pacote", pacote);
    formData.set("formaPagamento", forma);
    formData.set("horarios", JSON.stringify(horarios));
    for (const [campo, valor] of Object.entries(dados)) formData.set(campo, valor);

    iniciarTransicao(async () => {
      const resultado = await iniciarContrato(formData);
      if ("erro" in resultado) {
        setErro(resultado.erro);
        return;
      }
      setToken(resultado.token);
      setCodigo("");
      setPasso(4);
    });
  }

  function confirmarCodigo(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    iniciarTransicao(async () => {
      const resultado = await verificarCodigo(token, codigo);
      if ("erro" in resultado) {
        setErro(resultado.erro);
        return;
      }
      setContratoMontado(resultado.contrato);
      setPasso(5);
    });
  }

  function pedirNovoCodigo() {
    setErro("");
    setCodigoReenviado(false);
    iniciarTransicao(async () => {
      const resultado = await reenviarCodigo(token);
      if (resultado.erro) setErro(resultado.erro);
      else setCodigoReenviado(true);
    });
  }

  function enviarEmailCorrigido(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCodigoReenviado(false);
    iniciarTransicao(async () => {
      const resultado = await corrigirEmail(token, emailNovo);
      if ("erro" in resultado) return setErro(resultado.erro);
      atualizar("email", resultado.email);
      setCorrigindoEmail(false);
      setCodigo("");
      setCodigoReenviado(true);
    });
  }

  function assinar() {
    setErro("");
    if (!assinaturaPng) return setErro("Faça a sua assinatura no quadro.");
    if (!aceitou) return setErro("Marque a declaração de aceite para assinar.");
    iniciarTransicao(async () => {
      const resultado = await assinarContrato(token, assinaturaPng, aceitou);
      if ("erro" in resultado) {
        setErro(resultado.erro);
        if (resultado.recomecar) {
          setToken("");
          setHorarios([]);
          setPasso(2);
        }
        return;
      }
      // Pagamento criado: vai direto pra página de pagamento. Se a cobrança falhou, a página do
      // contrato oferece de novo o botão de pagamento.
      window.location.assign(resultado.pagamentoUrl ?? `/contrato-bienal/${token}`);
    });
  }

  return (
    <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "32px", borderRadius: "8px", width: "100%", maxWidth: "820px" }}>
      <ol style={{ display: "flex", flexWrap: "wrap", gap: "6px", listStyle: "none", margin: "0 0 24px", padding: 0, fontSize: "12px", fontWeight: 600 }}>
        {PASSOS.map((nome, i) => (
          <li
            key={nome}
            aria-current={passo === i + 1 ? "step" : undefined}
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              background: passo === i + 1 ? "#002776" : passo > i + 1 ? "#E3F4EA" : "#F0F0F0",
              color: passo === i + 1 ? "white" : passo > i + 1 ? "#0a6130" : "#666",
            }}
          >
            {i + 1}. {nome}
          </li>
        ))}
      </ol>

      {passo === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Escolha o pacote</h2>
            <p style={{ fontSize: "14px", color: "#666" }}>Um pacote por contrato. Os valores são calculados automaticamente.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
            {PACOTES_CONTRATO.map((p) => {
              const d = PACOTES[p];
              const ativo = p === pacote;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => trocarPacote(p)}
                  aria-pressed={ativo}
                  style={{
                    textAlign: "left",
                    background: ativo ? "#F0F5FF" : "white",
                    border: ativo ? "2px solid #002776" : "1px solid #DDD",
                    borderRadius: "8px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: "16px", color: "#002776" }}>{d.nome}</span>
                  <span style={{ fontSize: "20px", fontWeight: 700 }}>{brlMilhar(d.tabelaCentavos)}</span>
                  <span style={{ fontSize: "12px", color: "#555", lineHeight: 1.5 }}>{d.resumo}</span>
                </button>
              );
            })}
          </div>

          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Forma de pagamento</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {(["pix", "cartao"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForma(f)}
                  aria-pressed={forma === f}
                  style={{
                    background: forma === f ? "#009B3A" : "white",
                    color: forma === f ? "white" : "#262626",
                    border: forma === f ? "1px solid #009B3A" : "1px solid #DDD",
                    padding: "10px 18px",
                    borderRadius: "6px",
                    fontSize: "14px",
                    fontWeight: 600,
                  }}
                >
                  {f === "pix" ? `Pix (${DESCONTO_PIX_PERCENTUAL}% de desconto)` : "Cartão de crédito à vista"}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#F6F6F6", borderRadius: "8px", padding: "16px 18px", fontSize: "14px", lineHeight: 1.8 }}>
            <div>Valor de tabela: {brlMilhar(preco.tabelaCentavos)}</div>
            {preco.descontoPercentual > 0 && (
              <div style={{ color: "#0a6130" }}>
                Desconto de {preco.descontoPercentual}%
                {descontoPlano > 0 ? ` (${descontoPlano}% do seu plano${forma === "pix" ? ` + ${DESCONTO_PIX_PERCENTUAL}% do Pix` : ""})` : ""}
              </div>
            )}
            <div style={{ fontSize: "20px", fontWeight: 700, color: "#002776" }}>Total: {brlMilhar(preco.valorCentavos)}</div>
            {!planoAutor && (
              <div style={{ fontSize: "12px", color: "#666", marginTop: "6px" }}>
                Assinantes dos planos Premium e Premium+ têm desconto adicional.{" "}
                <Link href="/login" style={{ color: "#002776", fontWeight: 600 }}>
                  Entre na sua conta
                </Link>{" "}
                para aplicá-lo.
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", justifyContent: "space-between" }}>
            <a
              href={WHATSAPP_NEGOCIADO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#0a6130", fontWeight: 600, fontSize: "14px", textDecoration: "none" }}
            >
              💬 Tem um valor negociado? Fale no WhatsApp {WHATSAPP_NEGOCIADO_EXIBIDO}
            </a>
            <button type="button" onClick={irParaHorarios} style={botaoPrimario(false)}>
              Continuar →
            </button>
          </div>
        </div>
      )}

      {passo === 2 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Escolha a data e o horário</h2>
            <p style={{ fontSize: "14px", color: "#666" }}>
              Bienal do Livro Rio, de 3 a 12 de setembro de 2027, das 10h às 20h. Os horários escolhidos ficam reservados para você enquanto você assina e paga.
            </p>
          </div>
          <GradeHorarios pacote={pacote} ocupacao={ocupacao} selecionados={horarios} onChange={setHorarios} />
          <Erro texto={erro} />
          <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", flexWrap: "wrap" }}>
            <button type="button" onClick={() => setPasso(1)} style={botaoSecundario}>
              ← Voltar
            </button>
            <button
              type="button"
              disabled={!horariosCompletos}
              onClick={() => {
                setErro("");
                setPasso(3);
              }}
              style={botaoPrimario(!horariosCompletos)}
            >
              Continuar →
            </button>
          </div>
        </div>
      )}

      {passo === 3 && (
        <form onSubmit={enviarDados} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Seus dados</h2>
            <p style={{ fontSize: "14px", color: "#666" }}>Estes dados vão para o contrato. Confira com atenção.</p>
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {(["fisica", "juridica"] as const).map((t) => (
              <label key={t} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 600 }}>
                <input type="radio" name="tipoPessoaUi" checked={dados.tipoPessoa === t} onChange={() => atualizar("tipoPessoa", t)} />
                {t === "fisica" ? "Pessoa física" : "Pessoa jurídica (empresa)"}
              </label>
            ))}
          </div>

          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label htmlFor="c-nome" style={labelStyle}>{dados.tipoPessoa === "fisica" ? "Nome completo" : "Razão social"}</label>
              <input id="c-nome" required value={dados.nome} onChange={(e) => atualizar("nome", e.target.value)} style={inputStyle} autoComplete="name" />
            </div>
            <div>
              <label htmlFor="c-doc" style={labelStyle}>{dados.tipoPessoa === "fisica" ? "CPF" : "CNPJ"}</label>
              <input id="c-doc" required inputMode="numeric" value={dados.cpfCnpj} onChange={(e) => atualizar("cpfCnpj", e.target.value)} style={inputStyle} />
            </div>
          </div>

          {dados.tipoPessoa === "juridica" && (
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <label htmlFor="c-rep" style={labelStyle}>Nome de quem assina pela empresa</label>
                <input id="c-rep" required value={dados.representanteNome} onChange={(e) => atualizar("representanteNome", e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label htmlFor="c-repcpf" style={labelStyle}>CPF de quem assina</label>
                <input id="c-repcpf" required inputMode="numeric" value={dados.representanteCpf} onChange={(e) => atualizar("representanteCpf", e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <label htmlFor="c-email" style={labelStyle}>E-mail</label>
              <input id="c-email" type="email" required value={dados.email} onChange={(e) => atualizar("email", e.target.value)} style={inputStyle} autoComplete="email" />
            </div>
            <div>
              <label htmlFor="c-tel" style={labelStyle}>Telefone com DDD</label>
              <input id="c-tel" type="tel" required inputMode="tel" value={dados.telefone} onChange={(e) => atualizar("telefone", e.target.value)} style={inputStyle} autoComplete="tel" />
            </div>
          </div>

          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "14px" }}>
            <div>
              <label htmlFor="c-cep" style={labelStyle}>CEP</label>
              <input id="c-cep" required inputMode="numeric" value={dados.cep} onChange={(e) => atualizar("cep", e.target.value)} onBlur={aoSairDoCep} style={inputStyle} autoComplete="postal-code" />
            </div>
            <div>
              <label htmlFor="c-end" style={labelStyle}>Endereço (rua, número, bairro)</label>
              <input id="c-end" required value={dados.endereco} onChange={(e) => atualizar("endereco", e.target.value)} style={inputStyle} autoComplete="street-address" />
            </div>
          </div>

          <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "14px" }}>
            <div>
              <label htmlFor="c-cidade" style={labelStyle}>Cidade</label>
              <input id="c-cidade" required value={dados.cidade} onChange={(e) => atualizar("cidade", e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label htmlFor="c-uf" style={labelStyle}>Estado</label>
              <select id="c-uf" required value={dados.uf} onChange={(e) => atualizar("uf", e.target.value)} style={inputStyle}>
                <option value="">UF</option>
                {ESTADOS_BR.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>

          <TurnstileWidget />
          <Erro texto={erro} />
          <div style={{ display: "flex", gap: "10px", justifyContent: "space-between", flexWrap: "wrap" }}>
            <button type="button" onClick={() => setPasso(2)} style={botaoSecundario}>
              ← Voltar
            </button>
            <button type="submit" disabled={pendente} style={botaoPrimario(pendente)}>
              {pendente ? "Enviando código..." : "Continuar e confirmar e-mail →"}
            </button>
          </div>
        </form>
      )}

      {passo === 4 && (
        <>
        <form onSubmit={confirmarCodigo} style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "420px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Confirme seu e-mail</h2>
            <p style={{ fontSize: "14px", color: "#666", lineHeight: 1.6 }}>
              Enviamos um código de 6 dígitos para <strong>{dados.email}</strong>. Digite abaixo para continuar. O código vale por 15 minutos.
            </p>
          </div>
          <div>
            <label htmlFor="c-codigo" style={labelStyle}>Código</label>
            <input
              id="c-codigo"
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
              style={{ ...inputStyle, fontSize: "24px", letterSpacing: "8px", textAlign: "center" }}
            />
          </div>
          <Erro texto={erro} />
          {codigoReenviado && <div style={{ fontSize: "13px", color: "#0a6130" }}>Enviamos um novo código para o seu e-mail.</div>}
          <button type="submit" disabled={pendente || codigo.length !== 6} style={botaoPrimario(pendente || codigo.length !== 6)}>
            {pendente ? "Conferindo..." : "Confirmar código"}
          </button>
          <p style={{ fontSize: "12px", color: "#666", lineHeight: 1.5, margin: 0 }}>
            Não chegou? Confira a caixa de <strong>spam</strong> ou lixo eletrônico. O e-mail pode levar alguns minutos.
          </p>
          <button type="button" onClick={pedirNovoCodigo} disabled={pendente} style={{ background: "none", border: "none", color: "#002776", fontWeight: 600, fontSize: "13px", textAlign: "left" }}>
            Não recebi o código. Enviar de novo
          </button>
          {!corrigindoEmail && (
            <button
              type="button"
              onClick={() => {
                setErro("");
                setEmailNovo(dados.email);
                setCorrigindoEmail(true);
              }}
              disabled={pendente}
              style={{ background: "none", border: "none", color: "#002776", fontWeight: 600, fontSize: "13px", textAlign: "left" }}
            >
              Digitei o e-mail errado. Corrigir
            </button>
          )}
        </form>
        {corrigindoEmail && (
          <form onSubmit={enviarEmailCorrigido} style={{ display: "flex", flexDirection: "column", gap: "10px", maxWidth: "420px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E0E0E0" }}>
            <label htmlFor="c-email-novo" style={labelStyle}>Seu e-mail correto</label>
            <input id="c-email-novo" type="email" required value={emailNovo} onChange={(e) => setEmailNovo(e.target.value)} style={inputStyle} autoComplete="email" />
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="submit" disabled={pendente} style={botaoPrimario(pendente)}>
                {pendente ? "Enviando..." : "Enviar código para este e-mail"}
              </button>
              <button type="button" onClick={() => setCorrigindoEmail(false)} disabled={pendente} style={botaoSecundario}>
                Cancelar
              </button>
            </div>
          </form>
        )}
        </>
      )}

      {passo === 5 && contratoMontado && (
        <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Leia e assine o contrato</h2>
            <p style={{ fontSize: "14px", color: "#666" }}>
              Valor do pacote {direitos.nome}: <strong>{brlMilhar(preco.valorCentavos)}</strong>. O número do contrato é gerado no momento da assinatura.
            </p>
          </div>

          <div style={{ border: "1px solid #DDD", borderRadius: "8px", padding: "18px", maxHeight: "420px", overflowY: "auto", background: "#FCFCFC" }} tabIndex={0} aria-label="Texto do contrato">
            <ContratoTextoView contrato={contratoMontado} />
          </div>

          <label style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "14px", lineHeight: 1.5 }}>
            <input type="checkbox" checked={aceitou} onChange={(e) => setAceitou(e.target.checked)} style={{ marginTop: "4px" }} />
            <span>{FRASE_ACEITE}</span>
          </label>

          <div>
            <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>Sua assinatura</div>
            <SignaturePad onChange={setAssinaturaPng} nomeSugerido={dados.tipoPessoa === "juridica" ? dados.representanteNome : dados.nome} />
          </div>

          <Erro texto={erro} />
          <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button type="button" onClick={assinar} disabled={pendente} style={botaoPrimario(pendente)}>
              {pendente ? "Assinando..." : "Assinar e ir para o pagamento →"}
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "#666" }}>
            Ao assinar, você será levado à página segura de pagamento. Seus dados de cartão, se for o caso, são digitados lá e não passam por este site.
          </p>
        </div>
      )}
    </div>
  );
}
