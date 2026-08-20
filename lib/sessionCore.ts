import { SignJWT, jwtVerify } from "jose";

const secretKey = process.env.AUTH_SECRET;
if (!secretKey) {
  throw new Error("AUTH_SECRET não configurado.");
}
const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = { authorId: string };
export type AdminSessionPayload = { adminId: string };
export type AdminPending2FAPayload = { pendingAdminId: string };

/** Sessões de autor/admin expiram 30 minutos após a última atividade (renovado a cada requisição no middleware). */
export const INACTIVITY_TIMEOUT_SECONDS = 30 * 60;

export async function encryptSession(
  payload: SessionPayload | AdminSessionPayload | AdminPending2FAPayload,
  expiresIn: string
) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(encodedKey);
}

export async function decryptSession<T>(token: string | undefined): Promise<T | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, encodedKey, { algorithms: ["HS256"] });
    return payload as T;
  } catch {
    return null;
  }
}
