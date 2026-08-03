import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CheckoutClient from "@/components/CheckoutClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="livros" showContato={false} />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
        <div style={{ maxWidth: "1280px", width: "100%", margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "32px" }}>Finalizar compra</h1>
          <CheckoutClient />
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
