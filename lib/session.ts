import "server-only";
import { cookies } from "next/headers";
import {
  encryptSession,
  decryptSession,
  INACTIVITY_TIMEOUT_SECONDS,
  type SessionPayload,
  type AdminSessionPayload,
  type AdminPending2FAPayload,
} from "@/lib/sessionCore";

const AUTHOR_COOKIE = "aib_session";
const ADMIN_COOKIE = "aib_admin_session";
const ADMIN_PENDING_2FA_COOKIE = "aib_admin_pending_2fa";
const PENDING_2FA_DURATION_MS = 5 * 60 * 1000;

export async function createAuthorSession(authorId: string) {
  const expiresAt = new Date(Date.now() + INACTIVITY_TIMEOUT_SECONDS * 1000);
  const session = await encryptSession({ authorId }, `${INACTIVITY_TIMEOUT_SECONDS}s`);
  const cookieStore = await cookies();
  cookieStore.set(AUTHOR_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getAuthorSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTHOR_COOKIE)?.value;
  return decryptSession<SessionPayload>(token);
}

export async function deleteAuthorSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTHOR_COOKIE);
}

export async function createAdminSession(adminId: string) {
  const expiresAt = new Date(Date.now() + INACTIVITY_TIMEOUT_SECONDS * 1000);
  const session = await encryptSession({ adminId }, `${INACTIVITY_TIMEOUT_SECONDS}s`);
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  return decryptSession<AdminSessionPayload>(token);
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}

/** Sessão intermediária e curta usada entre "senha correta" e "código 2FA confirmado". */
export async function createAdminPending2FA(adminId: string) {
  const expiresAt = new Date(Date.now() + PENDING_2FA_DURATION_MS);
  const session = await encryptSession({ pendingAdminId: adminId }, "5m");
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_PENDING_2FA_COOKIE, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getAdminPending2FA() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_PENDING_2FA_COOKIE)?.value;
  return decryptSession<AdminPending2FAPayload>(token);
}

export async function deleteAdminPending2FA() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_PENDING_2FA_COOKIE);
}
