// Texto do edital do 1º Prêmio Literário Autores do Brasil – 2027, como no formulário oficial.

const itens = (lista: string[]) => (
  <ul style={{ margin: "0 0 12px 20px", padding: 0 }}>
    {lista.map((t) => (
      <li key={t} style={{ marginBottom: "4px" }}>{t}</li>
    ))}
  </ul>
);

const Titulo = ({ children }: { children: React.ReactNode }) => (
  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#002776", margin: "24px 0 8px" }}>{children}</h3>
);

export default function Regulamento() {
  return (
    <div style={{ fontSize: "14px", lineHeight: 1.7, color: "#262626" }}>
      <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#002776", margin: "0 0 4px" }}>1º PRÊMIO LITERÁRIO AUTORES DO BRASIL – 2027</h2>
      <p style={{ fontWeight: 700, margin: "0 0 4px" }}>EDITAL 00252 - 1º PRÊMIO LITERÁRIO AUTORES DO BRASIL – 2027</p>
      <p style={{ fontWeight: 700, margin: "0 0 12px" }}>REGULAMENTO OFICIAL</p>

      <Titulo>1. APRESENTAÇÃO</Titulo>
      <p>O Coletivo Autores Independentes do Brasil, por meio da iniciativa Autores do Brasil, torna público o presente edital de abertura das inscrições para o 1º Prêmio Literário Autores do Brasil – 2027, destinado ao reconhecimento, à valorização e à divulgação da produção literária brasileira.</p>
      <p>O prêmio tem como finalidade incentivar a criação literária, reconhecer novos talentos, valorizar escritores independentes e consagrados e promover a diversidade de expressões, estilos e gêneros da literatura nacional.</p>

      <Titulo>2. OBJETIVOS</Titulo>
      {itens([
        "I – Reconhecer e premiar autores e autoras que se destacam pela qualidade de sua produção literária.",
        "II – Incentivar novos escritores e ampliar oportunidades de reconhecimento.",
        "III – Valorizar a literatura independente e a diversidade da produção editorial brasileira.",
        "IV – Promover a leitura, a escrita e a circulação de obras literárias.",
        "V – Estimular o intercâmbio entre escritores, leitores, editoras e agentes culturais.",
      ])}

      <Titulo>3. DAS CATEGORIAS</Titulo>
      <p>O prêmio contemplará dez categorias:</p>
      <ol style={{ margin: "0 0 12px 20px", padding: 0 }}>
        {["Conto;", "Crônica;", "Escritor(a) Estreante – Poesia;", "Escritor(a) Estreante – Romance;", "Histórias em Quadrinhos;", "Infantil/Juvenil;", "Não ficção / Temas sociais;", "Poesia;", "Romance de Entretenimento;", "Romance Literário."].map((c) => (
          <li key={c}>{c}</li>
        ))}
      </ol>
      <p>Cada inscrição deverá corresponder a uma categoria específica, respeitando as características literárias da obra apresentada.</p>
      <p>O mesmo autor poderá concorrer em mais de uma categoria, desde que realize uma inscrição independente para cada uma delas e efetue o respectivo pagamento.</p>

      <Titulo>4. DAS INSCRIÇÕES</Titulo>
      <p>4.1. As inscrições estarão abertas até o dia 24 de janeiro de 2027.</p>
      <p>4.2. A participação será realizada mediante preenchimento da ficha de inscrição oficial, disponibilizada pelo Autores do Brasil.</p>
      <p>4.3. O valor da inscrição será de R$ 187,00 (cento e oitenta e sete reais) por categoria, pago em parcela única.</p>
      <p>4.4. O pagamento deverá ser realizado exclusivamente via PIX:</p>
      <p style={{ margin: "0 0 12px 20px" }}>
        Chave PIX: <a href="mailto:institutopalavraqueliberta@gmail.com" style={{ color: "#002776", fontWeight: 600 }}>institutopalavraqueliberta@gmail.com</a>
        <br />
        Favorecido: Instituto Palavra que Liberta.
      </p>
      <p>4.5. É de inteira responsabilidade do participante realizar o envio correto e completo dos seguintes arquivos e documentos:</p>
      {itens([
        "I – Arquivo digital do miolo da obra inscrita, contendo o conteúdo integral do livro;",
        "II – Arquivo digital da capa da obra, em sua versão final;",
        "III – Comprovante de pagamento da taxa de inscrição correspondente à categoria escolhida.",
      ])}
      <p>4.6. Os arquivos deverão ser enviados pelo canal oficial indicado pela organização, observando as orientações técnicas e os formatos estabelecidos para o recebimento das inscrições.</p>
      <p>4.7. A ausência de qualquer um dos documentos ou arquivos obrigatórios poderá resultar na desclassificação da inscrição.</p>
      <p>4.8. A organização não se responsabilizará por arquivos corrompidos, incompletos, ilegíveis ou enviados fora do prazo estabelecido.</p>
      <p>4.9. A inscrição somente será considerada efetivada após o preenchimento correto da ficha, o envio dos arquivos obrigatórios e a confirmação do pagamento.</p>
      <p>4.10. A taxa de inscrição corresponde à participação em uma categoria, não sendo permitida sua utilização para concorrer em categorias adicionais.</p>

      <Titulo>5. DO PERÍODO DE PUBLICAÇÃO E DA ELEGIBILIDADE DAS OBRAS</Titulo>
      <p>5.1. Para participar do 1º Prêmio Literário Autores do Brasil – 2027, serão aceitas exclusivamente obras literárias publicadas no período compreendido entre 1º de janeiro de 2024 e 31 de outubro de 2026.</p>
      <p>5.2. Serão consideradas publicadas as obras que possuam edição efetivamente lançada e disponibilizada ao público dentro do período estabelecido neste edital.</p>
      <p>5.3. Não serão aceitas obras publicadas antes de 1º de janeiro de 2024 ou após 31 de outubro de 2026, independentemente de sua inscrição, divulgação, reedição ou participação em outros concursos.</p>
      <p>5.4.1. Em caso de reedição, nova impressão ou atualização de obra anteriormente publicada, será considerada a data da primeira publicação da obra, não sendo a reedição, por si só, suficiente para habilitá-la ao prêmio.</p>
      <p>5.5. É de responsabilidade exclusiva do autor comprovar, quando solicitado pela organização, a data de publicação da obra, mediante apresentação de ISBN, ficha catalográfica, registro editorial, página de comercialização, declaração da editora ou outro documento comprobatório.</p>
      <p>5.6. Obras que não atendam ao período de publicação estabelecido neste regulamento serão automaticamente desclassificadas, independentemente de sua qualidade literária ou do pagamento da taxa de inscrição.</p>

      <Titulo>6. DO PROCESSO DE AVALIAÇÃO</Titulo>
      <p>6.1. As inscrições serão submetidas à análise de uma comissão julgadora, composta por profissionais convidados pela organização, com experiência nas áreas da literatura, produção editorial, crítica literária, educação e cultura.</p>
      <p>6.2. A avaliação considerará aspectos relacionados à qualidade literária, originalidade, criatividade, domínio da linguagem e contribuição cultural da obra.</p>
      <p>6.3. Os critérios específicos de avaliação serão definidos pela comissão julgadora, considerando as particularidades de cada categoria.</p>
      <p>6.4. A comissão julgadora terá autonomia técnica para avaliar as obras inscritas, respeitando os princípios de imparcialidade e transparência.</p>
      <p>6.5. As decisões da comissão julgadora serão fundamentadas nos critérios estabelecidos neste regulamento.</p>

      <Titulo>7. DA PREMIAÇÃO</Titulo>
      <p>Os vencedores de cada categoria receberão:</p>
      {itens([
        "I – Troféu oficial do 1º Prêmio Literário Autores do Brasil – 2027;",
        "II – Certificado oficial de premiação;",
        "III – Reconhecimento público durante a cerimônia oficial de premiação na Bienal Internacional do Livro do Rio de Janeiro – 2027;",
        "IV – Premiação em dinheiro no valor de R$ 3.000,00 (três mil reais) para o vencedor de cada categoria.",
      ])}
      <p>7.1. Serão contemplados dez vencedores, um por categoria, totalizando R$ 30.000,00 em premiações financeiras.</p>
      <p>7.2. A premiação será individual e intransferível.</p>
      <p>7.3. O pagamento da premiação será realizado conforme orientações da organização, mediante identificação e apresentação dos dados necessários pelo vencedor.</p>

      <Titulo>8. DA CERIMÔNIA DE PREMIAÇÃO</Titulo>
      <p>A cerimônia oficial do 1º Prêmio Literário Autores do Brasil – 2027 será realizada nos dias 07 e 08 de setembro de 2027, durante a programação da Bienal Internacional do Livro do Rio de Janeiro, no estande do Coletivo Autores Independentes do Brasil.</p>
      <p>O momento será dedicado ao reconhecimento dos escritores vencedores, à entrega dos troféus e certificados e à celebração da literatura brasileira.</p>
      <p>A programação detalhada das cerimônias será divulgada posteriormente pelos canais oficiais do Autores do Brasil.</p>

      <Titulo>9. DO CRONOGRAMA</Titulo>
      {itens([
        "Abertura das inscrições - 23/11/2027",
        "Encerramento das inscrições - 24/01/2027",
        "Divulgação do resultado preliminar - 15/02/2027",
        "Interposição de recursos - 16/02 a 18/02/2027",
        "Análise dos recursos - 19/02 a 21/02/2027",
        "Divulgação do resultado final - 15/03/2027",
        "Cerimônia de premiação - 07 e 08/09/2027",
      ])}

      <Titulo>10. DOS RECURSOS</Titulo>
      <p>10.1. Os participantes poderão apresentar recurso contra o resultado preliminar no período de 16 a 18 de fevereiro de 2027.</p>
      <p>10.2. Os recursos deverão ser encaminhados pelo canal oficial indicado pela organização, contendo a identificação do participante, a categoria inscrita e a justificativa fundamentada.</p>
      <p>10.3. Não serão aceitos recursos apresentados fora do prazo estabelecido.</p>
      <p>10.4. Os recursos serão analisados pela comissão responsável no período de 19 de fevereiro a 21 de setembro de 2027.</p>
      <p>10.5. Após a conclusão da análise dos recursos, a organização divulgará o resultado definitivo do prêmio pelos seus canais oficiais.</p>
      <p>10.6. As decisões da comissão responsável pelos recursos serão comunicadas oficialmente aos participantes.</p>

      <Titulo>11. DAS RESPONSABILIDADES DOS PARTICIPANTES</Titulo>
      <p>São responsabilidades dos participantes:</p>
      {itens([
        "I – Preencher corretamente todas as informações solicitadas na inscrição.",
        "II – Garantir a autenticidade e a autoria da obra apresentada.",
        "III – Respeitar os direitos autorais e a legislação vigente.",
        "IV – Realizar o pagamento da taxa de inscrição correspondente à categoria escolhida.",
        "V – Encaminhar o arquivo completo do miolo da obra, o arquivo da capa e o comprovante de pagamento.",
        "VI – Garantir que os arquivos enviados estejam completos, legíveis e em condições adequadas para avaliação.",
        "VII – Acompanhar as publicações e comunicados oficiais do prêmio.",
        "VIII – Fornecer informações e documentos complementares quando solicitados pela organização.",
      ])}

      <Titulo>12. DOS DIREITOS AUTORAIS E USO DE IMAGEM</Titulo>
      <p>12.1. Os direitos autorais das obras inscritas permanecerão integralmente com seus respectivos autores.</p>
      <p>12.2. A inscrição não implica cessão de direitos autorais ou transferência de propriedade intelectual à organização.</p>
      <p>12.3. Os participantes autorizam a divulgação de seus nomes, títulos das obras e informações relacionadas à premiação para fins de comunicação institucional e divulgação dos resultados.</p>
      <p>12.4. A utilização de imagens dos participantes durante as cerimônias e atividades de divulgação observará a autorização correspondente.</p>

      <Titulo>13. DAS DISPOSIÇÕES GERAIS</Titulo>
      <p>13.1. A inscrição no 1º Prêmio Literário Autores do Brasil – 2027 implica conhecimento e aceitação das disposições deste edital.</p>
      <p>13.2. Os casos omissos serão analisados e resolvidos pela organização do prêmio.</p>
      <p>13.3. Eventuais alterações neste regulamento serão comunicadas oficialmente pelos canais de divulgação do Autores do Brasil.</p>
      <p>13.4. A organização poderá não conceder premiação em determinada categoria caso não sejam identificadas inscrições que atendam aos requisitos mínimos de qualidade e adequação, mediante justificativa da comissão julgadora.</p>

      <p style={{ marginTop: "24px", fontWeight: 700 }}>AUTORES INDEPENDENTES DO BRASIL</p>
      <p>Organização do 1º Prêmio Literário Autores do Brasil – 2027</p>
    </div>
  );
}
