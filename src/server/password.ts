import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEYLEN = 64;
const SCRYPT_N = 16384;

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(plain, salt, KEYLEN);
  return `scrypt$${SCRYPT_N}$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const [, , salt, hashHex] = parts;
  const expected = Buffer.from(hashHex, "hex");
  const candidate = await scryptAsync(plain, salt, expected.length);
  return expected.length === candidate.length && timingSafeEqual(expected, candidate);
}
