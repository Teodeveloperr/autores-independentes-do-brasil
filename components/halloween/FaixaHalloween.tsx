import Link from "next/link";

// Faixa "Seleção de Halloween" da home. Fica escondida (CSS) fora do período do tema.
export default function FaixaHalloween() {
  return (
    <div className="hw-faixa">
      <div className="hw-faixa-caixa">
        <div>
          <h3>🎃 Seleção de Halloween</h3>
          <p>Leituras para arrepiar: histórias de terror de autores independentes para ler com a luz acesa.</p>
        </div>
        <Link href="/livros?genero=Terror">VER LIVROS DE TERROR →</Link>
      </div>
    </div>
  );
}
