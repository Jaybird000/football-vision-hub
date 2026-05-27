import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import postgres from "postgres";

const scryptAsync = promisify(scrypt);

async function hashPassword(plain) {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(plain, salt, 64);
  return `scrypt$16384$${salt}$${derived.toString("hex")}`;
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
      } else if (ch === "") {
        if (buf.length > 0) {
          buf = buf.slice(0, -1);
          process.stdout.write("\b \b");
        }
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

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL not set. Run with: node --env-file=.env scripts/seed-admin.mjs");
  process.exit(1);
}

const sql = postgres(url, { max: 1, connect_timeout: 5 });
const rl = createInterface({ input, output });

try {
  console.log("\nSeed IKF 360 admin user\n----------------------");
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

  const existing = await sql`SELECT id, role FROM users WHERE email = ${email} LIMIT 1`;
  const passwordHash = await hashPassword(password);

  if (existing.length > 0) {
    const ans = (await rl.question(`User ${email} already exists with role '${existing[0].role}'. Update password and set role to '${role}'? [y/N] `)).trim().toLowerCase();
    if (ans !== "y") {
      console.log("Aborted.");
      process.exit(0);
    }
    await sql`
      UPDATE users
      SET password_hash = ${passwordHash}, full_name = ${fullName}, role = ${role}, updated_at = now()
      WHERE email = ${email}
    `;
    console.log(`\nUpdated ${email} → role=${role}.`);
  } else {
    const rows = await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES (${email}, ${passwordHash}, ${fullName}, ${role})
      RETURNING id
    `;
    console.log(`\nCreated ${email} → role=${role} (id=${rows[0].id}).`);
  }
  console.log("Sign in at: http://localhost:5173/ikf360/admin-login\n");
} catch (err) {
  console.error("FAIL:", err);
  process.exit(1);
} finally {
  rl.close();
  await sql.end();
}
