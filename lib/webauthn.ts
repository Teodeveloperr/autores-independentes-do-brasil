import "server-only";

export const RP_NAME = "Autores Independentes do Brasil";

export function getRpID(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";
  return new URL(siteUrl).hostname;
}

export function getExpectedOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://autoresdobrasil.com.br";
}

export const WEBAUTHN_CHALLENGE_COOKIE = "webauthn_challenge";
export const WEBAUTHN_CHALLENGE_MAX_AGE_SECONDS = 5 * 60;
