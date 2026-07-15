import type { Metadata } from "next";
import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "O Coletivo" };

export default function ColetivoPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <PublicHeader active="coletivo" />
      <section style={{ background: "white", padding: "60px 40px", flex: 1 }}>
        <h1 style={{ fontSize: "48px", fontWeight: 700, color: "#002776", marginBottom: "32px" }}>Nossa história</h1>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center", marginBottom: "60px" }}>
          <div>
            <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8, marginBottom: "24px" }}>
              Nosso coletivo nasceu do encontro de vozes diferentes com o mesmo sonho, tornar a literatura independente, plural e transformadora.
            </p>
            <p style={{ fontSize: "16px", color: "#262626", lineHeight: 1.8 }}>
              Acreditamos na força da história para inspirar, questionar e conectar pessoas.
            </p>
          </div>
          <div style={{ background: "#E0E0E0", aspectRatio: "16/9", borderRadius: "8px" }} />
        </div>
        <div style={{ background: "#002776", color: "white", padding: "60px", borderRadius: "8px", textAlign: "center" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "60px" }}>
            <div>
              <div style={{ fontSize: "56px", fontWeight: 700, marginBottom: "8px" }}>50+</div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>AUTORES</div>
            </div>
            <div>
              <div style={{ fontSize: "56px", fontWeight: 700, marginBottom: "8px" }}>200+</div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>LIVROS PUBLICADOS</div>
            </div>
            <div>
              <div style={{ fontSize: "56px", fontWeight: 700, marginBottom: "8px" }}>30</div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>PARTICIPAÇÕES EM BIENAIS</div>
            </div>
          </div>
        </div>
        <div style={{ marginTop: "60px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          <div style={{ background: "#E0E0E0", aspectRatio: "1", borderRadius: "8px" }} />
          <div style={{ background: "#E0E0E0", aspectRatio: "1", borderRadius: "8px" }} />
          <div style={{ background: "#E0E0E0", aspectRatio: "1", borderRadius: "8px" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "24px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#002776", display: "inline-block" }} />
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#DDD", display: "inline-block" }} />
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#DDD", display: "inline-block" }} />
        </div>
      </section>
      <PublicFooter />
    </div>
  );
}
