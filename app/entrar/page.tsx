import type { Metadata } from "next";
import { redirect } from "next/navigation";
import CartaoLeitor from "@/components/leitor/CartaoLeitor";
import { LeitorEntrarForm } from "@/components/leitor/LeitorForms";
import { getLeitorAtual } from "@/lib/leitorAuth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Entrar na minha estante", robots: { index: false, follow: false } };

export default async function EntrarLeitorPage() {
  if (await getLeitorAtual()) redirect("/estante");

  return (
    <CartaoLeitor titulo="Minha estante de e-books" subtitulo="Entre para ler os e-books que você comprou.">
      <LeitorEntrarForm />
      <div style={{ textAlign: "center", marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #DDD", fontSize: "13px", color: "#666", lineHeight: 1.6 }}>
        Primeira vez aqui? A senha é criada pelo link que enviamos ao seu e-mail depois da compra. Se não encontrar o e-mail, use
        &quot;Esqueci minha senha / primeiro acesso&quot;. Você é autor?{" "}
        <a href="/login" style={{ color: "#009B3A", fontWeight: 600 }}>Entre pela área do autor</a>.
      </div>
    </CartaoLeitor>
  );
}
