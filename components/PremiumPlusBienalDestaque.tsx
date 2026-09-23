export default function PremiumPlusBienalDestaque() {
  return (
    <div style={{ maxWidth: "880px", margin: "40px auto 0", padding: "0 20px" }}>
      <div
        style={{
          background: "white",
          borderRadius: "16px",
          padding: "40px",
          borderTop: "4px solid #FFDF00",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: "36px", marginBottom: "14px" }}>📚</div>
        <h2 style={{ fontSize: "24px", fontWeight: 700, color: "#002776", marginBottom: "14px", maxWidth: "600px" }}>
          Sua vez de estar no palco da Bienal
        </h2>
        <p style={{ fontSize: "14px", lineHeight: 1.7, color: "#444", maxWidth: "600px", margin: 0 }}>
          Autores Premium+ garantem 2 horas de participação em uma das Bienais do Livro de 2027 — pra lançar
          sua obra, bater um papo com leitores, fazer sessão de autógrafos ou simplesmente se apresentar pra
          quem passa pelo estande do coletivo. É a chance de sair da tela e se conectar de verdade com quem lê
          você.
        </p>
      </div>
    </div>
  );
}
