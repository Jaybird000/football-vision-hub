import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { login } from "@/server/auth";

// Read the non-httpOnly personalisation cookie set at last login. Client-only —
// the login route is prerendered, so this runs after hydration.
function readWelcome(): { name: string; reviewIso: string } | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)ikf_welcome=([^;]+)/);
  if (!m) return null;
  try {
    const parsed = JSON.parse(decodeURIComponent(m[1])) as { name?: string; reviewIso?: string };
    if (!parsed.name) return null;
    return { name: parsed.name, reviewIso: parsed.reviewIso ?? "" };
  } catch {
    return null;
  }
}

function monthsUntil(iso: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.max(0, Math.round((t - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)));
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { next?: string } =>
    typeof search.next === "string" ? { next: search.next } : {},
  component: LoginPage,
});

function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { next } = Route.useSearch();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [welcome, setWelcome] = useState<{ name: string; reviewIso: string } | null>(null);
  useEffect(() => { setWelcome(readWelcome()); }, []);

  let subtext = "Sign in to continue your child's journey. Pick up exactly where you left off — your responses, your assessments, your advisor.";
  if (welcome) {
    const months = monthsUntil(welcome.reviewIso);
    subtext = months != null && months > 0
      ? `${welcome.name}'s next review is in ${months} ${months === 1 ? "month" : "months"}. Here is where things stand today.`
      : `${welcome.name}'s journey is waiting for you. Here is where things stand today.`;
  }

  const valid = /\S+@\S+\.\S+/.test(form.email) && form.password.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await login({
        data: {
          email: form.email.trim(),
          password: form.password,
        },
      });
      queryClient.setQueryData(["currentUser"], result);
      router.invalidate();
      // Admins always land in the console. Parents default to the overview
      // (explore-first); only an explicit `next` to the SOP is honored — this
      // whitelist keeps it type-safe and immune to open-redirects.
      if (result.role === "admin" || result.role === "advisor") {
        router.navigate({ to: "/ikf360/admin" });
      } else {
        // Whitelist of deep-link destinations honored after login (type-safe +
        // open-redirect-proof). Everything else → the explore-first overview.
        const dest =
          next === "/ikf360/intent" ? "/ikf360/intent"
          : next === "/ikf360/pre-review" ? "/ikf360/pre-review"
          : "/ikf360";
        router.navigate({ to: dest });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign you in.");
      setSubmitting(false);
    }
  }

  return (
    <div className="ikf360-theme min-h-screen" style={{ background: "var(--ikf-bg)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
            <span>Account · Sign in</span>
            <span>Returning families</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="h-full" style={{ width: "100%", background: "var(--ikf-brand)" }} />
          </div>
        </div>

        <div className="space-y-8 animate-fade-up">
          <header>
            <h1 className="text-[34px] leading-tight">Welcome back.</h1>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
              {subtext}
            </p>
          </header>

          <form onSubmit={onSubmit} className="ikf-card p-7 space-y-5">
            {error && (
              <div
                className="p-4 rounded-lg text-[13px]"
                style={{
                  background: "rgba(220, 38, 38, 0.08)",
                  color: "#dc2626",
                  border: "1px solid rgba(220, 38, 38, 0.2)",
                }}
              >
                {error}
              </div>
            )}

            <Field label="Email">
              <input
                type="email"
                className="ikf-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>

            <Field label="Password">
              <input
                type="password"
                className="ikf-input"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
              <div className="mt-2 text-right">
                <Link to="/forgot-password" className="text-[12px] underline" style={{ color: "var(--ikf-text-dim)" }}>
                  Forgot password?
                </Link>
              </div>
            </Field>

            <button
              type="submit"
              disabled={!valid || submitting}
              className="ikf-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing in…
                </>
              ) : (
                <>
                  Log in <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
            New to IKF 360?{" "}
            <Link to="/signup" className="underline" style={{ color: "var(--ikf-brand-ink)" }}>
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
        {label}
      </div>
      {children}
    </label>
  );
}
