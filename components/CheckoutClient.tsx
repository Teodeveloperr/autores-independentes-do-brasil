"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { criarPedido, calcularFreteCarrinho, type FreteAutor } from "@/app/checkout/actions";
import { brl } from "@/lib/format";
import { buscarEnderecoPorCep } from "@/lib/cep";
import { validarCpf } from "@/lib/cpf";

export default function CheckoutClient() {
  const { items, totalCentavos, clearCart } = useCart();
  const [pending, startTransition] = useTransition();
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [calculandoFrete, setCalculandoFrete] = useState(false);
  const [fretes, setFretes] = useState<FreteAutor[]>([]);
  const [erro, setErro] = useState("");
  const [redirecionando, setRedirecionando] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpf, setCpf] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("");

  const freteTotalCentavos = fretes.reduce((sum, f) => sum + (f.disponivel ? f.precoCentavos : 0), 0);
  const freteIndisponivel = fretes.some((f) => !f.disponivel);

  async function calcularFrete(cepValue: string) {
    const digits = cepValue.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setCalculandoFrete(true);
    try {
      const resultado = await calcularFreteCarrinho(
        items.map((i) => ({ bookId: i.bookId, authorId: i.authorId, titulo: i.titulo, precoCentavos: i.precoCentavos, quantidade: i.quantidade })),
        cepValue
      );
      setFretes(resultado);
    } finally {
      setCalculandoFrete(false);
    }
  }

  async function onCepBlur() {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setBuscandoCep(true);
    const endereco = await buscarEnderecoPorCep(cep);
    setBuscandoCep(false);
    if (endereco) {
      setRua(endereco.logradouro);
      setBairro(endereco.bairro);
      setCidade(endereco.localidade);
      setUf(endereco.uf);
    }
    calcularFrete(cep);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!validarCpf(cpf)) {
      setErro("CPF inválido.");
      return;
    }
    startTransition(async () => {
      try {
        const resultado = await criarPedido(
          items.map((i) => ({
            bookId: i.bookId,
            authorId: i.authorId,
            titulo: i.titulo,
            precoCentavos: i.precoCentavos,
            quantidade: i.quantidade,
          })),
          { nome, email, telefone, cpf },
          { cep, rua, numero, complemento, bairro, cidade, uf }
        );
        if ("error" in resultado) {
          setErro(resultado.error);
          return;
        }
        clearCart();
        setRedirecionando(true);
        window.location.href = resultado.invoiceUrl;
      } catch (err) {
        setErro(err instanceof Error ? err.message : "Não foi possível finalizar o pedido.");
      }
    });
  }

  if (redirecionando) {
    return (
      <div className="section-pad-md" style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
        <div style={{ fontSize: "40px", marginBottom: "16px" }}>💳</div>
        <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "12px" }}>Redirecionando para o pagamento...</h2>
        <p style={{ fontSize: "14px", color: "#666", maxWidth: "460px", margin: "0 auto" }}>
          Você vai concluir o pagamento (Pix ou cartão) em uma página segura da Asaas.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="section-pad-md" style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "60px 40px", textAlign: "center" }}>
        <p style={{ fontSize: "16px", color: "#666", marginBottom: "20px" }}>Seu carrinho está vazio.</p>
        <Link href="/livros" style={{ display: "inline-block", background: "#002776", color: "white", padding: "12px 24px", fontWeight: 600, borderRadius: "4px" }}>
          Ver livros disponíveis →
        </Link>
      </div>
    );
  }

  return (
    <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "40px", alignItems: "start" }}>
      <form onSubmit={onSubmit} style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "32px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <div style={{ fontWeight: 700, marginBottom: "16px" }}>Seus dados</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Nome completo</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Telefone (opcional)</label>
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>CPF</label>
              <input
                type="text"
                required
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
              />
              <p style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Necessário pra gerar a cobrança do pagamento.</p>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: "16px" }}>Endereço de entrega</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>CEP</label>
                <input
                  type="text"
                  required
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={onCepBlur}
                  placeholder="00000-000"
                  style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
                />
                {buscandoCep && <p style={{ fontSize: "11px", color: "#999", marginTop: "4px" }}>Buscando endereço...</p>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Rua</label>
                <input
                  type="text"
                  required
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
            </div>
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Número</label>
                <input
                  type="text"
                  required
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Complemento (opcional)</label>
                <input
                  type="text"
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Apto, bloco..."
                  style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Bairro</label>
              <input
                type="text"
                required
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
              />
            </div>
            <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Cidade</label>
                <input
                  type="text"
                  required
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>UF</label>
                <input
                  type="text"
                  required
                  maxLength={2}
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "14px", textTransform: "uppercase" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 700, marginBottom: "12px" }}>Forma de pagamento</div>
          <p style={{ fontSize: "13px", color: "#666" }}>
            💳 Na próxima tela, você escolhe entre Pix ou cartão de crédito — o pagamento é processado pela Asaas.
          </p>
        </div>

        {erro && <p style={{ color: "#C0392B", fontSize: "13px" }}>{erro}</p>}

        <button
          type="submit"
          disabled={pending}
          style={{ background: "#009B3A", color: "white", padding: "14px", fontWeight: 700, borderRadius: "4px", fontSize: "15px", opacity: pending ? 0.7 : 1 }}
        >
          {pending ? "Gerando pagamento..." : "Ir para o pagamento"}
        </button>
      </form>

      <div style={{ background: "white", color: "#262626", borderRadius: "8px", padding: "24px" }}>
        <div style={{ fontWeight: 700, marginBottom: "16px" }}>Resumo do pedido</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
          {items.map((item) => (
            <div key={item.bookId} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
              <span>
                {item.titulo} <span style={{ color: "#999" }}>×{item.quantidade}</span>
              </span>
              <span style={{ fontWeight: 600 }}>{brl(item.precoCentavos * item.quantidade)}</span>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid #E0E0E0", paddingTop: "12px", marginBottom: "8px" }}>
          {calculandoFrete ? (
            <div style={{ fontSize: "13px", color: "#666" }}>Calculando frete...</div>
          ) : fretes.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {fretes.map((f) => (
                <div key={f.authorId} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#666" }}>
                  <span>
                    Frete ({f.autorNome}){f.servico ? ` — ${f.servico}` : ""}
                    {f.prazoDias ? ` · ${f.prazoDias} dia${f.prazoDias === 1 ? "" : "s"}` : ""}
                  </span>
                  <span style={{ fontWeight: 600, color: "#262626" }}>{f.disponivel ? brl(f.precoCentavos) : "A combinar"}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#666" }}>
              <span>Frete</span>
              <span>Informe o CEP</span>
            </div>
          )}
          {freteIndisponivel && (
            <p style={{ fontSize: "11px", color: "#999", marginTop: "6px" }}>
              O frete de alguns itens será combinado diretamente com o autor.
            </p>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "16px", borderTop: "1px solid #E0E0E0", paddingTop: "12px" }}>
          <span>Total</span>
          <span style={{ color: "#002776" }}>{brl(totalCentavos + freteTotalCentavos)}</span>
        </div>
      </div>
    </div>
  );
}
