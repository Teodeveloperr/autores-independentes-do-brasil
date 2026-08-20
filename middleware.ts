import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  encryptSession,
  decryptSession,
  INACTIVITY_TIMEOUT_SECONDS,
  type SessionPayload,
  type AdminSessionPayload,
} from "@/lib/sessionCore";

const AUTHOR_COOKIE = "aib_session";
const ADMIN_COOKIE = "aib_admin_session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: INACTIVITY_TIMEOUT_SECONDS,
};

/**
 * Renova a sessão (autor e/ou admin) a cada requisição autenticada, deslizando a janela
 * de expiração 30 minutos para frente. Sem atividade nenhuma nesse período — por exemplo,
 * computador desligado durante a noite — a sessão simplesmente expira.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const authorToken = request.cookies.get(AUTHOR_COOKIE)?.value;
  const authorPayload = await decryptSession<SessionPayload>(authorToken);
  if (authorPayload?.authorId) {
    const renovado = await encryptSession({ authorId: authorPayload.authorId }, `${INACTIVITY_TIMEOUT_SECONDS}s`);
    response.cookies.set(AUTHOR_COOKIE, renovado, COOKIE_OPTIONS);
  }

  const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
  const adminPayload = await decryptSession<AdminSessionPayload>(adminToken);
  if (adminPayload?.adminId) {
    const renovado = await encryptSession({ adminId: adminPayload.adminId }, `${INACTIVITY_TIMEOUT_SECONDS}s`);
    response.cookies.set(ADMIN_COOKIE, renovado, COOKIE_OPTIONS);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|webp|svg|ico|gif)$).*)"],
};
