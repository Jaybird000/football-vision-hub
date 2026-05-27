import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2, Shield } from "lucide-react";
import { adminLogin } from "@/server/auth";

export const Route = createFileRoute("/admin-login")({
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = /\S+@\S+\.\S+/.test(form.email) && form.password.length > 0;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await adminLogin({
        data: {
          email: form.email.trim(),
          password: form.password,
        },
      });
      router.invalidate();
      router.navigate({ to: "/ikf360/admin" });
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
            <span>Admin · Sign in</span>
            <span>Internal access only</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="h-full" style={{ width: "100%", background: "var(--ikf-brand)" }} />
          </div>
        </div>

        <div className="space-y-8 animate-fade-up">
          <header>
            <div
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] mb-3 px-3 py-1.5 rounded-full"
              style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-brand)" }}
            >
              <Shield size={12} /> Admin console
            </div>
            <h1 className="text-[34px] leading-tight">Sign in to the admin console.</h1>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
              IKF advisors and administrators only. If you're a parent, use the parent login instead.
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

            <Field label="Admin email">
              <input
                type="email"
                className="ikf-input"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="advisor@ikfsports.com"
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
                  Enter admin console <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
            Looking for the parent portal?{" "}
            <Link to="/login" className="underline" style={{ color: "var(--ikf-brand)" }}>
              Parent login
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
