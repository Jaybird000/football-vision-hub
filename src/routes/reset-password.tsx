import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { resetPassword } from "@/server/auth";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { token?: string } =>
    typeof search.token === "string" ? { token: search.token } : {},
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const router = useRouter();
  const { token } = Route.useSearch();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const pwOk = form.password.length >= 8;
  const matches = form.password === form.confirm;
  const valid = !!token && pwOk && matches;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword({ data: { token: token!, password: form.password } });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't reset your password.");
      setSubmitting(false);
    }
  }

  return (
    <div className="ikf360-theme min-h-screen" style={{ background: "var(--ikf-bg)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
            <span>Account · Password reset</span>
            <span>Step 2 of 2</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="h-full" style={{ width: "100%", background: "var(--ikf-brand)" }} />
          </div>
        </div>

        <div className="space-y-8 animate-fade-up">
          {done ? (
            <div className="ikf-card p-7 space-y-4">
              <div className="w-12 h-12 rounded-full inline-flex items-center justify-center" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>
                <CheckCircle2 size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-[26px] leading-tight">Password updated.</h1>
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
                Your password has been changed and you've been signed out everywhere. Sign in with your new password.
              </p>
              <button onClick={() => router.navigate({ to: "/login" })} className="ikf-btn-primary inline-flex items-center gap-2">
                Go to sign in <ArrowRight size={16} />
              </button>
            </div>
          ) : !token ? (
            <div className="ikf-card p-7 space-y-4">
              <h1 className="text-[26px] leading-tight">This link is incomplete.</h1>
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
                The reset link is missing its token. Please request a new password reset.
              </p>
              <Link to="/forgot-password" className="ikf-btn-primary inline-flex items-center gap-2">Request a new link <ArrowRight size={16} /></Link>
            </div>
          ) : (
            <>
              <header>
                <h1 className="text-[34px] leading-tight">Choose a new password.</h1>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
                  Pick something you'll remember — at least 8 characters.
                </p>
              </header>

              <form onSubmit={onSubmit} className="ikf-card p-7 space-y-5">
                {error && (
                  <div className="p-4 rounded-lg text-[13px]" style={{ background: "rgba(220, 38, 38, 0.08)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
                    {error}
                  </div>
                )}
                <label className="block">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>New password</div>
                  <input type="password" className="ikf-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" autoComplete="new-password" required />
                </label>
                <label className="block">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>Confirm password</div>
                  <input type="password" className="ikf-input" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} placeholder="••••••••" autoComplete="new-password" required />
                  {form.confirm.length > 0 && !matches && (
                    <div className="mt-2 text-[12px]" style={{ color: "#dc2626" }}>Passwords don't match.</div>
                  )}
                </label>
                <button type="submit" disabled={!valid || submitting} className="ikf-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Updating…</> : <>Update password <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
