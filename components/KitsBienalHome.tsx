import Image from "next/image";
import Link from "next/link";

// Seção da home com os kits "Impressão de livros + Lançamento" da Bienal do Livro Rio 2027.
// Os botões levam ao checkout do kit (/checkout/kit/[kit]); preços e parcelamento ficam em lib/kits.ts.
export default function KitsBienalHome() {
  return (
    <section
      id="kits-bienal"
      className="responsive-grid section-pad-lg"
      style={{ background: "white", padding: "48px 40px", marginTop: "20px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}
    >
      <div>
        <Image
          src="/kits-bienal-2027.webp"
          alt="Você e seu livro na Bienal do Livro Rio 2027: impressão de livros mais lançamento. Kit Prata, 40 cópias, R$ 1.599,00. Kit Ouro, 60 cópias, R$ 2.199,00."
          width={1080}
          height={1080}
          sizes="(max-width: 900px) 100vw, 560px"
          style={{ width: "100%", height: "auto", borderRadius: "8px", display: "block" }}
        />
      </div>
      <div>
        <h2 style={{ fontSize: "30px", fontWeight: 700, color: "#002776", lineHeight: 1.3, marginBottom: "20px" }}>
          Seu livro merece chegar mais longe. E a Bienal do Livro Rio 2027 pode ser o próximo capítulo dessa história!
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "16px", color: "#262626", lineHeight: 1.6 }}>
          <p>Já imaginou ver sua obra impressa, conquistar novos leitores e realizar seu lançamento em um dos maiores eventos literários do país?</p>
          <p>Os Autores Independentes do Brasil prepararam duas oportunidades especiais para quem deseja transformar esse sonho em realidade.</p>
          <p>
            Não deixe sua história esperando por uma oportunidade. Faça parte desse grande encontro com a literatura, apresente seu trabalho ao público e viva a experiência de lançar seu livro na Bienal do Livro Rio 2027!
          </p>
          <p style={{ fontWeight: 700, color: "#002776" }}>A literatura independente também ocupa grandes espaços. E o seu livro pode estar lá!</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "28px" }}>
          <Link href="/checkout/kit/prata" style={{ background: "#009B3A", color: "white", padding: "14px 28px", fontWeight: 700, borderRadius: "4px", textAlign: "center" }}>
            Contratar Kit Prata
          </Link>
          <Link href="/checkout/kit/ouro" style={{ background: "#FFDF00", color: "#002776", padding: "14px 28px", fontWeight: 700, borderRadius: "4px", textAlign: "center" }}>
            Contratar Kit Ouro
          </Link>
        </div>
      </div>
    </section>
  );
}
