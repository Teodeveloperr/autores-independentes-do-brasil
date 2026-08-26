/* eslint-disable jsx-a11y/alt-text -- react-pdf's <Image> is a PDF primitive, not an HTML <img> */
import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { brl } from "@/lib/format";

export type PortfolioData = {
  nome: string;
  cidade: string | null;
  bio: string | null;
  fotoUrl: string | null;
  capaUrl: string | null;
  email: string;
  instagramUrl: string | null;
  twitterUrl: string | null;
  siteUrl: string | null;
  formacao: string;
  premios: string;
  citacao: string;
  obraDestaque: { titulo: string; capaUrl: string | null; descricao: string | null; genero: string } | null;
  livros: { titulo: string; capaUrl: string | null; genero: string; precoCentavos: number }[];
  avaliacoes: { nome: string; texto: string; estrelas: number }[];
  fotos: { url: string; titulo: string }[];
};

const AZUL = "#002776";
const VERDE = "#009B3A";
const AMARELO = "#FFDF00";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 11, color: "#262626", fontFamily: "Helvetica" },
  coverPage: { flexDirection: "row" },
  coverEsquerda: { width: "58%", height: "100%", backgroundColor: AZUL, color: "white", padding: 56, justifyContent: "center" },
  coverDireita: { width: "42%", height: "100%", backgroundColor: "#0A1A3D" },
  coverFoto: { width: "100%", height: "100%", objectFit: "cover" },
  coverKicker: { fontSize: 13, letterSpacing: 3, color: AMARELO, marginBottom: 14, textTransform: "uppercase" },
  coverNome: { fontSize: 38, fontWeight: 700, marginBottom: 10, lineHeight: 1.1 },
  coverCidade: { fontSize: 13, color: "#CCD6EE" },
  coverRodape: { position: "absolute", bottom: 40, left: 56, fontSize: 9, color: "#8FA3D1" },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: AZUL, marginBottom: 16, borderBottom: `2px solid ${VERDE}`, paddingBottom: 8 },
  paragraph: { fontSize: 11, lineHeight: 1.6, marginBottom: 12, color: "#333" },
  subheading: { fontSize: 12, fontWeight: 700, color: AZUL, marginBottom: 6, marginTop: 14 },
  row: { flexDirection: "row", gap: 24, marginBottom: 20 },
  obraCapa: { width: 150, height: 200, objectFit: "cover", borderRadius: 4 },
  obraInfo: { flex: 1 },
  obraTitulo: { fontSize: 16, fontWeight: 700, color: AZUL, marginBottom: 4 },
  obraGenero: { fontSize: 10, color: "#666", marginBottom: 10 },
  fotosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  fotoItem: { width: 160, height: 160, objectFit: "cover", borderRadius: 4 },
  livrosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 18 },
  livroCard: { width: 120 },
  livroCapa: { width: 120, height: 160, objectFit: "cover", borderRadius: 4, marginBottom: 6, backgroundColor: "#EEE" },
  livroTitulo: { fontSize: 10, fontWeight: 700, marginBottom: 2 },
  livroGenero: { fontSize: 9, color: "#666", marginBottom: 2 },
  livroPreco: { fontSize: 10, fontWeight: 700, color: VERDE },
  depoimentosGrid: { flexDirection: "row", flexWrap: "wrap", gap: 14 },
  depoimentoCard: { backgroundColor: "#F6F6F6", borderRadius: 6, padding: 14, marginBottom: 12, width: "47%" },
  depoimentoNome: { fontSize: 11, fontWeight: 700, marginBottom: 2 },
  depoimentoEstrelas: { fontSize: 10, color: "#B8860B", marginBottom: 6 },
  depoimentoTexto: { fontSize: 10, lineHeight: 1.5, color: "#444" },
  contatoLinha: { fontSize: 11, marginBottom: 8, color: "#333" },
  citacao: { fontSize: 15, fontStyle: "italic", lineHeight: 1.7, color: AZUL, marginTop: 32, maxWidth: 480 },
  assinatura: { fontSize: 12, fontWeight: 700, marginTop: 16, color: "#666" },
  rodape: { position: "absolute", bottom: 24, left: 48, right: 48, fontSize: 8, color: "#999", textAlign: "center" },
});

function Rodape() {
  return <Text style={styles.rodape} fixed>Autores Independentes do Brasil · autoresdobrasil.com.br</Text>;
}

export default function PortfolioDocument({ data }: { data: PortfolioData }) {
  const temSobre = Boolean(data.bio || data.formacao || data.premios);
  const temFotos = data.fotos.length > 0;
  const temLivros = data.livros.length > 0;
  const temDepoimentos = data.avaliacoes.length > 0;
  const fotoCapa = data.capaUrl || data.fotoUrl;

  return (
    <Document title={`Portfólio - ${data.nome}`}>
      <Page size="A4" orientation="landscape" style={styles.coverPage}>
        <View style={styles.coverEsquerda}>
          <Text style={styles.coverKicker}>Portfólio Cultural</Text>
          <Text style={styles.coverNome}>{data.nome}</Text>
          {data.cidade && <Text style={styles.coverCidade}>{data.cidade}</Text>}
        </View>
        <View style={styles.coverDireita}>{fotoCapa && <Image src={fotoCapa} style={styles.coverFoto} />}</View>
        <Text style={styles.coverRodape}>Autores Independentes do Brasil</Text>
      </Page>

      {temSobre && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Text style={styles.sectionTitle}>Sobre o autor(a)</Text>
          {data.bio && <Text style={styles.paragraph}>{data.bio}</Text>}
          {data.formacao && (
            <>
              <Text style={styles.subheading}>Formação</Text>
              <Text style={styles.paragraph}>{data.formacao}</Text>
            </>
          )}
          {data.premios && (
            <>
              <Text style={styles.subheading}>Prêmios e conquistas</Text>
              <Text style={styles.paragraph}>{data.premios}</Text>
            </>
          )}
          <Rodape />
        </Page>
      )}

      {temFotos && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Text style={styles.sectionTitle}>Fotos</Text>
          <View style={styles.fotosGrid}>
            {data.fotos.map((f, i) => (
              <Image key={i} src={f.url} style={styles.fotoItem} />
            ))}
          </View>
          <Rodape />
        </Page>
      )}

      {data.obraDestaque && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Text style={styles.sectionTitle}>Obra em destaque</Text>
          <View style={styles.row}>
            {data.obraDestaque.capaUrl && <Image src={data.obraDestaque.capaUrl} style={styles.obraCapa} />}
            <View style={styles.obraInfo}>
              <Text style={styles.obraTitulo}>{data.obraDestaque.titulo}</Text>
              <Text style={styles.obraGenero}>{data.obraDestaque.genero}</Text>
              {data.obraDestaque.descricao && <Text style={styles.paragraph}>{data.obraDestaque.descricao}</Text>}
            </View>
          </View>
          <Rodape />
        </Page>
      )}

      {temLivros && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Text style={styles.sectionTitle}>Livros publicados</Text>
          <View style={styles.livrosGrid}>
            {data.livros.map((livro, i) => (
              <View key={i} style={styles.livroCard}>
                {livro.capaUrl && <Image src={livro.capaUrl} style={styles.livroCapa} />}
                <Text style={styles.livroTitulo}>{livro.titulo}</Text>
                <Text style={styles.livroGenero}>{livro.genero}</Text>
                <Text style={styles.livroPreco}>{brl(livro.precoCentavos)}</Text>
              </View>
            ))}
          </View>
          <Rodape />
        </Page>
      )}

      {temDepoimentos && (
        <Page size="A4" orientation="landscape" style={styles.page}>
          <Text style={styles.sectionTitle}>Depoimentos de leitores</Text>
          <View style={styles.depoimentosGrid}>
            {data.avaliacoes.map((av, i) => (
              <View key={i} style={styles.depoimentoCard}>
                <Text style={styles.depoimentoNome}>{av.nome}</Text>
                <Text style={styles.depoimentoEstrelas}>{"★".repeat(av.estrelas)}{"☆".repeat(5 - av.estrelas)}</Text>
                <Text style={styles.depoimentoTexto}>{av.texto}</Text>
              </View>
            ))}
          </View>
          <Rodape />
        </Page>
      )}

      <Page size="A4" orientation="landscape" style={styles.page}>
        <Text style={styles.sectionTitle}>Contato</Text>
        <Text style={styles.contatoLinha}>E-mail: {data.email}</Text>
        {data.instagramUrl && <Text style={styles.contatoLinha}>Instagram: {data.instagramUrl}</Text>}
        {data.twitterUrl && <Text style={styles.contatoLinha}>Twitter/X: {data.twitterUrl}</Text>}
        {data.siteUrl && <Text style={styles.contatoLinha}>Site: {data.siteUrl}</Text>}

        {data.citacao && (
          <>
            <Text style={styles.citacao}>&ldquo;{data.citacao}&rdquo;</Text>
            <Text style={styles.assinatura}>{data.nome}</Text>
          </>
        )}
        <Rodape />
      </Page>
    </Document>
  );
}
