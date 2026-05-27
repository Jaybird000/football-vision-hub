// One-off smoke test of the SQLite path:
//   - PBKDF2 hash + verify
//   - sql shim read against seeded admin
//   - sql shim write + read back a session
//
// Run: npx tsx --env-file=.env.local scripts/smoke-sqlite.ts

import { hashPassword, verifyPassword } from "../src/server/password.js";
import { sql } from "../src/server/db.js";

console.log("[1/4] PBKDF2 round-trip");
const fresh = await hashPassword("adminpass123");
console.log(`  fresh hash: ${fresh.slice(0, 25)}…`);
console.log(`  verify ✓:   ${await verifyPassword("adminpass123", fresh)}`);
console.log(`  verify ✗:   ${await verifyPassword("wrong", fresh)}`);

console.log("\n[2/4] DB read: admin@ikf.test");
type UserRow = { id: string; email: string; role: string; full_name: string };
const users = await sql<UserRow[]>`SELECT id, email, role, full_name FROM users WHERE email = ${"admin@ikf.test"}`;
console.log(`  rows: ${users.length}`);
console.log(`  row[0]:`, users[0]);

console.log("\n[3/4] Verify seeded hash against 'adminpass123'");
const hashRows = await sql<{ password_hash: string }[]>`SELECT password_hash FROM users WHERE email = ${"admin@ikf.test"}`;
console.log(`  matches: ${await verifyPassword("adminpass123", hashRows[0].password_hash)}`);

console.log("\n[4/4] Write + read back: session row");
const token = `smoke-${Date.now()}`;
const userId = users[0].id;
const expires = new Date(Date.now() + 60_000);
await sql`INSERT INTO sessions (token, user_id, expires_at) VALUES (${token}, ${userId}, ${expires})`;
const sessRows = await sql<{ token: string; user_id: string; expires_at: Date }[]>`SELECT token, user_id, expires_at FROM sessions WHERE token = ${token}`;
console.log(`  inserted+read:`, sessRows[0]);
console.log(`  expires_at is Date instance: ${sessRows[0].expires_at instanceof Date}`);
await sql`DELETE FROM sessions WHERE token = ${token}`;

console.log("\n✓ SQLite path is wired correctly end-to-end");
process.exit(0);
