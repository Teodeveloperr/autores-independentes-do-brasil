import {
  CONTRATADA,
  PACOTES_TEXTO,
  formatarNumeroContrato,
  type FormaPagamentoContrato,
  type PacoteContrato,
} from "./config";

// Texto do contrato como dados: a mesma estrutura alimenta a pré-visualização na tela e o PDF,
// pra os dois nunca ficarem diferentes. O conteúdo das cláusulas é o do contrato feito pelo
// advogado, sem alterações — só foram corrigidos artefatos de extração do PDF original
// ("QU E", "compromete -se", espaços antes de vírgula). Ver TEXTO_VERSAO em config.ts.

export type DadosContratante = {
  tipoPessoa: "fisica" | "juridica";
  nome: string;
  cpfCnpj: string;
  representanteNome: string | null;
  representanteCpf: string | null;
  email: string;
  telefone: string;
  cep: string;
  endereco: string;
  cidade: string;
  uf: string;
};

export type DadosContratoTexto = DadosContratante & {
  numero: number | null;
  pacote: PacoteContrato;
  formaPagamento: FormaPagamentoContrato;
  descontoPercentual: number;
  valorCentavos: number;
};

export type ClausulaContrato = { titulo: string; paragrafos: string[] };

export type ContratoMontado = {
  numeroTexto: string;
  titulo: string;
  abertura: string[];
  contratada: string;
  conectivo: string;
  contratante: string;
  preambuloFinal: string;
  clausulas: ClausulaContrato[];
  fechamento: string;
  assinaturaContratadaNome: string;
};

export function brlMilhar(centavos: number): string {
  return "R$ " + (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatarCpf(valor: string): string {
  const d = valor.replace(/\D/g, "");
  return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : valor;
}

export function formatarCnpj(valor: string): string {
  const d = valor.replace(/\D/g, "");
  return d.length === 14 ? `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}` : valor;
}

export function formatarCep(valor: string): string {
  const d = valor.replace(/\D/g, "");
  return d.length === 8 ? `${d.slice(0, 5)}-${d.slice(5)}` : valor;
}

export function formatarTelefone(valor: string): string {
  const d = valor.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return valor;
}

function qualificarContratante(d: DadosContratante): string {
  const endereco = `${d.endereco}, ${d.cidade}/${d.uf}, CEP ${formatarCep(d.cep)}`;
  const contato = `e-mail ${d.email}, telefone ${formatarTelefone(d.telefone)}`;
  if (d.tipoPessoa === "juridica") {
    const rep = d.representanteNome
      ? `, representada por ${d.representanteNome}, inscrito(a) no CPF sob nº ${formatarCpf(d.representanteCpf ?? "")}`
      : "";
    return `${d.nome}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${formatarCnpj(d.cpfCnpj)}, com sede em ${endereco}, ${contato}${rep}.`;
  }
  return `${d.nome}, inscrito(a) no CPF sob nº ${formatarCpf(d.cpfCnpj)}, residente e domiciliado(a) em ${endereco}, ${contato}.`;
}

function descricaoPagamento(forma: FormaPagamentoContrato, descontoPercentual: number): string {
  const base = forma === "pix" ? "PIX À VISTA" : "CARTÃO DE CRÉDITO À VISTA";
  return descontoPercentual > 0 ? `${base} (${descontoPercentual}% DESCONTO)` : base;
}

export function montarContrato(d: DadosContratoTexto): ContratoMontado {
  const valor = brlMilhar(d.valorCentavos);
  const numeroTexto = d.numero ? formatarNumeroContrato(d.numero) : "SITE-___/BIENALRJ";

  const linhasPacotes = PACOTES_TEXTO.map(
    (p) => `[${p.chave === d.pacote ? "X" : " "}] ${p.rotulo} — ${brlMilhar(p.valorCentavos)}`
  );

  const clausulas: ClausulaContrato[] = [
    {
      titulo: "CLÁUSULA 1ª — DO OBJETO",
      paragrafos: [
        "1.1. O presente contrato tem por objeto a participação do CONTRATANTE na estrutura coletiva dos Autores Independentes do Brasil durante a Bienal do Livro Rio 2027, a ser realizada no Riocentro, Rio de Janeiro/RJ, no período de 03 a 12 de setembro de 2027.",
        "1.2. A participação compreenderá os serviços, espaços, exposição de livros, credenciais, horários de balcão, atividades culturais e demais benefícios correspondentes ao pacote escolhido pelo CONTRATANTE.",
        "1.3. A estrutura coletiva foi planejada com área total de aproximadamente 100 m², contemplando espaço para livraria, exposição, comercialização de livros e programação cultural.",
      ],
    },
    {
      titulo: "CLÁUSULA 2ª — DO PACOTE CONTRATADO",
      paragrafos: [
        "2.1. O CONTRATANTE declara que escolheu o seguinte pacote:",
        ...linhasPacotes,
        "PAGAMENTO:",
        descricaoPagamento(d.formaPagamento, d.descontoPercentual),
        `VALOR: ${valor}`,
        "2.2. O valor indicado corresponde exclusivamente ao investimento de participação no pacote escolhido.",
        "2.3. A eventual taxa administrativa incidente sobre a comercialização dos livros, prevista neste contrato para determinados pacotes, não integra o valor de participação e será calculada separadamente sobre as vendas efetivamente realizadas.",
      ],
    },
    {
      titulo: "CLÁUSULA 3ª — DO PACOTE PREMIUM",
      paragrafos: [
        "3.1. O Pacote Premium possui investimento de R$ 5.500,00 (cinco mil e quinhentos reais).",
        "3.2. O pacote inclui:",
        "a) conjunto de 05 prateleiras;",
        "b) espaço para exposição de até 300 livros;",
        "c) participação durante os 10 dias do evento;",
        "d) credencial de expositor;",
        "e) espaço de estoque com capacidade para até 100 livros;",
        "f) 02 horas de utilização do espaço de auditório;",
        "g) 03 períodos de 02 horas cada para utilização do balcão de exposição e divulgação.",
        "3.3. As condições correspondem à proposta comercial da participação na Bienal do Livro Rio 2027.",
      ],
    },
    {
      titulo: "CLÁUSULA 4ª — DO PACOTE STANDARD",
      paragrafos: [
        "4.1. O Pacote Standard possui investimento de R$ 3.500,00 (três mil e quinhentos reais).",
        "4.2. O pacote inclui:",
        "a) espaço de exposição de até 02 prateleiras;",
        "b) capacidade para exposição de até 120 livros;",
        "c) 03 períodos de balcão de 02 horas cada;",
        "d) 01 credencial de acesso ao evento;",
        "e) 01 hora de utilização do auditório do estande, mediante agendamento prévio.",
        "4.3. Os horários serão definidos conforme a disponibilidade da programação geral.",
        "4.4. Sobre as vendas dos livros do CONTRATANTE realizadas no âmbito do Pacote Standard será aplicada taxa administrativa de 20% (vinte por cento) sobre o valor bruto das vendas.",
        "4.5. Os valores correspondentes à taxa administrativa serão destinados à cobertura dos custos de processamento, administração, operação comercial, controle e gestão das vendas realizadas no estande.",
        "4.6. O valor da taxa administrativa será descontado do montante a ser repassado ao CONTRATANTE.",
        "4.7. A taxa administrativa de 20% não constitui acréscimo ao valor de R$ 3.500,00 referente à contratação do pacote.",
      ],
    },
    {
      titulo: "CLÁUSULA 5ª — DO PACOTE SINGLE",
      paragrafos: [
        "5.1. O Pacote Single possui investimento de R$ 1.600,00 (mil e seiscentos reais).",
        "5.2. O pacote inclui:",
        "a) 01 prateleira para exposição;",
        "b) exposição de até 60 livros;",
        "c) permanência das obras na livraria durante os dias do evento;",
        "d) 04 horas de utilização do balcão, divididas em 02 períodos de 02 horas;",
        "e) 01 credencial de acesso ao evento.",
        "5.3. Os horários de utilização do balcão serão definidos previamente conforme disponibilidade da programação.",
        "5.4. Sobre as vendas dos livros do CONTRATANTE realizadas no âmbito do Pacote Single será aplicada taxa administrativa de 20% (vinte por cento) sobre o valor bruto das vendas.",
        "5.5. Os valores correspondentes à taxa administrativa serão destinados à cobertura dos custos de processamento, administração, operação comercial, controle e gestão das vendas realizadas no estande.",
        "5.6. O valor da taxa administrativa será descontado do montante a ser repassado ao CONTRATANTE.",
        "5.7. A taxa administrativa de 20% não constitui acréscimo ao valor de R$ 1.600,00 referente à contratação do pacote.",
      ],
    },
    {
      titulo: "CLÁUSULA 6ª — DO ESPAÇO DE AUDITÓRIO",
      paragrafos: [
        "6.1. O Espaço de Auditório possui investimento de R$ 1.200,00 (mil e duzentos reais).",
        "6.2. O pacote inclui:",
        "a) 01 hora de utilização do auditório;",
        "b) estrutura de palco;",
        "c) 02 ou 04 cadeiras de palco;",
        "d) painel digital;",
        "e) 02 microfones e sistema de áudio;",
        "f) plateia para até 30 pessoas sentadas;",
        "g) card digital de divulgação;",
        "h) até 04 credenciais para os participantes da atividade.",
        "6.3. A utilização estará condicionada ao agendamento prévio e à disponibilidade da programação.",
      ],
    },
    {
      titulo: "CLÁUSULA 7ª — DO PACOTE LANÇAMENTO",
      paragrafos: [
        "7.1. O Pacote Lançamento possui investimento de R$ 600,00 (seiscentos reais).",
        "7.2. O pacote inclui:",
        "a) exposição de até 40 livros;",
        "b) 02 horas de atividade no estande;",
        "c) realização de lançamento, sessão de autógrafos e comercialização das obras;",
        "d) 01 credencial de acesso;",
        "e) card digital de divulgação.",
        "7.3. A atividade será realizada em data e horário previamente definidos pela organização.",
      ],
    },
    {
      titulo: "CLÁUSULA 8ª — DA COMERCIALIZAÇÃO DOS LIVROS",
      paragrafos: [
        "8.1. Os livros disponibilizados pelo CONTRATANTE para exposição e comercialização deverão ser devidamente identificados e relacionados para fins de controle.",
        "8.2. A comercialização será realizada dentro da estrutura dos Autores Independentes do Brasil, observando os procedimentos administrativos e operacionais definidos pela CONTRATADA.",
        "8.3. O CONTRATANTE será responsável pelas informações relativas às suas obras, incluindo título, autoria, preço de venda, ISBN, quantidade disponibilizada e demais informações necessárias.",
        "8.4. O controle das vendas será realizado pela CONTRATADA por meio dos mecanismos administrativos e operacionais disponíveis durante o evento.",
        "8.5. O CONTRATANTE terá direito ao recebimento dos valores correspondentes às vendas efetivamente registradas, descontadas as taxas previstas neste contrato e eventuais valores previamente autorizados.",
      ],
    },
    {
      titulo: "CLÁUSULA 9ª — DA TAXA ADMINISTRATIVA DE 20% SOBRE AS VENDAS",
      paragrafos: [
        "9.1. Para os participantes dos Pacotes Standard e Single, será aplicada uma taxa administrativa de 20% (vinte por cento) sobre o valor bruto de cada venda de livro realizada no âmbito da estrutura comercial dos Autores Independentes do Brasil durante a Bienal.",
        "9.2. A título exemplificativo, em uma venda de livro no valor de R$ 50,00, será aplicada a seguinte composição:",
        "Valor bruto da venda: R$ 50,00",
        "Taxa administrativa — 20%: R$ 10,00",
        "Valor destinado ao CONTRATANTE: R$ 40,00",
        "9.3. A taxa administrativa será aplicada exclusivamente sobre as vendas efetivamente realizadas e registradas.",
        "9.4. A taxa administrativa não será cobrada sobre o valor de contratação do pacote.",
        "9.5. A taxa administrativa também não representa aumento do investimento contratado para participação na Bienal.",
        "9.6. O CONTRATANTE declara estar ciente e de acordo com essa condição no momento da contratação dos Pacotes Standard ou Single.",
      ],
    },
    {
      titulo: "CLÁUSULA 10ª — DO REPASSE DAS VENDAS",
      paragrafos: [
        "10.1. O repasse dos valores referentes às vendas realizadas será efetuado após a consolidação e conferência dos registros de comercialização.",
        "10.2. O prazo estimado para o repasse será de até 15 dias úteis após o encerramento da Bienal e a conclusão da conferência financeira.",
        "10.4. Eventuais divergências identificadas na conferência deverão ser comunicadas à CONTRATADA para análise e conciliação.",
      ],
    },
    {
      titulo: "CLÁUSULA 11ª — DAS CONDIÇÕES DE PAGAMENTO DO PACOTE",
      paragrafos: [`11.1. O valor do pacote escolhido será: ${valor}`],
    },
    {
      titulo: "CLÁUSULA 12ª — DA DESISTÊNCIA E CANCELAMENTO",
      paragrafos: [
        "12.1. Em razão dos compromissos financeiros, reservas, estrutura, planejamento, logística, organização e demais custos assumidos para a participação na Bienal, a desistência do CONTRATANTE estará sujeita às seguintes condições:",
        "I — DESISTÊNCIA COM MAIS DE 90 DIAS DE ANTECEDÊNCIA: multa contratual correspondente a 50% (cinquenta por cento) do valor total contratado.",
        "II — DESISTÊNCIA DENTRO DOS 90 DIAS QUE ANTECEDEM O EVENTO: multa contratual correspondente a 100% (cem por cento) do valor total contratado.",
        "12.2. Considerando que o início previsto da Bienal é 03 de setembro de 2027, a regra dos 90 dias será calculada tomando essa data como referência.",
        "12.3. A desistência deverá ser comunicada formalmente por escrito à CONTRATADA.",
        "12.4. Caso o CONTRATANTE tenha realizado pagamentos superiores ao valor da multa aplicável, será apurado eventual saldo remanescente.",
        "12.5. Caso os pagamentos realizados sejam inferiores ao valor da multa aplicável, o CONTRATANTE deverá complementar o valor correspondente.",
        "12.6. A simples ausência do CONTRATANTE durante a Bienal, sem comunicação formal de cancelamento, será considerada desistência e sujeita às condições previstas nesta cláusula.",
      ],
    },
    {
      titulo: "CLÁUSULA 13ª — DAS OBRIGAÇÕES DA CONTRATADA",
      paragrafos: [
        "13.1. São obrigações da CONTRATADA:",
        "a) organizar a participação coletiva;",
        "b) disponibilizar a estrutura correspondente ao pacote contratado;",
        "c) organizar os espaços de exposição;",
        "d) organizar a programação cultural;",
        "e) administrar os horários de balcão e auditório;",
        "f) realizar o controle administrativo das vendas quando aplicável;",
        "g) realizar a prestação de contas das vendas realizadas;",
        "h) efetuar os repasses devidos aos participantes após a conferência dos valores.",
      ],
    },
    {
      titulo: "CLÁUSULA 14ª — DAS OBRIGAÇÕES DO CONTRATANTE",
      paragrafos: [
        "14.1. São obrigações do CONTRATANTE:",
        "a) realizar os pagamentos nas datas estabelecidas;",
        "b) fornecer informações corretas sobre seus livros;",
        "c) entregar os exemplares dentro dos prazos estabelecidos;",
        "d) respeitar as regras da Bienal e do espaço coletivo;",
        "e) cumprir os horários previamente agendados;",
        "f) responsabilizar-se pela regularidade editorial e autoral das obras;",
        "g) fornecer os dados bancários necessários para eventual repasse;",
        "h) informar qualquer alteração cadastral à CONTRATADA.",
      ],
    },
    {
      titulo: "CLÁUSULA 15ª — DA RESPONSABILIDADE SOBRE AS OBRAS",
      paragrafos: [
        "15.1. O CONTRATANTE declara ser responsável pela legitimidade e regularidade das obras disponibilizadas para exposição e comercialização.",
        "15.2. A CONTRATADA não será responsável por questões relacionadas à titularidade, direitos autorais, ISBN, conteúdo, edição, impressão ou regularidade jurídica das obras fornecidas pelo CONTRATANTE.",
        "15.3. Eventuais reclamações de terceiros relacionadas às obras serão de responsabilidade do CONTRATANTE, quando decorrentes de fatos a ele atribuíveis.",
      ],
    },
    {
      titulo: "CLÁUSULA 16ª — DA PROGRAMAÇÃO",
      paragrafos: [
        "16.1. Os horários de balcão, auditório, lançamento e demais atividades serão previamente organizados pela CONTRATADA.",
        "16.2. A definição dos horários observará a disponibilidade do espaço e a programação geral do estande.",
        "16.3. Eventuais alterações necessárias à organização do evento poderão ser realizadas pela CONTRATADA, mediante comunicação aos participantes.",
        "16.4. O não comparecimento do CONTRATANTE no horário previamente agendado não dará direito automático à restituição ou compensação do período não utilizado.",
      ],
    },
    {
      titulo: "CLÁUSULA 17ª — DA ALTERAÇÃO DA PROGRAMAÇÃO OU DO EVENTO",
      paragrafos: [
        "17.1. Alterações de datas, horários, regras de acesso, programação ou estrutura determinadas pela organização oficial da Bienal serão comunicadas aos participantes tão logo sejam informadas à CONTRATADA.",
        "17.2. A CONTRATADA não será responsabilizada por alterações determinadas exclusivamente pela organização oficial do evento ou por autoridades competentes, desde que não decorram de ação ou omissão comprovadamente atribuível à CONTRATADA.",
      ],
    },
    {
      titulo: "CLÁUSULA 18ª — DO USO DE NOME E MATERIAL DE DIVULGAÇÃO",
      paragrafos: [
        "18.1. O CONTRATANTE autoriza a utilização de seu nome artístico ou profissional, título das obras, imagens de divulgação e demais informações fornecidas para divulgação de sua participação na Bienal.",
        "18.2. A autorização será utilizada para fins institucionais, promocionais e de divulgação relacionados à participação no projeto.",
      ],
    },
    {
      titulo: "CLÁUSULA 19ª — DA AUSÊNCIA DE GARANTIA DE VENDAS",
      paragrafos: [
        "19.1. A contratação de qualquer pacote não garante ao CONTRATANTE quantidade mínima de vendas, faturamento, público, leitores ou resultado comercial.",
        "19.2. A CONTRATADA compromete-se com a disponibilização da estrutura e dos serviços previstos no pacote contratado, não sendo responsável pelo desempenho comercial individual de cada autor.",
      ],
    },
    {
      titulo: "CLÁUSULA 20ª — DA VIGÊNCIA",
      paragrafos: [
        "20.1. O presente contrato entra em vigor na data de sua assinatura e permanecerá válido até o cumprimento integral das obrigações assumidas pelas partes.",
        "20.2. As obrigações financeiras e de prestação de contas permanecerão vigentes até sua completa liquidação.",
      ],
    },
    {
      titulo: "CLÁUSULA 21ª — DAS DISPOSIÇÕES GERAIS",
      paragrafos: [
        "21.1. A proposta comercial da participação na Bienal do Livro Rio 2027 integra o presente contrato como referência para as características dos pacotes.",
        "21.2. Em caso de divergência entre a proposta comercial e este contrato, prevalecerão as condições expressamente estabelecidas neste instrumento.",
        "21.3. Qualquer alteração deste contrato deverá ser realizada por escrito.",
        "21.4. A contratação do pacote implica a ciência e concordância do CONTRATANTE com todas as condições estabelecidas neste instrumento.",
      ],
    },
    {
      titulo: "CLÁUSULA 22ª — DO FORO",
      paragrafos: [
        "22.1. Fica eleito o foro da comarca de Eusébio, Estado do Ceará, para dirimir quaisquer dúvidas ou controvérsias decorrentes deste contrato, ressalvados os direitos assegurados pela legislação aplicável.",
      ],
    },
  ];

  return {
    numeroTexto,
    titulo: "CONTRATO DE PARTICIPAÇÃO NA BIENAL DO LIVRO RIO 2027",
    abertura: ["Pelo presente instrumento particular, de um lado:"],
    contratada: `CONTRATADA: ${CONTRATADA.nomeFantasia}, pessoa jurídica de direito privado, inscrita no CNPJ sob nº ${CONTRATADA.cnpj}, com sede na ${CONTRATADA.endereco}, doravante denominada simplesmente CONTRATADA, neste ato representada por ${CONTRATADA.representante};`,
    conectivo: "e, de outro lado:",
    contratante: `CONTRATANTE/PARTICIPANTE: ${qualificarContratante(d)}`,
    preambuloFinal:
      "têm entre si justo e contratado o presente CONTRATO DE PARTICIPAÇÃO NA BIENAL DO LIVRO RIO 2027, mediante as cláusulas e condições seguintes.",
    clausulas,
    fechamento: "E por estarem de acordo, as partes assinam o presente instrumento.",
    assinaturaContratadaNome: CONTRATADA.razaoSocial,
  };
}

/** Texto corrido do contrato, usado só pra gerar o código de verificação do documento. */
export function textoPlanoDoContrato(c: ContratoMontado): string {
  return [
    c.numeroTexto,
    c.titulo,
    ...c.abertura,
    c.contratada,
    c.conectivo,
    c.contratante,
    c.preambuloFinal,
    ...c.clausulas.flatMap((cl) => [cl.titulo, ...cl.paragrafos]),
    c.fechamento,
  ].join("\n");
}
