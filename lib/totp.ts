import "server-only";
import crypto from "node:crypto";

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STEP_SECONDS = 30;

function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(base32: string): Buffer {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function codigoParaContador(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac("sha1", key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const codigo =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(codigo % 1_000_000).padStart(6, "0");
}

export function gerarSegredoTotp(): string {
  return base32Encode(crypto.randomBytes(20));
}

/** Aceita códigos do passo atual e de um passo antes/depois, para tolerar diferença de relógio. */
export function verificarCodigoTotp(secretBase32: string, codigo: string, janela = 1): boolean {
  const codigoLimpo = codigo.replace(/\s/g, "");
  if (!/^\d{6}$/.test(codigoLimpo)) return false;

  const counterAtual = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  for (let i = -janela; i <= janela; i++) {
    if (codigoParaContador(secretBase32, counterAtual + i) === codigoLimpo) {
      return true;
    }
  }
  return false;
}

export function gerarOtpauthUri(secretBase32: string, email: string): string {
  const label = encodeURIComponent(`Autores Independentes do Brasil:${email}`);
  const issuer = encodeURIComponent("Autores Independentes do Brasil");
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${issuer}&algorithm=SHA1&digits=6&period=${STEP_SECONDS}`;
}

export function gerarCodigosBackup(quantidade = 8): string[] {
  const codigos: string[] = [];
  for (let i = 0; i < quantidade; i++) {
    const bytes = crypto.randomBytes(5).toString("hex").toUpperCase();
    codigos.push(`${bytes.slice(0, 5)}-${bytes.slice(5, 10)}`);
  }
  return codigos;
}
