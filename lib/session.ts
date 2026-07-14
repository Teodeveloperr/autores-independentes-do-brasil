import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error("AUTH_SECRET não configurado.");
}
const encodedKey = new TextEncoder().encode(secretKey);

const AUTHOR_COOKIE = "aib_session";
const ADMIN_COOKIE = "aib_admin_session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

type SessionPayload = { authorId: string };
type AdminSessionPayload = { adminId: string };

async function encrypt(payload: SessionPayload | AdminSessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

async function decrypt<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
    return payload as T;
  } catch {
    return null;
  }
}

export async function createAuthorSession(authorId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await encrypt({ authorId });
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
  return decrypt<SessionPayload>(token);
}

export async function deleteAuthorSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTHOR_COOKIE);
}

export async function createAdminSession(adminId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const session = await encrypt({ adminId });
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
  return decrypt<AdminSessionPayload>(token);
}

export async function deleteAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE);
}
