import "server-only";
import { Resend } from "resend";
import { brl } from "@/lib/format";

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

export type OrderConfirmationItem = { titulo: string; autorNome: string; quantidade: number; precoCentavos: number };

export async function sendOrderConfirmationEmail(
  to: string,
  data: { itens: OrderConfirmationItem[]; freteCentavos: number; totalCentavos: number }
) {
  const linhasItens = data.itens
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #F0F0F0;">
            ${i.titulo} <span style="color:#999;">×${i.quantidade}</span>
            <br/><span style="font-size:12px;color:#999;">${i.autorNome}</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #F0F0F0;text-align:right;white-space:nowrap;">${brl(i.precoCentavos * i.quantidade)}</td>
        </tr>`
    )
    .join("");

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Pedido recebido — Autores Independentes do Brasil",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Pedido recebido!</h1>
        <p style="font-size: 15px; line-height: 1.6;">
          Recebemos seu pedido, registrado como <b>Aguardando pagamento</b>. Como o pagamento online ainda
          não está disponível na plataforma, o(s) autor(es) foram notificados e vão entrar em contato para
          combinar a forma de pagamento e o envio.
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

export type NewSaleItem = { titulo: string; quantidade: number; precoCentavos: number };

export async function sendNewSaleEmail(
  to: string,
  data: {
    comprador: string;
    compradorEmail: string;
    compradorTelefone: string | null;
    endereco: string;
    itens: NewSaleItem[];
    freteCentavos: number | null;
    freteServico: string | null;
  }
) {
  const linhasItens = data.itens.map((i) => `<li>${i.titulo} ×${i.quantidade} — ${brl(i.precoCentavos * i.quantidade)}</li>`).join("");

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: "Você tem uma nova venda! — Autores Independentes do Brasil",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; color: #262626;">
        <h1 style="color: #002776; font-size: 22px;">Você tem uma nova venda! 🎉</h1>
        <p style="font-size: 15px; line-height: 1.6;"><b>${data.comprador}</b> acabou de comprar:</p>
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
        <p style="font-size: 15px; line-height: 1.6;">
          <b>Endereço de entrega:</b><br/>
          ${data.endereco}
        </p>
        <p style="margin-top: 32px;">
          <a href="${SITE_URL}/painel"
             style="background:#009B3A;color:white;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:bold;">
            Ver no painel
          </a>
        </p>
        <p style="font-size: 13px; color: #666; margin-top: 32px;">
          Entre em contato com o comprador para combinar o pagamento e o envio.
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
