// Seed or update an IKF Pathway 360 admin/advisor user against the local SQLite DB.
// Uses PBKDF2 (matches src/server/password.ts) so the resulting hash is verified
// by the running app without any compatibility shim.
//
// Usage: node scripts/seed-admin.mjs

import Database from "better-sqlite3";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { join, isAbsolute } from "node:path";

const DB_PATH = process.env.DATABASE_PATH || "db/local.sqlite";
const ABS_PATH = isAbsolute(DB_PATH) ? DB_PATH : join(process.cwd(), DB_PATH);

const ITERATIONS = 600_000;
const enc = new TextEncoder();

function toB64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

async function hashPassword(plain) {
  const salt = new Uint8Array(16);
  globalThis.crypto.getRandomValues(salt);
  const key = await globalThis.crypto.subtle.importKey(
    "raw", enc.encode(plain), { name: "PBKDF2" }, false, ["deriveBits"],
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key, 256,
  );
  return `pbkdf2$${ITERATIONS}$${toB64(salt)}$${toB64(new Uint8Array(bits))}`;
}

async function prompt(rl, label, { secret = false } = {}) {
  if (!secret) return (await rl.question(label)).trim();
  process.stdout.write(label);
  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  input.setEncoding("utf8");
  let buf = "";
  await new Promise((resolve) => {
    const onData = (ch) => {
      if (ch === "") process.exit(0);
      if (ch === "\r" || ch === "\n") {
        input.removeListener("data", onData);
        process.stdout.write("\n");
        resolve();
      } else if (ch === "" || ch === "\b") {
        if (buf.length > 0) { buf = buf.slice(0, -1); process.stdout.write("\b \b"); }
      } else {
        buf += ch;
        process.stdout.write("*");
      }
    };
    input.on("data", onData);
  });
  input.setRawMode(Boolean(wasRaw));
  return buf;
}

const db = new Database(ABS_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");
db.function("uuid", { deterministic: false }, () => globalThis.crypto.randomUUID());

const rl = createInterface({ input, output });

try {
  console.log("\nSeed IKF Pathway 360 admin user\n-------------------------------");
  const fullName = await prompt(rl, "Full name: ");
  const email = (await prompt(rl, "Email: ")).toLowerCase();
  const role = (await prompt(rl, "Role [admin/advisor] (default: admin): ")) || "admin";
  if (role !== "admin" && role !== "advisor") {
    console.error("Role must be 'admin' or 'advisor'.");
    process.exit(1);
  }
  const password = await prompt(rl, "Password (min 8 chars): ", { secret: true });
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  const existing = db.prepare("SELECT id, role FROM users WHERE email = ? LIMIT 1").get(email);
  const passwordHash = await hashPassword(password);

  if (existing) {
    const ans = (await rl.question(`User ${email} already exists with role '${existing.role}'. Update password and set role to '${role}'? [y/N] `)).trim().toLowerCase();
    if (ans !== "y") { console.log("Aborted."); process.exit(0); }
    db.prepare(`
      UPDATE users
      SET password_hash = ?, full_name = ?, role = ?,
          updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      WHERE email = ?
    `).run(passwordHash, fullName, role, email);
    console.log(`\nUpdated ${email} → role=${role}.`);
  } else {
    const row = db.prepare(`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
      RETURNING id
    `).get(email, passwordHash, fullName, role);
    console.log(`\nCreated ${email} → role=${role} (id=${row.id}).`);
  }
  console.log("Sign in at: http://localhost:5173/login\n");
} catch (err) {
  console.error("FAIL:", err);
  process.exit(1);
} finally {
  rl.close();
  db.close();
}
