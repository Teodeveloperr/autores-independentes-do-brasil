import "server-only";
import { Resend } from "resend";
import { brl } from "@/lib/format";
import { formatarReais, type ResultadoPreco } from "@/lib/precoImpressao";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || "Autores Independentes do Brasil <contato@autoresdobrasil.com.br>";
const EMAIL_CONTATO = process.env.EMAIL_CONTATO || "contato@autoresdobrasil.com.br";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Redefinição de senha — Autores Independentes do Brasil",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Redefinir sua senha</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Recebemos um pedido para redefinir a senha da sua conta no Autores Independentes do Brasil.
          Clique no botão abaixo para escolher uma nova senha. Este link expira em 1 hora.
        </p>
        <p style="margin-top: 32px;">
          <a href="${resetUrl}"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Redefinir minha senha
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Se você não pediu essa redefinição, pode ignorar este e-mail com segurança — sua senha continua a mesma.
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 16px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

export async function sendAccountCreatedEmail(to: string, nome: string, plano: string, setupUrl: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Sua conta foi criada — Autores Independentes do Brasil",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Bem-vindo(a), ${nome}!</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          A equipe do Autores Independentes do Brasil criou uma conta de autor(a) pra você, no plano
          <b>${plano}</b>. Falta só um passo: defina sua senha pra acessar o painel.
        </p>
        <p style="margin-top: 32px;">
          <a href="${setupUrl}"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Definir minha senha
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Este link expira em 1 hora. Se preferir, você também pode entrar com sua conta do Google usando o
          mesmo e-mail (${to}).
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 16px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, nome: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Bem-vindo(a) ao Autores Independentes do Brasil!",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Bem-vindo(a), ${nome}!</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Seu cadastro no Autores Independentes do Brasil foi concluído com sucesso.
          Agora você faz parte de um coletivo que valoriza autores independentes e leva
          suas histórias ainda mais longe.
        </p>
        <p style="font-size: 15px; line-height: 1.6;">
          Acesse seu painel para completar seu perfil, publicar seus livros e começar a
          se conectar com leitores de todo o Brasil.
        </p>
        <p style="margin-top: 32px;">
          <a href="${SITE_URL}/painel"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Acessar meu painel
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

export type OrderConfirmationItem = { titulo: string; autorNome: string; quantidade: number; precoCentavos: number; ebook?: boolean };

export async function sendOrderConfirmationEmail(
  to: string,
  data: { itens: OrderConfirmationItem[]; freteCentavos: number; totalCentavos: number }
) {
  const temEbook = data.itens.some((i) => i.ebook);
  const temFisico = data.itens.some((i) => !i.ebook);
  const linhasItens = data.itens
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #F0F0F0;">
            ${escaparHtml(i.titulo)} ${i.ebook ? `<span style="color:#999;">(e-book)</span>` : `<span style="color:#999;">×${i.quantidade}</span>`}
            <br/><span style="font-size:12px;color:#999;">${escaparHtml(i.autorNome)}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #F0F0F0;text-align:right;white-space:nowrap;">${brl(i.precoCentavos * i.quantidade)}</td>
        </tr>`
    )
    .join("");

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Pagamento confirmado — Autores Independentes do Brasil",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Pagamento confirmado!</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Recebemos o pagamento do seu pedido. Obrigado por apoiar autores independentes!
          ${temFisico ? "O(s) autor(es) foram avisados e vão providenciar o envio do(s) livro(s) físico(s) — você receberá um e-mail quando for enviado." : ""}
          ${temEbook ? "Os e-books já estão liberados: você recebe, em outro e-mail, o acesso à sua estante." : ""}
        </p>
        <table style="width:100%;border-collapse:collapse;margin-top:24px;font-size:14px;">
          ${linhasItens}
          ${
            data.freteCentavos > 0
              ? `<tr><td style="padding:8px 0;color:#666;">Frete</td><td style="padding:8px 0;text-align:right;color:#666;">${brl(data.freteCentavos)}</td></tr>`
              : ""
          }
          <tr>
            <td style="padding:12px 0 0;font-weight:bold;">Total</td>
            <td style="padding:12px 0 0;text-align:right;font-weight:bold;color:#002776;">${brl(data.totalCentavos)}</td>
          </tr>
        </table>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

export type NewSaleItem = { titulo: string; quantidade: number; precoCentavos: number; ebook?: boolean };

export async function sendNewSaleEmail(
  to: string,
  data: {
    comprador: string;
    compradorEmail: string;
    compradorTelefone: string | null;
    // null quando a venda do autor é só de e-book (nada a enviar).
    endereco: string | null;
    itens: NewSaleItem[];
    freteCentavos: number | null;
    freteServico: string | null;
  }
) {
  const linhasItens = data.itens
    .map((i) => `<li>${escaparHtml(i.titulo)}${i.ebook ? " (e-book)" : ` ×${i.quantidade}`} — ${brl(i.precoCentavos * i.quantidade)}</li>`)
    .join("");

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Você tem uma nova venda! — Autores Independentes do Brasil",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Você tem uma nova venda! 🎉</h1>
        <p style="font-size: 15px; line-height: 1.6;"><b>${escaparHtml(data.comprador)}</b> acabou de comprar:</p>
        <ul style="font-size: 15px; line-height: 1.8; padding-left: 20px;">${linhasItens}</ul>
        ${
          data.freteCentavos
            ? `<p style="font-size:15px;">Frete: ${brl(data.freteCentavos)}${data.freteServico ? ` (${data.freteServico})` : ""}</p>`
            : ""
        }
        <p style="font-size: 15px; line-height: 1.6; margin-top:16px;">
          <b>Contato do comprador:</b><br/>
          E-mail: ${data.compradorEmail}${data.compradorTelefone ? `<br/>Telefone: ${data.compradorTelefone}` : ""}
        </p>
        ${
          data.endereco
            ? `<p style="font-size: 15px; line-height: 1.6;">
          <b>Endereço de entrega:</b><br/>
          ${escaparHtml(data.endereco)}
        </p>`
            : `<p style="font-size: 15px; line-height: 1.6;">O e-book já foi liberado ao leitor automaticamente — não há nada a enviar.</p>`
        }
        <p style="margin-top: 32px;">
          <a href="${SITE_URL}/painel"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Ver no painel
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          ${data.endereco ? "O pagamento já foi confirmado. Envie o(s) livro(s) físico(s) para o endereço acima e atualize o pedido no painel." : "O repasse do e-book é feito assim que o valor fica disponível na Asaas."}
        </p>
      </div>
    `,
  });
}

export async function sendConfirmacaoRecebimentoEmail(
  to: string,
  data: { livro: string; autorNome: string; confirmarUrl: string }
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Seu pedido foi enviado! Confirme o recebimento",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Seu pedido foi enviado! 📦</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          <b>${data.autorNome}</b> marcou seu pedido de <b>${data.livro}</b> como enviado.
          Quando o livro chegar, clique no botão abaixo pra confirmar o recebimento —
          isso libera o repasse do valor para o autor.
        </p>
        <p style="margin-top: 32px;">
          <a href="${data.confirmarUrl}"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Recebi meu pedido
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Se você não confirmar, liberamos automaticamente em até 7 dias.
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 16px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

export async function sendNovaCobrancaAssinaturaEmail(
  to: string,
  data: { planoNome: string; valorCentavos: number; invoiceUrl: string; dueDate: string }
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Nova cobrança da sua assinatura ${data.planoNome}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Nova cobrança disponível</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Chegou a hora de renovar sua assinatura <b>${data.planoNome}</b>: ${brl(data.valorCentavos)},
          com vencimento em ${data.dueDate}. Pague pelo link abaixo pra manter seu plano ativo.
        </p>
        <p style="margin-top: 32px;">
          <a href="${data.invoiceUrl}"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Pagar assinatura
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Se o pagamento não for feito até o vencimento, seu plano é rebaixado automaticamente para o Iniciante.
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 16px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

export async function sendPlanoParceladoVencendoEmail(
  to: string,
  data: { planoNome: string; dataVencimento: string; renovarUrl: string }
) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Seu plano ${data.planoNome} está vencendo`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Seu plano está perto de vencer</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Seu plano <b>${data.planoNome}</b> (contratado parcelado no cartão) vale até <b>${data.dataVencimento}</b>.
          Como não é uma assinatura recorrente, ele não renova sozinho — pra continuar com acesso ao plano
          depois dessa data, renove gerando uma nova cobrança parcelada.
        </p>
        <p style="margin-top: 32px;">
          <a href="${data.renovarUrl}"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Renovar meu plano
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Se não renovar até o vencimento, seu plano volta automaticamente para o Iniciante.
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 16px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

export async function sendContactFormEmail(data: { nome: string; email: string; assunto: string; mensagem: string }) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: EMAIL_CONTATO,
    replyTo: data.email,
    subject: `[Fale conosco] ${data.assunto || "Nova mensagem do site"}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h2 style="color: #002776;">Nova mensagem pelo formulário de contato</h2>
        <p><b>Nome:</b> ${data.nome}</p>
        <p><b>E-mail:</b> ${data.email}</p>
        <p><b>Assunto:</b> ${data.assunto || "—"}</p>
        <p><b>Mensagem:</b></p>
        <p style="white-space: pre-wrap; background:#F6F6F6; padding:16px; border-radius:8px;">${data.mensagem}</p>
      </div>
    `,
  });
}

function escaparHtml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Os envios do contrato conferem o resultado: o Resend devolve { error } em vez de lançar,
// e quem chama precisa saber se o e-mail realmente saiu (o código de confirmação, por exemplo).
async function enviarEOuFalhar(args: Parameters<typeof resend.emails.send>[0]) {
  const { error } = await resend.emails.send(args);
  if (error) throw new Error(`Resend: ${error.message}`);
}

export async function sendContratoCodigoEmail(to: string, nome: string, codigo: string) {
  await enviarEOuFalhar({
    from: EMAIL_FROM,
    to,
    subject: `Seu código de confirmação: ${codigo}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Confirme seu e-mail</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Olá, ${escaparHtml(nome)}. Use o código abaixo para continuar a contratação da participação na Bienal do Livro Rio 2027.
          Ele vale por 15 minutos.
        </p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #002776; margin: 24px 0;">${codigo}</p>
        <p style="font-size: 13px; color: #666;">
          Se você não pediu este código, pode ignorar este e-mail.
        </p>
      </div>
    `,
  });
}

export type ContratoEmailInfo = {
  numeroTexto: string;
  nome: string;
  email: string;
  pacoteNome: string;
  formaPagamentoRotulo: string;
  valorCentavos: number;
};

export async function sendContratoAssinadoAvisoEmail(info: ContratoEmailInfo) {
  await enviarEOuFalhar({
    from: EMAIL_FROM,
    to: EMAIL_CONTATO,
    subject: `Novo contrato assinado ${info.numeroTexto}, aguardando pagamento`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h2 style="color: #002776;">Novo contrato assinado</h2>
        <p><b>Contrato:</b> ${escaparHtml(info.numeroTexto)}</p>
        <p><b>Contratante:</b> ${escaparHtml(info.nome)} (${escaparHtml(info.email)})</p>
        <p><b>Pacote:</b> ${escaparHtml(info.pacoteNome)}</p>
        <p><b>Pagamento:</b> ${escaparHtml(info.formaPagamentoRotulo)}, ${brl(info.valorCentavos)}</p>
        <p style="font-size: 13px; color: #666;">O contrato está aguardando o pagamento. Você será avisado quando for confirmado.</p>
      </div>
    `,
  });
}

export async function sendContratoAguardandoPagamentoEmail(to: string, info: ContratoEmailInfo, acompanharUrl: string) {
  await enviarEOuFalhar({
    from: EMAIL_FROM,
    to,
    subject: `Seu contrato ${info.numeroTexto} foi assinado: falta o pagamento`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Contrato assinado</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Olá, ${escaparHtml(info.nome)}. Você assinou o contrato <b>${escaparHtml(info.numeroTexto)}</b> da Bienal do Livro Rio 2027,
          pacote ${escaparHtml(info.pacoteNome)}, no valor de ${brl(info.valorCentavos)} (${escaparHtml(info.formaPagamentoRotulo)}).
          Falta só o pagamento para garantir a sua participação e os horários escolhidos, que ficam reservados por 24 horas.
        </p>
        <p style="margin-top: 28px;">
          <a href="${acompanharUrl}"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Ir para o pagamento
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 28px;">
          Guarde este e-mail: o link acima leva ao seu contrato e ao pagamento, mesmo se você fechar a página.
          Depois de pago, o contrato em PDF chega no seu e-mail.
        </p>
      </div>
    `,
  });
}

export async function sendContratoPagoEmail(
  to: string,
  info: ContratoEmailInfo,
  opcoes: { pdf: Buffer; agenda: string[]; paraContratada: boolean }
) {
  const agenda = opcoes.agenda.length
    ? `<p style="font-size: 15px; line-height: 1.6;"><b>Horários escolhidos:</b></p><ul style="font-size: 14px; line-height: 1.7;">${opcoes.agenda
        .map((l) => `<li>${escaparHtml(l)}</li>`)
        .join("")}</ul>`
    : "";
  await enviarEOuFalhar({
    from: EMAIL_FROM,
    to,
    subject: opcoes.paraContratada
      ? `Contrato ${info.numeroTexto} pago`
      : `Seu contrato ${info.numeroTexto} da Bienal do Livro Rio 2027`,
    attachments: [{ filename: `Contrato ${info.numeroTexto.replace("/", "-")}.pdf`, content: opcoes.pdf }],
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">${opcoes.paraContratada ? "Contrato pago" : "Pagamento confirmado"}</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          ${
            opcoes.paraContratada
              ? `O contrato <b>${escaparHtml(info.numeroTexto)}</b> de ${escaparHtml(info.nome)} (${escaparHtml(info.email)}) foi pago.`
              : `Obrigado, ${escaparHtml(info.nome)}! Recebemos o pagamento do seu contrato <b>${escaparHtml(info.numeroTexto)}</b>, pacote ${escaparHtml(info.pacoteNome)}, no valor de ${brl(info.valorCentavos)}.`
          }
          O contrato assinado segue em PDF anexo a este e-mail.
        </p>
        ${agenda}
        <p style="font-size: 13px; color: #666; margin-top: 24px;">
          Para trocar algum horário, entre em contato com o Autores Independentes do Brasil em ${EMAIL_CONTATO}.
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 16px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

/**
 * E-mail enviado ao leitor quando um e-book é liberado. No primeiro acesso traz o link para criar
 * a senha; depois, o endereço para entrar na estante.
 */
export async function sendLeitorAcessoEmail(to: string, info: { nome: string | null; livros: string[]; url: string; primeiroAcesso: boolean }) {
  const saudacao = info.nome ? `Olá, ${escaparHtml(info.nome.split(" ")[0])}!` : "Olá!";
  const varios = info.livros.length > 1;
  const livros = info.livros.map((l) => `<strong>${escaparHtml(l)}</strong>`).join(", ");
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `${varios ? "Seus e-books estão liberados" : `Seu e-book "${info.livros[0]}" está liberado`} — Autores Independentes do Brasil`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">${saudacao} ${varios ? "Seus e-books estão liberados" : "Seu e-book está liberado"}</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Obrigado pela compra de ${livros}. Você pode ler ${varios ? "os livros direto" : "o livro direto"} na plataforma, em
          <strong>Minha estante</strong>, em até 2 aparelhos ao mesmo tempo.
        </p>
        ${
          info.primeiroAcesso
            ? `<p style="font-size: 15px; line-height: 1.6;">Para começar, crie a sua senha de acesso. O link vale por 7 dias.</p>`
            : `<p style="font-size: 15px; line-height: 1.6;">Entre com o seu e-mail e a sua senha.</p>`
        }
        <p style="margin-top: 32px;">
          <a href="${info.url}"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            ${info.primeiroAcesso ? "Criar minha senha e ler" : "Ir para a minha estante"}
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Cada página do e-book leva o seu nome e e-mail como identificação. O acesso é pessoal e não pode ser compartilhado.
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 16px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

/** E-mail com o link para o leitor criar ou refazer a senha (recuperação). */
export async function sendLeitorSenhaEmail(to: string, url: string) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Sua senha de leitor — Autores Independentes do Brasil",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Criar ou refazer a sua senha</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Recebemos um pedido para criar ou refazer a senha de acesso aos seus e-books no Autores Independentes do Brasil.
          Clique no botão abaixo para escolher a senha. Este link expira em 1 hora e só pode ser usado uma vez.
        </p>
        <p style="margin-top: 32px;">
          <a href="${url}"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Escolher minha senha
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Se você não pediu isso, pode ignorar este e-mail com segurança: nada será alterado.
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 16px;">
          Coletivo de escritores valorizando histórias, conectando pessoas.
        </p>
      </div>
    `,
  });
}

// ── Pedido de impressão de livro ("Imprimir meu livro") ─────────────────────────────────────────

export type PedidoImpressaoEmailInfo = {
  numeroTexto: string;
  autorNome: string;
  autorEmail: string;
  autorTelefone: string | null;
  /** Pares "rótulo → valor" das especificações, na ordem em que devem aparecer. */
  especificacoes: Array<[string, string]>;
  observacoes: string | null;
  capa: { nome: string; tamanho: string; url: string };
  miolo: { nome: string; tamanho: string; url: string };
};

function tabelaEspecificacoes(linhas: Array<[string, string]>): string {
  return `<table style="border-collapse: collapse; width: 100%; font-size: 14px;">${linhas
    .map(
      ([rotulo, valor]) =>
        `<tr><td style="padding: 6px 10px; border: 1px solid #E0E0E0; background: #F6F6F6; width: 40%;"><b>${escaparHtml(rotulo)}</b></td><td style="padding: 6px 10px; border: 1px solid #E0E0E0;">${escaparHtml(valor)}</td></tr>`
    )
    .join("")}</table>`;
}

/** Aviso à equipe (contato@) com as especificações e os links para baixar capa e miolo. */
export async function sendPedidoImpressaoEquipeEmail(info: PedidoImpressaoEmailInfo) {
  await enviarEOuFalhar({
    from: EMAIL_FROM,
    to: EMAIL_CONTATO,
    replyTo: info.autorEmail,
    subject: `[Impressão] Pedido ${info.numeroTexto}: ${info.especificacoes[0]?.[1] ?? ""}`.slice(0, 200),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #262626;">
        <h2 style="color: #002776;">Novo pedido de impressão ${escaparHtml(info.numeroTexto)}</h2>
        <p><b>Autor(a):</b> ${escaparHtml(info.autorNome)} (${escaparHtml(info.autorEmail)}${info.autorTelefone ? `, ${escaparHtml(info.autorTelefone)}` : ""})</p>
        ${tabelaEspecificacoes(info.especificacoes)}
        ${info.observacoes ? `<p><b>Observações do autor:</b></p><p style="white-space: pre-wrap; background:#F6F6F6; padding:12px; border-radius:8px;">${escaparHtml(info.observacoes)}</p>` : ""}
        <h3 style="color: #002776; margin-top: 24px;">Arquivos</h3>
        <p><b>Capa:</b> <a href="${info.capa.url}">baixar PDF</a> (${escaparHtml(info.capa.nome)}, ${escaparHtml(info.capa.tamanho)})</p>
        <p><b>Miolo:</b> <a href="${info.miolo.url}">baixar PDF</a> (${escaparHtml(info.miolo.nome)}, ${escaparHtml(info.miolo.tamanho)})</p>
        <p style="font-size: 13px; color: #666;">Os links não pedem login e podem ser encaminhados à gráfica. Responder a este e-mail fala direto com o autor.</p>
      </div>
    `,
  });
}

/** Confirmação para o autor de que o pedido de impressão foi recebido. */
export async function sendPedidoImpressaoAutorEmail(to: string, info: Pick<PedidoImpressaoEmailInfo, "numeroTexto" | "autorNome" | "especificacoes">) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Recebemos o seu pedido de impressão ${info.numeroTexto}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Pedido de impressão recebido</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Olá, ${escaparHtml(info.autorNome)}. Recebemos o seu pedido <b>${escaparHtml(info.numeroTexto)}</b> com os arquivos de capa e miolo.
          Nossa equipe vai conferir as informações e entrar em contato por este e-mail com o orçamento e os próximos passos.
        </p>
        ${tabelaEspecificacoes(info.especificacoes)}
        <p style="font-size: 13px; color: #666; margin-top: 16px;">Você acompanha a situação do pedido no painel, em "Imprimir meu livro".</p>
      </div>
    `,
  });
}

export type OrcamentoImpressaoEmailInfo = {
  nome: string;
  email: string;
  telefone: string;
  projeto: string;
  /** Pares "rótulo → valor" do que o autor já configurou na tela de impressão. */
  especificacoes: Array<[string, string]>;
  /** Valor estimado, calculado no servidor com a tabela da gráfica (sem frete). */
  preco?: ResultadoPreco;
};

/**
 * Bloco com o valor estimado do orçamento. A equipe vê também quando não há valor automático (e por quê);
 * o autor só recebe o bloco quando existe um valor para mostrar.
 */
function blocoPrecoEmail(preco: ResultadoPreco | undefined, paraEquipe: boolean): string {
  if (!preco) return "";
  const titulo = paraEquipe ? "Valor estimado pelo site (tabela da gráfica, sem frete)" : "Valor estimado";
  const cabecalho = `<h3 style="color: #002776; margin-top: 24px;">${titulo}</h3>`;
  if (!preco.ok) {
    return paraEquipe ? `${cabecalho}<p style="font-size: 14px;">Sem valor automático: ${escaparHtml(preco.mensagem)}</p>` : "";
  }
  const tabela = tabelaEspecificacoes([
    ["Total", formatarReais(preco.totalCentavos)],
    ["Por exemplar", formatarReais(preco.porExemplarCentavos)],
    ...preco.linhas.map((l): [string, string] => [l.rotulo, formatarReais(l.centavos)]),
  ]);
  const nota = paraEquipe
    ? `Faixa de tiragem: ${preco.faixa} exemplares. É uma estimativa do site: confirme o valor e calcule o frete antes de responder ao autor.`
    : "Valor estimado com a tabela da nossa gráfica parceira. O frete não está incluído, e o valor final é confirmado pela nossa equipe.";
  return `${cabecalho}${tabela}<p style="font-size: 13px; color: #666;">${nota}</p>`;
}

/** Pedido de orçamento de impressão (sem arquivos): aviso à equipe, que responde ao e-mail informado. */
export async function sendOrcamentoImpressaoEquipeEmail(info: OrcamentoImpressaoEmailInfo) {
  await enviarEOuFalhar({
    from: EMAIL_FROM,
    to: EMAIL_CONTATO,
    replyTo: info.email,
    subject: `[Impressão] Pedido de orçamento: ${info.projeto}`.slice(0, 200),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #262626;">
        <h2 style="color: #002776;">Pedido de orçamento de impressão</h2>
        ${tabelaEspecificacoes([
          ["Nome", info.nome],
          ["E-mail", info.email],
          ["Telefone", info.telefone],
          ["Projeto", info.projeto],
        ])}
        <h3 style="color: #002776; margin-top: 24px;">Configuração escolhida na tela</h3>
        ${tabelaEspecificacoes(info.especificacoes)}
        ${blocoPrecoEmail(info.preco, true)}
        <p style="font-size: 13px; color: #666; margin-top: 16px;">Nenhum arquivo foi enviado neste pedido. Responder a este e-mail fala direto com o autor.</p>
      </div>
    `,
  });
}

/** Confirmação para quem pediu o orçamento por e-mail. */
export async function sendOrcamentoImpressaoAutorEmail(to: string, info: Pick<OrcamentoImpressaoEmailInfo, "nome" | "projeto" | "especificacoes" | "preco">) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Recebemos o seu pedido de orçamento de impressão",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Pedido de orçamento recebido</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Olá, ${escaparHtml(info.nome)}. Recebemos o seu pedido de orçamento para <b>${escaparHtml(info.projeto)}</b>.
          Nossa equipe vai analisar e responder por este e-mail.
        </p>
        ${tabelaEspecificacoes(info.especificacoes)}
        ${blocoPrecoEmail(info.preco, false)}
      </div>
    `,
  });
}

export type PedidoKitEmailInfo = {
  numero: number;
  kitNome: string;
  resumo: string;
  valorCentavos: number;
  parcelas: number;
  nome: string;
  email: string;
  telefone: string;
  /** Link (com o código secreto do kit) para enviar o livro e confirmar a impressão. */
  impressaoUrl?: string;
};

function formaDoKit(info: Pick<PedidoKitEmailInfo, "valorCentavos" | "parcelas">): string {
  const brl = (c: number) => "R$ " + (c / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return info.parcelas > 1 ? `${info.parcelas}x de ${brl(info.valorCentavos / info.parcelas)} no cartão, sem juros (total ${brl(info.valorCentavos)})` : `À vista, ${brl(info.valorCentavos)}`;
}

/** Aviso à equipe (contato@) de que um kit da Bienal foi pago. */
export async function sendPedidoKitEquipeEmail(info: PedidoKitEmailInfo) {
  await enviarEOuFalhar({
    from: EMAIL_FROM,
    to: EMAIL_CONTATO,
    replyTo: info.email,
    subject: `[Kit Bienal] Pagamento confirmado: ${info.kitNome} (pedido ${info.numero})`.slice(0, 200),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #262626;">
        <h2 style="color: #002776;">Kit contratado e pago: ${escaparHtml(info.kitNome)}</h2>
        ${tabelaEspecificacoes([
          ["Pedido", String(info.numero)],
          ["Kit", info.resumo],
          ["Pagamento", formaDoKit(info)],
          ["Nome", info.nome],
          ["E-mail", info.email],
          ["Telefone", info.telefone],
        ])}
        <p style="font-size: 13px; color: #666;">Falta combinar com o cliente o envio dos arquivos do livro e o horário do lançamento. Responder a este e-mail fala direto com ele.</p>
      </div>
    `,
  });
}

/** Confirmação para quem pagou um kit da Bienal. */
export async function sendPedidoKitCompradorEmail(info: PedidoKitEmailInfo) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to: info.email,
    subject: `Recebemos o seu pagamento: ${info.kitNome} - Bienal do Livro Rio 2027`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Pagamento confirmado!</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Olá, ${escaparHtml(info.nome)}. Recebemos o pagamento do seu <b>${escaparHtml(info.kitNome)}</b> para a Bienal do Livro Rio 2027.
          O próximo passo é enviar o seu livro: a capa e o miolo em PDF. As características da impressão do seu kit já estão definidas, você só confirma.
        </p>
        ${
          info.impressaoUrl
            ? `<p style="text-align: center; margin: 24px 0;"><a href="${info.impressaoUrl}" style="background: #009B3A; color: white; padding: 14px 28px; font-weight: bold; border-radius: 6px; text-decoration: none; display: inline-block;">Enviar meu livro para impressão</a></p>
        <p style="font-size: 12px; color: #666;">Guarde este e-mail: o link é só seu e vale para um único envio. Se perder, peça outro na página Imprimir meu livro, em "Comprei um kit".</p>`
            : ""
        }
        <p style="font-size: 14px; line-height: 1.6;">Nossa equipe também vai entrar em contato por este e-mail e pelo telefone informado para combinar o seu lançamento.</p>
        ${tabelaEspecificacoes([
          ["Pedido", String(info.numero)],
          ["Kit", info.resumo],
          ["Pagamento", formaDoKit(info)],
        ])}
      </div>
    `,
  });
}

/** Reenvia ao comprador o(s) link(s) para enviar o livro de um kit da Bienal (pedido em "Comprei um kit"). */
export async function sendKitLinkImpressaoEmail(to: string, nome: string, kits: Array<{ kitNome: string; numero: number; url: string }>) {
  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Seu link para enviar o livro do kit - Bienal do Livro Rio 2027",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Seu link para enviar o livro</h1>
        <p style="font-size: 15px; line-height: 1.6;">Olá, ${escaparHtml(nome)}. Você pediu o link para enviar o livro do seu kit. É só abrir, enviar a capa e o miolo em PDF e confirmar.</p>
        ${kits
          .map(
            (k) =>
              `<p style="text-align: center; margin: 18px 0;"><a href="${k.url}" style="background: #009B3A; color: white; padding: 14px 28px; font-weight: bold; border-radius: 6px; text-decoration: none; display: inline-block;">Enviar o livro do ${escaparHtml(k.kitNome)} (pedido ${k.numero})</a></p>`
          )
          .join("")}
        <p style="font-size: 12px; color: #666;">Cada link vale para um único envio. Se você não pediu este e-mail, pode ignorá-lo.</p>
      </div>
    `,
  });
}
