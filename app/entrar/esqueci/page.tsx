import type { Metadata } from "next";
import CartaoLeitor from "@/components/leitor/CartaoLeitor";
import { LeitorEsqueciForm } from "@/components/leitor/LeitorForms";

export const metadata: Metadata = { title: "Criar ou refazer a senha", robots: { index: false, follow: false } };

export default function EsqueciSenhaLeitorPage() {
  return (
    <CartaoLeitor titulo="Criar ou refazer a senha" subtitulo="Digite o e-mail usado na compra e enviaremos um link para escolher a sua senha.">
      <LeitorEsqueciForm />
      <div style={{ textAlign: "center", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #DDD", fontSize: "14px" }}>
        <a href="/entrar" style={{ color: "#009B3A", fontWeight: 600 }}>← Voltar para entrar</a>
      </div>
    </CartaoLeitor>
  );
}
