import "server-only";
import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashToken } from "@/lib/passwordReset";

// Sessão do leitor (quem compra e-book). Separada da sessão de autor e da de admin.
// O cookie guarda só um código aleatório; a sessão em si fica no banco (um registro por aparelho),
// o que permite limitar quantos aparelhos ficam logados ao mesmo tempo e derrubar sessões.

export const LEITOR_COOKIE = "aib_leitor";
export const MAX_APARELHOS = 2;
// A sessão vale 30 dias a partir do último uso (renova enquanto a pessoa continua lendo).
export const SESSAO_DIAS = 30;
const SESSAO_MS = SESSAO_DIAS * 24 * 60 * 60 * 1000;
// Só renova o "último uso" se passou mais que isso, pra não gravar no banco a cada página.
const RENOVAR_APOS_MS = 10 * 60 * 1000;
// O cookie dura bem mais que a sessão; quem manda na validade é o banco (que renova com o uso).
const COOKIE_MAX_AGE_S = 180 * 24 * 60 * 60;

export type LeitorLogado = { id: string; email: string; nome: string | null; sessaoId: string };

function resumirAparelho(userAgent: string | null): string {
  const ua = userAgent ?? "";
  const sistema = /iPhone|iPad/.test(ua) ? "iPhone/iPad" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS X/.test(ua) ? "Mac" : /Linux/.test(ua) ? "Linux" : "Aparelho";
  const navegador = /Edg\//.test(ua) ? "Edge" : /OPR\/|Opera/.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "navegador";
  return `${sistema} · ${navegador}`;
}

/**
 * Abre uma sessão para o leitor neste aparelho e grava o cookie. Se o leitor já estiver no limite
 * de aparelhos, as sessões mais antigas (menos usadas) são encerradas.
 */
export async function criarSessaoLeitor(leitorId: string): Promise<void> {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const agora = new Date();
  const headerList = await headers();

  await prisma.leitorSessao.create({
    data: {
      leitorId,
      tokenHash: hashToken(rawToken),
      aparelho: resumirAparelho(headerList.get("user-agent")),
      ultimoUsoEm: agora,
      expiraEm: new Date(agora.getTime() + SESSAO_MS),
    },
  });

  // Mantém só as MAX_APARELHOS sessões mais recentes (as expiradas também saem).
  await prisma.leitorSessao.deleteMany({ where: { leitorId, expiraEm: { lte: agora } } });
  const ativas = await prisma.leitorSessao.findMany({ where: { leitorId }, orderBy: { ultimoUsoEm: "desc" }, select: { id: true } });
  const sobrando = ativas.slice(MAX_APARELHOS).map((s) => s.id);
  if (sobrando.length > 0) await prisma.leitorSessao.deleteMany({ where: { id: { in: sobrando } } });

  await prisma.leitor.update({ where: { id: leitorId }, data: { ultimoAcessoEm: agora } });

  const cookieStore = await cookies();
  cookieStore.set(LEITOR_COOKIE, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_S,
  });
}

/** Leitor logado neste aparelho, ou null. Renova a validade da sessão conforme o uso. */
export async function getLeitorAtual(): Promise<LeitorLogado | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(LEITOR_COOKIE)?.value;
  if (!rawToken) return null;

  const agora = new Date();
  const sessao = await prisma.leitorSessao.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { leitor: { select: { id: true, email: true, nome: true } } },
  });
  if (!sessao || sessao.expiraEm <= agora) return null;

  if (agora.getTime() - sessao.ultimoUsoEm.getTime() > RENOVAR_APOS_MS) {
    await prisma.leitorSessao.update({
      where: { id: sessao.id },
      data: { ultimoUsoEm: agora, expiraEm: new Date(agora.getTime() + SESSAO_MS) },
    });
  }
  return { ...sessao.leitor, sessaoId: sessao.id };
}

/** Para páginas que exigem login de leitor. */
export async function requireLeitor(): Promise<LeitorLogado> {
  const leitor = await getLeitorAtual();
  if (!leitor) redirect("/entrar");
  return leitor;
}

/** Encerra só a sessão deste aparelho. */
export async function encerrarSessaoLeitor(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(LEITOR_COOKIE)?.value;
  if (rawToken) await prisma.leitorSessao.deleteMany({ where: { tokenHash: hashToken(rawToken) } });
  cookieStore.delete(LEITOR_COOKIE);
}
