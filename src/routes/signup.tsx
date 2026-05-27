import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { signup } from "@/server/auth";

export const Route = createFileRoute("/signup")({
  component: SignupPage,
});

function SignupPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid =
    form.fullName.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(form.email) &&
    form.password.length >= 8 &&
    consent;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await signup({
        data: {
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          consent: true,
        },
      });
      queryClient.setQueryData(["currentUser"], result);
      router.invalidate();
      router.navigate({ to: "/ikf360/intent" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account.");
      setSubmitting(false);
    }
  }

  return (
    <div className="ikf360-theme min-h-screen" style={{ background: "var(--ikf-bg)" }}>
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
            <span>Account · Create</span>
            <span>Step 1 of 2 — Your details</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="h-full" style={{ width: "50%", background: "var(--ikf-brand)" }} />
          </div>
        </div>

        <div className="space-y-8 animate-fade-up">
          <header>
            <h1 className="text-[34px] leading-tight">Create your account.</h1>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
              One account for your family. Your responses, your child's profile, your IKF advisor — all in one place. Next step after this is the Parent SOP.
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

            <Field label="Your full name">
              <input
                className="ikf-input"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder="Sunita Mahato"
                autoComplete="name"
                required
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-5">
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
              <Field label="Password" hint="At least 8 characters">
                <input
                  type="password"
                  className="ikf-input"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </Field>
            </div>

            <label className="flex items-start gap-3 cursor-pointer text-[13px] leading-relaxed">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 shrink-0"
                required
              />
              <span style={{ color: "var(--ikf-text-dim)" }}>
                I have read and agree to the{" "}
                <Link to="/privacy" target="_blank" className="underline" style={{ color: "var(--ikf-brand)" }}>
                  IKF Pathway 360 privacy policy
                </Link>
                . I understand that what I share about my child will be held by IKF and used only to guide their pathway.
              </span>
            </label>

            <button
              type="submit"
              disabled={!valid || submitting}
              className="ikf-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating account…
                </>
              ) : (
                <>
                  Continue to Parent SOP <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="text-center text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
            Already have an account?{" "}
            <Link to="/login" className="underline" style={{ color: "var(--ikf-brand)" }}>
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
        {label}
      </div>
      {children}
      {hint && (
        <div className="mt-1.5 text-[11px]" style={{ color: "var(--ikf-text-dim)" }}>
          {hint}
        </div>
      )}
    </label>
  );
}
