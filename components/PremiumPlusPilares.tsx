const PILARES = [
  {
    emoji: "🔎",
    titulo: "Visibilidade",
    itens: [
      "Destaque nas páginas de Autores e Livros",
      "Destaque privilegiado na página inicial",
      "Selo de Perfil Verificado",
      "Card exclusivo seu no Instagram do coletivo",
    ],
  },
  {
    emoji: "🎯",
    titulo: "Oportunidades",
    itens: [
      "Acesso exclusivo a editais, concursos, festivais e chamadas literárias",
      "Convites prioritários para eventos e projetos especiais",
      "Prioridade na comunicação de novas oportunidades",
      "2 horas de participação em uma Bienal de 2027",
    ],
  },
  {
    emoji: "🤝",
    titulo: "Conexões",
    itens: [
      "Acesso ao Grupo Premium, com networking e prioridade nas comunicações",
      "Atendimento prioritário e suporte exclusivo",
      "Tudo do Autor Essencial",
    ],
  },
  {
    emoji: "📈",
    titulo: "Presença",
    itens: [
      "Comissão reduzida a 10% nas vendas",
      "Até 20% de desconto nos pacotes de participação na Bienal do Livro",
      "Relatório detalhado de vendas e desempenho",
    ],
  },
];

export default function PremiumPlusPilares() {
  return (
    <div style={{ maxWidth: "1200px", margin: "48px auto 0", padding: "0 20px" }}>
      <h2 style={{ fontSize: "28px", fontWeight: 700, color: "white", textAlign: "center", marginBottom: "10px" }}>
        O que o Premium+ constrói pra você
      </h2>
      <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.85)", textAlign: "center", maxWidth: "600px", margin: "0 auto 32px", lineHeight: 1.6 }}>
        Visibilidade, oportunidades, conexões e presença — tudo o que você precisa pra transformar sua
        participação no coletivo numa carreira que cresce de verdade.
      </p>
      <div className="responsive-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px" }}>
        {PILARES.map((p) => (
          <div key={p.titulo} style={{ background: "white", borderRadius: "10px", padding: "24px 20px" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>{p.emoji}</div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#002776", marginBottom: "14px" }}>{p.titulo}</h3>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "10px" }}>
              {p.itens.map((item) => (
                <li key={item} style={{ fontSize: "13px", color: "#444", lineHeight: 1.5 }}>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
