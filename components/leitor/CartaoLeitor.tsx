import PublicHeader from "@/components/PublicHeader";

// Moldura comum das telas de entrada do leitor (mesmo visual das telas de login dos autores).
export default function CartaoLeitor({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#002776" }}>
      <PublicHeader />
      <section className="section-pad-lg" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 40px" }}>
        <div className="section-pad-md" style={{ background: "white", color: "#262626", padding: "48px", borderRadius: "8px", maxWidth: "460px", width: "100%" }}>
          <h1 style={{ fontSize: "26px", fontWeight: 700, marginBottom: "8px", textAlign: "center", color: "#002776" }}>{titulo}</h1>
          {subtitulo && <p style={{ fontSize: "14px", color: "#666", textAlign: "center", marginBottom: "28px", lineHeight: 1.5 }}>{subtitulo}</p>}
          {children}
        </div>
      </section>
    </div>
  );
}
