"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { emailSchema, senhaNovaSchema, primeiroErroZod } from "@/lib/validation";
import { criarSessaoLeitor, encerrarSessaoLeitor } from "@/lib/leitorAuth";
import { buscarLinkLeitorValido, criarLinkLeitor } from "@/lib/leitorLinks";
import { sendLeitorSenhaEmail } from "@/lib/email";

// Hash descartável: quando o e-mail não existe, comparamos a senha com ele só pra a resposta
// demorar o mesmo tempo e não dar pra descobrir, pelo tempo, quais e-mails têm conta.
const HASH_FALSO = bcrypt.hashSync("senha-descartavel-so-pra-igualar-o-tempo", 10);

const MENSAGEM_CREDENCIAIS =
  "E-mail ou senha incorretos. Se você comprou um e-book e ainda não criou a sua senha, use \"Esqueci minha senha\" para receber o link.";

export type EntrarState = { error?: string } | undefined;

const entrarSchema = z.object({
  email: emailSchema,
  senha: z.string().min(1, "Informe a sua senha."),
});

export async function entrarLeitor(_prev: EntrarState, formData: FormData): Promise<EntrarState> {
  const parsed = entrarSchema.safeParse({
    email: (formData.get("email") as string) || "",
    senha: (formData.get("senha") as string) || "",
  });
  if (!parsed.success) return { error: primeiroErroZod(parsed.error) };
  const { email, senha } = parsed.data;

  const ip = await getClientIp();
  const [okIp, okEmail] = await Promise.all([
    checkRateLimit(`leitor-login:${ip}`, 10, 10),
    checkRateLimit(`leitor-login-email:${email}`, 6, 15),
  ]);
  if (!okIp || !okEmail) return { error: "Muitas tentativas de entrada. Aguarde alguns minutos e tente novamente." };

  const leitor = await prisma.leitor.findUnique({ where: { email } });
  const senhaOk = await bcrypt.compare(senha, leitor?.senhaHash ?? HASH_FALSO);
  if (!leitor || !leitor.senhaHash || !senhaOk) return { error: MENSAGEM_CREDENCIAIS };

  await criarSessaoLeitor(leitor.id);
  redirect("/estante");
}

export type EsqueciState = { sent?: boolean; error?: string } | undefined;

/** Pede o link para criar/refazer a senha. A resposta é sempre a mesma, exista ou não o e-mail. */
export async function solicitarLinkSenhaLeitor(_prev: EsqueciState, formData: FormData): Promise<EsqueciState> {
  const parsed = emailSchema.safeParse((formData.get("email") as string) || "");
  if (!parsed.success) return { error: "Digite um e-mail válido." };
  const email = parsed.data;

  const ip = await getClientIp();
  const [okIp, okEmail] = await Promise.all([
    checkRateLimit(`leitor-esqueci:${ip}`, 6, 60),
    checkRateLimit(`leitor-esqueci-email:${email}`, 3, 60),
  ]);
  if (!okIp || !okEmail) return { error: "Muitas tentativas. Aguarde um pouco e tente novamente." };

  const leitor = await prisma.leitor.findUnique({ where: { email } });
  if (leitor) {
    try {
      const url = await criarLinkLeitor(leitor.id, "recuperacao");
      await sendLeitorSenhaEmail(leitor.email, url);
    } catch (err) {
      console.error("[leitor] Falha ao enviar o link de senha:", err);
    }
  }
  return { sent: true };
}

export type DefinirSenhaState = { error?: string } | undefined;

const definirSenhaSchema = z
  .object({
    token: z.string().min(1, "Link inválido."),
    senha: senhaNovaSchema,
    confirmar: z.string(),
  })
  .refine((d) => d.senha === d.confirmar, { message: "As senhas não coincidem.", path: ["confirmar"] });

/** Grava a senha escolhida pelo link, encerra as sessões antigas e já entra na estante. */
export async function definirSenhaLeitor(_prev: DefinirSenhaState, formData: FormData): Promise<DefinirSenhaState> {
  const parsed = definirSenhaSchema.safeParse({
    token: (formData.get("token") as string) || "",
    senha: (formData.get("senha") as string) || "",
    confirmar: (formData.get("confirmar") as string) || "",
  });
  if (!parsed.success) return { error: primeiroErroZod(parsed.error) };
  const { token, senha } = parsed.data;

  const ip = await getClientIp();
  if (!(await checkRateLimit(`leitor-definir-senha:${ip}`, 10, 30))) {
    return { error: "Muitas tentativas. Aguarde um pouco e tente novamente." };
  }

  const link = await buscarLinkLeitorValido(token);
  if (!link) return { error: "Este link é inválido ou expirou. Peça um novo em \"Esqueci minha senha\"." };

  const senhaHash = await bcrypt.hash(senha, 10);
  // O link só pode ser usado uma vez: o "usadoEm" é gravado com condição, pra duas abas não usarem o mesmo.
  const usado = await prisma.leitorLink.updateMany({ where: { id: link.id, usadoEm: null }, data: { usadoEm: new Date() } });
  if (usado.count !== 1) return { error: "Este link já foi usado. Peça um novo em \"Esqueci minha senha\"." };

  await prisma.$transaction([
    prisma.leitor.update({ where: { id: link.leitorId }, data: { senhaHash } }),
    // Trocar a senha desconecta todos os aparelhos antigos.
    prisma.leitorSessao.deleteMany({ where: { leitorId: link.leitorId } }),
  ]);

  await criarSessaoLeitor(link.leitorId);
  redirect("/estante");
}

export async function sairLeitor() {
  await encerrarSessaoLeitor();
  redirect("/entrar");
}

