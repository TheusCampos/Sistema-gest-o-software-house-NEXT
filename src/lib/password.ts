import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

const SCRYPT_PREFIX = "scrypt";
const KEY_LENGTH = 64;

export function hashPassword(plainPassword: string): string {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(plainPassword, salt, KEY_LENGTH).toString("hex");
  return `${SCRYPT_PREFIX}$${salt}$${derivedKey}`;
}

export function verifyPassword(
  storedPassword: string | null | undefined,
  plainPassword: string,
): boolean {
  if (!storedPassword) return false;

  if (!storedPassword.startsWith(`${SCRYPT_PREFIX}$`)) {
    // Segurança: Fallback para senhas em texto plano removido.
    return false;
  }

  const [, salt, storedKey] = storedPassword.split("$");
  if (!salt || !storedKey) return false;

  const computedKey = scryptSync(plainPassword, salt, KEY_LENGTH);
  const expectedKey = Buffer.from(storedKey, "hex");

  if (computedKey.length !== expectedKey.length) return false;
  return timingSafeEqual(computedKey, expectedKey);
}
