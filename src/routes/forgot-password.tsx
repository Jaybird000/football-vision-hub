import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { requestPasswordReset } from "@/server/auth";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    try {
      // Always succeeds (no email enumeration); show the same confirmation either way.
      await requestPasswordReset({ data: { email: email.trim() } });
    } catch {
      /* swallow — we still confirm to avoid leaking which emails exist */
    }
    setSent(true);
    setSubmitting(false);
  }

  return (
    <div className="ikf360-theme min-h-screen" style={{ background: "var(--ikf-bg)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
            <span>Account · Password reset</span>
            <span>Step 1 of 2</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="h-full" style={{ width: "50%", background: "var(--ikf-brand)" }} />
          </div>
        </div>

        <div className="space-y-8 animate-fade-up">
          {sent ? (
            <div className="ikf-card p-7 space-y-4">
              <div className="w-12 h-12 rounded-full inline-flex items-center justify-center" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>
                <CheckCircle2 size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-[26px] leading-tight">Check your email.</h1>
              <p className="text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
                If an account exists for <strong>{email.trim()}</strong>, we've sent a link to reset your password.
                It expires in one hour. Don't see it? Check your spam folder, or try again.
              </p>
              <Link to="/login" className="ikf-btn-ghost inline-flex items-center gap-2">Back to sign in</Link>
            </div>
          ) : (
            <>
              <header>
                <h1 className="text-[34px] leading-tight">Reset your password.</h1>
                <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
                  Enter the email on your IKF Pathway 360 account and we'll send you a link to set a new password.
                </p>
              </header>

              <form onSubmit={onSubmit} className="ikf-card p-7 space-y-5">
                <label className="block">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>Email</div>
                  <input
                    type="email"
                    className="ikf-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </label>
                <button
                  type="submit"
                  disabled={!valid || submitting}
                  className="ikf-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <>Send reset link <ArrowRight size={16} /></>}
                </button>
              </form>

              <div className="text-center text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
                Remembered it?{" "}
                <Link to="/login" className="underline" style={{ color: "var(--ikf-brand-ink)" }}>Back to sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
