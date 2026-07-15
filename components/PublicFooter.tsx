import Link from "next/link";
import Image from "next/image";

export default function PublicFooter({
  variant = "full",
  showAdminLink = false,
}: {
  variant?: "full" | "minimal";
  showAdminLink?: boolean;
}) {
  if (variant === "minimal") {
    return (
      <footer
        style={{
          background: "#002776",
          color: "white",
          padding: "24px 40px",
          borderTop: "1px solid rgba(255,255,255,0.2)",
          textAlign: "center",
          fontSize: "12px",
        }}
      >
        <p style={{ color: "rgba(255,255,255,0.7)" }}>
          © 2026 Autores Independentes do Brasil. Todos os direitos reservados.
        </p>
      </footer>
    );
  }

  return (
    <footer className="section-pad-md" style={{ background: "#002776", color: "white", padding: "40px", marginTop: "60px" }}>
      <div
        className="responsive-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "40px",
          maxWidth: "1400px",
          margin: "0 auto",
        }}
      >
        <div>
          <Image
            src="/logo-footer-white-text.png"
            alt="Logo"
            width={160}
            height={40}
            style={{ height: "40px", width: "auto", objectFit: "contain", marginBottom: "16px" }}
          />
          <p style={{ fontSize: "13px", lineHeight: 1.6 }}>
            Coletivo de escritores valorizando histórias, conectando pessoas.
          </p>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: "16px", fontSize: "13px" }}>NAVEGAÇÃO</div>
          <nav
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "10px 24px",
              fontSize: "13px",
            }}
          >
            <Link href="/" style={{ color: "white" }}>Home</Link>
            <Link href="/coletivo" style={{ color: "white" }}>O Coletivo</Link>
            <Link href="/autores" style={{ color: "white" }}>Autores</Link>
            <Link href="/livros" style={{ color: "white" }}>Livros</Link>
            <Link href="/eventos" style={{ color: "white" }}>Eventos</Link>
            <Link href="/blog" style={{ color: "white" }}>Blog</Link>
            <Link href="/galeria" style={{ color: "white" }}>Galeria</Link>
            <Link href="/#contato" style={{ color: "white" }}>Contato</Link>
          </nav>
        </div>
        <div>
          <div style={{ fontWeight: 700, marginBottom: "16px", fontSize: "13px" }}>NEWSLETTER</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input
              type="email"
              placeholder="Seu e-mail"
              style={{
                width: "100%",
                padding: "10px",
                border: "none",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            />
            <button
              style={{
                background: "#FFDF00",
                color: "#002776",
                padding: "10px 16px",
                fontWeight: 700,
                borderRadius: "4px",
                fontSize: "13px",
              }}
            >
              ASSINAR
            </button>
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "16px", fontSize: "18px" }}>
            <a href="#" style={{ color: "white" }}>📱</a>
            <a href="#" style={{ color: "white" }}>𝕏</a>
            <a href="#" style={{ color: "white" }}>👍</a>
          </div>
        </div>
      </div>
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.2)",
          marginTop: "24px",
          paddingTop: "16px",
          textAlign: "center",
          fontSize: "12px",
          color: "rgba(255,255,255,0.7)",
        }}
      >
        <p>
          © 2026 Autores Independentes do Brasil. Todos os direitos reservados.
          {showAdminLink && (
            <>
              {" "}
              ·{" "}
              <Link href="/admin" style={{ color: "rgba(255,255,255,0.7)" }}>
                Área administrativa
              </Link>
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
