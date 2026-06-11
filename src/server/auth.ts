import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { z } from "zod";
import { sql } from "./db";
import { hashPassword, verifyPassword } from "./password";

const SESSION_COOKIE = "ikf_session";
const SESSION_TTL_DAYS = 30;

// Session token: 32 random bytes (256 bits) → base64url. Web Crypto so it runs
// identically on Node and Cloudflare Workers (no `node:crypto.randomBytes`).
function randomSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

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
  const token = randomSessionToken();
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

// Login-screen personalisation. The login page is prerendered (static), so we
// can't personalise it server-side — instead we leave a NON-httpOnly cookie this
// browser already owns (child's first name + next-review date) that the page
// reads client-side. No pre-auth DB lookup, no email enumeration. Cleared on
// logout. Guarded so a failed lookup never blocks sign-in.
const WELCOME_COOKIE = "ikf_welcome";

async function setWelcomeCookie(profileId: string | null): Promise<void> {
  if (!profileId) {
    setCookie(WELCOME_COOKIE, "", { httpOnly: false, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production", maxAge: 0 });
    return;
  }
  const rows = await sql<{ child_name: string; valid_until: Date | null }[]>`
    SELECT p.child_name,
           (SELECT c.valid_until FROM categorisations c
              WHERE c.profile_id = p.id AND c.is_current = true
              ORDER BY c.scored_at DESC LIMIT 1) AS valid_until
    FROM parent_child_profiles p WHERE p.id = ${profileId} LIMIT 1
  `.catch(() => [] as { child_name: string; valid_until: Date | null }[]);
  const r = rows[0];
  if (!r) return;
  const name = (r.child_name || "").trim().split(/\s+/)[0] || "";
  const reviewIso = r.valid_until instanceof Date ? r.valid_until.toISOString() : "";
  const value = encodeURIComponent(JSON.stringify({ name, reviewIso }));
  setCookie(WELCOME_COOKIE, value, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_DAYS * 24 * 60 * 60,
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
    // Personalise the next visit to the login screen (returning family).
    await setWelcomeCookie(user.profile_id);

    return { id: user.id, email: user.email, fullName: user.full_name, role: user.role, profileId: user.profile_id };
  });

export const logout = createServerFn({ method: "POST" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    await sql`DELETE FROM sessions WHERE token = ${token}`;
  }
  clearSessionCookie();
  await setWelcomeCookie(null); // clear the personalisation cookie on explicit logout
  return { ok: true };
});

// Refresh the login-screen personalisation cookie for the signed-in parent's
// active child (called by the dashboard loader so it tracks the latest review
// date / selected child). No-op when not signed in.
export const refreshWelcome = createServerFn({ method: "GET" }).handler(async (): Promise<{ ok: boolean }> => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return { ok: false };
  const rows = await sql<{ profile_id: string | null }[]>`
    SELECT u.profile_id FROM sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token = ${token} AND s.expires_at > now() LIMIT 1
  `.catch(() => [] as { profile_id: string | null }[]);
  await setWelcomeCookie(rows[0]?.profile_id ?? null);
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
