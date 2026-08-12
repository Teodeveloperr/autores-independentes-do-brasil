import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const EMAIL_FROM = process.env.EMAIL_FROM || "Autores Independentes do Brasil <contato@autoresdobrasil.com.br>";
const EMAIL_CONTATO = process.env.EMAIL_CONTATO || "contato@autoresdobrasil.com.br";

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
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br"}/painel"
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
