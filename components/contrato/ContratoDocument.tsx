/* eslint-disable jsx-a11y/alt-text -- react-pdf's <Image> is a PDF primitive, not an HTML <img> */
import { Document, Page, View, Text, Image, StyleSheet, Font } from "@react-pdf/renderer";
import type { ContratoMontado } from "@/lib/contrato/texto";

// Sem hifenização automática: ela quebrava palavras (e e-mails) no meio da linha.
Font.registerHyphenationCallback((palavra) => [palavra]);

export type ComprovacaoAssinatura = {
  nomeSignatario: string;
  documento: string;
  email: string;
  assinadoEmTexto: string;
  ip: string;
  dispositivo: string;
  frasesAceite: string;
  codigoVerificacao: string;
  versaoTexto: string;
};

export type ContratoDocumentProps = {
  contrato: ContratoMontado;
  assinaturaContratantePng: string | null;
  assinaturaContratadaPng: string | null;
  nomeContratante: string;
  comprovacao: ComprovacaoAssinatura | null;
};

const AZUL = "#002776";

const styles = StyleSheet.create({
  page: { paddingTop: 52, paddingBottom: 56, paddingHorizontal: 56, fontSize: 10, color: "#1c1c1c", fontFamily: "Helvetica", lineHeight: 1.45 },
  numero: { fontSize: 9, color: "#555", marginBottom: 6 },
  titulo: { fontSize: 13, fontWeight: 700, color: AZUL, textAlign: "center", marginBottom: 14 },
  paragrafo: { marginBottom: 6, textAlign: "justify" },
  paragrafoItem: { marginBottom: 3, textAlign: "justify", paddingLeft: 18 },
  paragrafoLinha: { marginBottom: 2 },
  rotulo: { fontWeight: 700 },
  clausula: { marginTop: 10, marginBottom: 6, fontSize: 10.5, fontWeight: 700, color: AZUL },
  assinaturas: { marginTop: 26, flexDirection: "row", justifyContent: "space-between", gap: 24 },
  assinaturaBloco: { width: "47%", alignItems: "center" },
  assinaturaImagem: { height: 54, width: 160, objectFit: "contain" },
  assinaturaVazia: { height: 54 },
  assinaturaLinha: { borderTopWidth: 1, borderTopColor: "#333", width: "100%", marginTop: 2, paddingTop: 4, textAlign: "center", fontSize: 9 },
  comprovacao: { marginTop: 22, borderWidth: 1, borderColor: "#BBB", borderRadius: 4, padding: 10, backgroundColor: "#F7F7F7", fontSize: 8.5 },
  comprovacaoTitulo: { fontWeight: 700, color: AZUL, marginBottom: 4, fontSize: 9.5 },
  comprovacaoLinha: { marginBottom: 2 },
  rodape: { position: "absolute", bottom: 26, left: 56, right: 56, flexDirection: "row", justifyContent: "space-between", fontSize: 8, color: "#777" },
});

function estiloParagrafo(texto: string) {
  if (/^[a-z]\) /.test(texto)) return styles.paragrafoItem;
  if (/^\[[ X]\] /.test(texto) || /^(PAGAMENTO:|VALOR:|PIX|CARTÃO|Valor |Taxa )/.test(texto)) return styles.paragrafoLinha;
  return styles.paragrafo;
}

export default function ContratoDocument({ contrato, assinaturaContratantePng, assinaturaContratadaPng, nomeContratante, comprovacao }: ContratoDocumentProps) {
  return (
    <Document title={`Contrato ${contrato.numeroTexto}`} author="Autores Independentes do Brasil" subject={contrato.titulo}>
      <Page size="A4" style={styles.page}>
        <Text style={styles.numero}>CONTRATO: {contrato.numeroTexto}</Text>
        <Text style={styles.titulo}>{contrato.titulo}</Text>

        {contrato.abertura.map((t) => (
          <Text key={t} style={styles.paragrafo}>{t}</Text>
        ))}
        <Text style={styles.paragrafo}>{contrato.contratada}</Text>
        <Text style={styles.paragrafo}>{contrato.conectivo}</Text>
        <Text style={styles.paragrafo}>{contrato.contratante}</Text>
        <Text style={styles.paragrafo}>{contrato.preambuloFinal}</Text>

        {contrato.clausulas.map((c) => (
          <View key={c.titulo}>
            <Text style={styles.clausula} minPresenceAhead={40}>{c.titulo}</Text>
            {c.paragrafos.map((p, i) => (
              <Text key={i} style={estiloParagrafo(p)}>{p}</Text>
            ))}
          </View>
        ))}

        <View wrap={false}>
          <Text style={[styles.paragrafo, { marginTop: 12 }]}>{contrato.fechamento}</Text>
          <View style={styles.assinaturas}>
            <View style={styles.assinaturaBloco}>
              {assinaturaContratantePng ? <Image src={assinaturaContratantePng} style={styles.assinaturaImagem} /> : <View style={styles.assinaturaVazia} />}
              <Text style={styles.assinaturaLinha}>{nomeContratante}{"\n"}CONTRATANTE</Text>
            </View>
            <View style={styles.assinaturaBloco}>
              {assinaturaContratadaPng ? <Image src={assinaturaContratadaPng} style={styles.assinaturaImagem} /> : <View style={styles.assinaturaVazia} />}
              <Text style={styles.assinaturaLinha}>{contrato.assinaturaContratadaNome}{"\n"}CONTRATADA</Text>
            </View>
          </View>

          {comprovacao && (
            <View style={styles.comprovacao}>
              <Text style={styles.comprovacaoTitulo}>COMPROVAÇÃO DA ASSINATURA ELETRÔNICA</Text>
              <Text style={styles.comprovacaoLinha}>Assinante: {comprovacao.nomeSignatario} (documento {comprovacao.documento})</Text>
              <Text style={styles.comprovacaoLinha}>E-mail confirmado por código: {comprovacao.email}</Text>
              <Text style={styles.comprovacaoLinha}>Data e hora (horário de Brasília): {comprovacao.assinadoEmTexto}</Text>
              <Text style={styles.comprovacaoLinha}>Endereço IP: {comprovacao.ip}</Text>
              <Text style={styles.comprovacaoLinha}>Dispositivo: {comprovacao.dispositivo}</Text>
              <Text style={styles.comprovacaoLinha}>Declaração de aceite: {comprovacao.frasesAceite}</Text>
              <Text style={styles.comprovacaoLinha}>Versão do texto: {comprovacao.versaoTexto}</Text>
              <Text style={styles.comprovacaoLinha}>Código de verificação do documento (SHA-256): {comprovacao.codigoVerificacao}</Text>
            </View>
          )}
        </View>

        <View style={styles.rodape} fixed>
          <Text>Contrato {contrato.numeroTexto}</Text>
          <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
