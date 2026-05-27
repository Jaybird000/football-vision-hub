import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { sql } from "./db";
import { hashPassword, verifyPassword } from "./password";

const SESSION_COOKIE = "ikf_session";
const SESSION_TTL_DAYS = 30;

// Bumped when the privacy policy materially changes. Stored on users.consent_version
// at signup so we can later detect users who agreed to an older policy.
export const CURRENT_CONSENT_VERSION = "2026-05-26";

type Role = "parent" | "advisor" | "admin";

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  profileId: string | null;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await sql`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (${token}, ${userId}, ${expiresAt})
  `;
  return token;
}

function writeSessionCookie(token: string) {
  setCookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
  });
}

function clearSessionCookie() {
  setCookie(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });
}

const SignupInput = z.object({
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(160),
  password: z.string().min(8).max(200),
  consent: z.literal(true, { errorMap: () => ({ message: "You must accept the privacy policy to create an account." }) }),
});

const LoginInput = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(1).max(200),
});

export const signup = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => SignupInput.parse(data))
  .handler(async ({ data }): Promise<AuthUser> => {
    const email = normalizeEmail(data.email);

    const existing = await sql<{ id: string }[]>`
      SELECT id FROM users WHERE email = ${email} LIMIT 1
    `;
    if (existing.length > 0) {
      throw new Error("An account with this email already exists.");
    }

    const passwordHash = await hashPassword(data.password);

    const rows = await sql<{ id: string; email: string; full_name: string; role: Role }[]>`
      INSERT INTO users (email, password_hash, full_name, role, consented_at, consent_version)
      VALUES (${email}, ${passwordHash}, ${data.fullName}, 'parent', now(), ${CURRENT_CONSENT_VERSION})
      RETURNING id, email, full_name, role
    `;
    const user = rows[0];

    const token = await createSession(user.id);
    writeSessionCookie(token);

    return { id: user.id, email: user.email, fullName: user.full_name, role: user.role, profileId: null };
  });

export const login = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => LoginInput.parse(data))
  .handler(async ({ data }): Promise<AuthUser> => {
    const email = normalizeEmail(data.email);

    const rows = await sql<{ id: string; email: string; full_name: string; role: Role; password_hash: string; profile_id: string | null }[]>`
      SELECT id, email, full_name, role, password_hash, profile_id
      FROM users WHERE email = ${email} LIMIT 1
    `;
    if (rows.length === 0) {
      throw new Error("Incorrect email or password.");
    }
    const user = rows[0];
    const ok = await verifyPassword(data.password, user.password_hash);
    if (!ok) {
      throw new Error("Incorrect email or password.");
    }

    const token = await createSession(user.id);
    writeSessionCookie(token);

    return { id: user.id, email: user.email, fullName: user.full_name, role: user.role, profileId: user.profile_id };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
  }
  clearSessionCookie();
  return { ok: true };
});

export const currentUser = createServerFn({ method: "GET" }).handler(async (): Promise<AuthUser | null> => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return null;

  const rows = await sql<{ id: string; email: string; full_name: string; role: Role; profile_id: string | null }[]>`
    SELECT u.id, u.email, u.full_name, u.role, u.profile_id
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now()
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const u = rows[0];
  return { id: u.id, email: u.email, fullName: u.full_name, role: u.role, profileId: u.profile_id };
});
