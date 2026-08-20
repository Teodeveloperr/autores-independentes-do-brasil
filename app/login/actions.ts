"use server";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { createAuthorSession } from "@/lib/session";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { getRpID, getExpectedOrigin, WEBAUTHN_CHALLENGE_COOKIE, WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS } from "@/lib/webauthn";

export type LoginState = { error?: string } | undefined;

export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = (formData.get("email") as string || "").trim().toLowerCase();
  const senha = (formData.get("senha") as string) || "";

  if (!email || !senha) {
    return { error: "Preencha e-mail e senha para continuar." };
  }

  const ip = await getClientIp();
  const permitido = await checkRateLimit(`login:${ip}`, 8, 10);
  if (!permitido) {
    return { error: "Muitas tentativas de login. Aguarde alguns minutos e tente novamente." };
  }

  const author = await prisma.author.findUnique({ where: { email } });
  if (!author) {
    return { error: "Não encontramos uma conta com esse e-mail." };
  }
  if (!author.senhaHash) {
    return { error: "Esta conta usa login com Google. Clique em \"Continuar com Google\" para entrar." };
  }

  const senhaOk = await bcrypt.compare(senha, author.senhaHash);
  if (!senhaOk) {
    return { error: "Senha incorreta. Tente novamente." };
  }

  if (author.status === "suspenso") {
    return { error: "Esta conta está suspensa. Entre em contato com o coletivo para mais informações." };
  }

  await createAuthorSession(author.id);
  redirect("/painel");
}

export async function iniciarLoginPasskey() {
  const options = await generateAuthenticationOptions({
    rpID: getRpID(),
    userVerification: "preferred",
  });

  const cookieStore = await cookies();
  cookieStore.set(WEBAUTHN_CHALLENGE_COOKIE, options.challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS,
  });

  return options;
}

export type PasskeyLoginState = { error?: string; ok?: boolean } | undefined;

export async function confirmarLoginPasskey(response: AuthenticationResponseJSON): Promise<PasskeyLoginState> {
  const ip = await getClientIp();
  const permitido = await checkRateLimit(`login-passkey:${ip}`, 8, 10);
  if (!permitido) {
    return { error: "Muitas tentativas. Aguarde alguns minutos e tente novamente." };
  }

  const cookieStore = await cookies();
  const expectedChallenge = cookieStore.get(WEBAUTHN_CHALLENGE_COOKIE)?.value;
  cookieStore.delete(WEBAUTHN_CHALLENGE_COOKIE);
  if (!expectedChallenge) {
    return { error: "Sessão de login expirada. Tente novamente." };
  }

  const passkey = await prisma.authorPasskey.findUnique({
    where: { credentialId: response.id },
    include: { author: true },
  });
  if (!passkey) {
    return { error: "Essa biometria não está cadastrada nesta plataforma." };
  }
  if (passkey.author.status === "suspenso") {
    return { error: "Esta conta está suspensa. Entre em contato com o coletivo para mais informações." };
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge,
      expectedOrigin: getExpectedOrigin(),
      expectedRPID: getRpID(),
      credential: {
        id: passkey.credentialId,
        publicKey: new Uint8Array(passkey.publicKey),
        counter: Number(passkey.counter),
        transports: passkey.transports as AuthenticatorTransportFuture[],
      },
    });
  } catch (err) {
    console.error("[webauthn] Falha ao verificar login por biometria:", err);
    return { error: "Não foi possível confirmar a biometria. Tente novamente." };
  }

  if (!verification.verified) {
    return { error: "Não foi possível confirmar a biometria." };
  }

  await prisma.authorPasskey.update({
    where: { id: passkey.id },
    data: { counter: BigInt(verification.authenticationInfo.newCounter), lastUsedAt: new Date() },
  });

  await createAuthorSession(passkey.authorId);
  return { ok: true };
}
