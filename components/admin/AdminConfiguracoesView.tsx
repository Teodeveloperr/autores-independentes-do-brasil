"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { atualizarChavePixParceiro } from "@/app/admin/actions";

const TIPOS_CHAVE_PIX = [
  { value: "CPF", label: "CPF" },
  { value: "CNPJ", label: "CNPJ" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefone" },
  { value: "EVP", label: "Chave aleatória" },
];

export default function AdminConfiguracoesView({
  premiumPlusPixKey,
  premiumPlusPixKeyType,
}: {
  premiumPlusPixKey: string | null;
  premiumPlusPixKeyType: string | null;
}) {
  const [pixKey, setPixKey] = useState(premiumPlusPixKey ?? "");
  const [pixKeyType, setPixKeyType] = useState(premiumPlusPixKeyType ?? "CPF");
  const [salvando, startSalvar] = useTransition();
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);
  const router = useRouter();

  function onSalvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvo(false);
    const fd = new FormData();
    fd.set("pixKey", pixKey);
    fd.set("pixKeyType", pixKeyType);
    startSalvar(async () => {
      const resultado = await atualizarChavePixParceiro(fd);
      if (resultado?.error) {
        setErro(resultado.error);
        return;
      }
      setSalvo(true);
      router.refresh();
    });
  }

  return (
    <div>
      <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#002776", marginBottom: "20px" }}>Configurações</h2>

      <div style={{ background: "white", borderRadius: "10px", padding: "24px", maxWidth: "620px" }}>
        <div style={{ fontWeight: 700, color: "#002776", marginBottom: "4px" }}>Repasse do parceiro — Premium+</div>
        <p style={{ fontSize: "12px", color: "#666", marginBottom: "16px" }}>
          Chave Pix pra onde vai automaticamente a fatia de R$ 421,20 de cada assinatura Premium+ (R$ 900,00/ano),
          assim que o pagamento estiver disponível para movimentação na Asaas. Uma chave única, usada em todas as
          assinaturas Premium+.
        </p>

        <form onSubmit={onSalvar} style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 240px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Chave Pix</label>
            <input
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              required
              placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
              style={{ width: "100%", padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "6px" }}>Tipo</label>
            <select
              value={pixKeyType}
              onChange={(e) => setPixKeyType(e.target.value)}
              style={{ padding: "10px", border: "1px solid #DDD", borderRadius: "6px", fontSize: "13px" }}
            >
              {TIPOS_CHAVE_PIX.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={salvando}
            style={{ background: "#009B3A", color: "white", padding: "10px 20px", fontWeight: 700, borderRadius: "6px", fontSize: "14px", opacity: salvando ? 0.7 : 1 }}
          >
            {salvando ? "Salvando..." : "Salvar chave Pix"}
          </button>
        </form>
        {erro && (
          <div style={{ color: "#C0392B", fontSize: "13px", background: "#FDEDEC", padding: "10px 14px", borderRadius: "6px", marginTop: "12px" }}>
            {erro}
          </div>
        )}
        {salvo && (
          <div style={{ color: "#009B3A", fontSize: "13px", background: "#E3F4E9", padding: "10px 14px", borderRadius: "6px", marginTop: "12px" }}>
            ✅ Chave Pix salva.
          </div>
        )}
      </div>
    </div>
  );
}
