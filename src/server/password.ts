// Password hashing via Web Crypto PBKDF2 (SHA-256, OWASP 2023 iteration target).
// Works identically on Node and Cloudflare Workers — no Node-only `crypto.scrypt`.
//
// Stored format:  pbkdf2$<iterations>$<salt_b64>$<hash_b64>
// Salt: 16 random bytes. Hash: 256 bits.

const ITERATIONS = 600_000;
const SALT_BYTES = 16;
const HASH_BITS = 256;
const enc = new TextEncoder();

function toB64(bytes: Uint8Array): string {
  // Base64 across Node 24 + Workers: Uint8Array → Buffer-or-btoa.
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function fromB64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") return new Uint8Array(Buffer.from(b64, "base64"));
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function derive(password: string, salt: Uint8Array, iterations: number, bits: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const buf = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    key,
    bits,
  );
  return new Uint8Array(buf);
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = new Uint8Array(SALT_BYTES);
  crypto.getRandomValues(salt);
  const hash = await derive(plain, salt, ITERATIONS, HASH_BITS);
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(hash)}`;
}

export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  if (!Number.isFinite(iterations) || iterations < 1) return false;
  const salt = fromB64(parts[2]);
  const expected = fromB64(parts[3]);
  const candidate = await derive(plain, salt, iterations, expected.length * 8);
  return constantTimeEqual(expected, candidate);
}
