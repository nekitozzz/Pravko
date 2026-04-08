import { randomBytes, timingSafeEqual } from "node:crypto";

const BASE62_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const PASSWORD_HASH_VERSION = "pbkdf2_sha256_v1";
const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 32;
const PASSWORD_ITERATIONS = 210_000;

export function generateOpaqueToken(length: number): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE62_ALPHABET[bytes[i] % BASE62_ALPHABET.length];
  }
  return result;
}

export async function generateUniqueToken(
  length: number,
  exists: (token: string) => Promise<boolean>,
  maxAttempts = 5,
): Promise<string> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const token = generateOpaqueToken(length);
    if (!(await exists(token))) {
      return token;
    }
  }
  throw new Error("Could not generate a unique token");
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

async function deriveKey(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    PASSWORD_KEY_BYTES * 8,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const hash = await deriveKey(password, salt, PASSWORD_ITERATIONS);
  return `${PASSWORD_HASH_VERSION}$${PASSWORD_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

export async function verifyPassword(password: string, encoded: string): Promise<boolean> {
  try {
    const [version, iterationsRaw, saltHex, hashHex] = encoded.split("$");
    if (version !== PASSWORD_HASH_VERSION) return false;

    const iterations = parseInt(iterationsRaw, 10);
    if (!Number.isFinite(iterations) || iterations <= 0) return false;

    const salt = hexToBytes(saltHex);
    const storedHash = hexToBytes(hashHex);
    const derivedHash = await deriveKey(password, salt, iterations);

    return timingSafeEqual(Buffer.from(storedHash), Buffer.from(derivedHash));
  } catch {
    return false;
  }
}
