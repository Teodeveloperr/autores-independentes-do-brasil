import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import CheckoutKitClient from "@/components/CheckoutKitClient";
import { kitPorId } from "@/lib/kits";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Checkout do kit", robots: { index: false } };

export default async function CheckoutKitPage({ params }: { params: Promise<{ kit: string }> }) {
  const { kit: kitId } = await params;
  const kit = kitPorId(kitId);
  if (!kit) notFound();

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader showContato={false} />
      <section className="section-pad-lg" style={{ background: "#002776", color: "white", padding: "40px", flex: 1 }}>
        <div style={{ maxWidth: "1100px", width: "100%", margin: "0 auto" }}>
          <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "32px" }}>Finalizar contratação</h1>
          <CheckoutKitClient kit={kit} />
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
