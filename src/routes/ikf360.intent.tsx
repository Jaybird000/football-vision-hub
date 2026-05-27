import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { ArrowRight, Check, Mail, Phone, Loader2 } from "lucide-react";
import { INTENT_QUESTIONS, scoreReadiness, READINESS_META, type Readiness } from "@/lib/ikf360-data";
import { submitIntent } from "@/server/intent";

export const Route = createFileRoute("/ikf360/intent")({
  component: IntentForm,
});

type Step = "details" | "questions" | "submitting" | "done";

function IntentForm() {
  const [step, setStep] = useState<Step>("details");
  const [details, setDetails] = useState({ parent: "", email: "", phone: "", child: "", age: "", gender: "Boy" });
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [qIdx, setQIdx] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [serverResult, setServerResult] = useState<{ id: string; readiness: Readiness } | null>(null);

  const q = INTENT_QUESTIONS[qIdx];
  const progress = useMemo(() => Math.round((Object.keys(answers).length / INTENT_QUESTIONS.length) * 100), [answers]);
  const readiness = serverResult?.readiness ?? scoreReadiness(answers);
  const detailsValid = details.parent && details.email && details.child && details.age;

  async function answer(score: number) {
    const next = { ...answers, [q.id]: score };
    setAnswers(next);
    if (qIdx < INTENT_QUESTIONS.length - 1) {
      setQIdx(qIdx + 1);
      return;
    }
    setStep("submitting");
    setSubmitError(null);
    try {
      const result = await submitIntent({
        data: {
          parentName: details.parent.trim(),
          parentEmail: details.email.trim(),
          parentPhone: details.phone.trim(),
          childName: details.child.trim(),
          childAge: parseInt(details.age, 10),
          childGender: details.gender as "Boy" | "Girl" | "Other",
          answers: next,
        },
      });
      setServerResult(result);
      setStep("done");
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : "Something went wrong saving your responses.");
      setStep("questions");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress */}
      {step !== "done" && (
        <div className="mb-10">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
            <span>Stage 1 of 3 — Intent</span>
            <span>{step === "details" ? "About you" : `Question ${qIdx + 1} of ${INTENT_QUESTIONS.length}`}</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="h-full transition-all duration-500" style={{ width: `${step === "details" ? 8 : 8 + progress * 0.92}%`, background: "var(--ikf-brand)" }} />
          </div>
        </div>
      )}

      {step === "details" && (
        <div className="space-y-8 animate-fade-up">
          <header>
            <h1 className="text-[26px] sm:text-[34px] leading-tight">Welcome. Let's start with you.</h1>
            <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
              This isn't a registration form. It's the start of a conversation between you and IKF about your child's journey. Takes about 4 minutes.
            </p>
          </header>

          <div className="ikf-card p-7 space-y-5">
            <Field label="Your name">
              <input className="ikf-input" value={details.parent} onChange={e => setDetails({ ...details, parent: e.target.value })} placeholder="Sunita Mahato" />
            </Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Email"><input type="email" className="ikf-input" value={details.email} onChange={e => setDetails({ ...details, email: e.target.value })} placeholder="you@example.com" /></Field>
              <Field label="Phone (WhatsApp)"><input className="ikf-input" value={details.phone} onChange={e => setDetails({ ...details, phone: e.target.value })} placeholder="+91" /></Field>
            </div>
            <Field label="Child's name"><input className="ikf-input" value={details.child} onChange={e => setDetails({ ...details, child: e.target.value })} placeholder="Arjun" /></Field>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field label="Child's age">
                <input type="number" min={8} max={20} className="ikf-input" value={details.age} onChange={e => setDetails({ ...details, age: e.target.value })} placeholder="8 to 20" />
              </Field>
              <Field label="Gender">
                <div className="flex gap-2">
                  {["Boy", "Girl", "Other"].map(g => (
                    <button key={g} onClick={() => setDetails({ ...details, gender: g })}
                      className="flex-1 py-2.5 rounded-lg border text-[13px] font-semibold transition-colors"
                      style={details.gender === g
                        ? { background: "var(--ikf-brand)", color: "#0B1220", borderColor: "var(--ikf-brand)" }
                        : { background: "var(--ikf-surface-2)", borderColor: "var(--ikf-border)", color: "var(--ikf-text)" }}>
                      {g}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </div>

          <button onClick={() => setStep("questions")} disabled={!detailsValid} className="ikf-btn-primary inline-flex items-center gap-2">
            Continue <ArrowRight size={16} />
          </button>
        </div>
      )}

      {step === "questions" && (
        <div key={q.id} className="animate-fade-up">
          <div className="text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--ikf-brand)" }}>
            {q.section === "child" ? "About your child" : q.section === "parent" ? "About your role" : "Your hopes"}
          </div>
          <h2 className="text-[22px] sm:text-[28px] leading-tight mb-7">{q.q}</h2>
          {submitError && (
            <div className="mb-5 p-4 rounded-lg text-[13px]" style={{ background: "rgba(220, 38, 38, 0.08)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
              {submitError}
            </div>
          )}
          <div className="space-y-3">
            {q.options.map(o => (
              <button key={o.label} onClick={() => answer(o.score)}
                className="w-full text-left ikf-card p-5 hover:border-[var(--ikf-brand)] transition-colors flex items-center justify-between gap-4">
                <span className="text-[15px]">{o.label}</span>
                <ArrowRight size={16} style={{ color: "var(--ikf-text-dim)" }} />
              </button>
            ))}
          </div>
          {qIdx > 0 && (
            <button onClick={() => setQIdx(qIdx - 1)} className="mt-6 text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>← Previous question</button>
          )}
        </div>
      )}

      {step === "submitting" && (
        <div className="animate-fade-up flex flex-col items-center justify-center py-20 text-center">
          <Loader2 size={28} className="animate-spin mb-4" style={{ color: "var(--ikf-brand)" }} />
          <div className="text-[15px]" style={{ color: "var(--ikf-text-dim)" }}>Saving your responses…</div>
        </div>
      )}

      {step === "done" && (
        <div className="animate-fade-up space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full inline-flex items-center justify-center mb-5" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>
              <Check size={28} strokeWidth={3} />
            </div>
            <h1 className="text-[26px] sm:text-[32px] leading-tight">Thank you, {details.parent.split(" ")[0] || "parent"}.</h1>
            <p className="mt-3 text-[15px] leading-relaxed max-w-md mx-auto" style={{ color: "var(--ikf-text-dim)" }}>
              We've received your responses. An IKF advisor will reach out within 24 hours to start the conversation.
            </p>
          </div>

          <div className="ikf-card p-7">
            <div className="flex items-center justify-between mb-5">
              <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--ikf-text-dim)" }}>Internal — readiness signal</div>
              <span className="ikf-chip" style={{ background: READINESS_META[readiness].bg, color: READINESS_META[readiness].color }}>{READINESS_META[readiness].label}</span>
            </div>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
              This signal is computed from the parent's answers and shown only to advisors. It determines whether the family is invited into Stage 2 immediately, or first scheduled for an orientation call.
            </p>
          </div>

          <div className="ikf-card p-7" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] mb-4" style={{ color: "var(--ikf-text-dim)" }}>
              <Mail size={12} /> Acknowledgement email preview
            </div>
            <div className="text-[14px] leading-relaxed space-y-2">
              <div><span style={{ color: "var(--ikf-text-dim)" }}>From:</span> Rahul Verma · IKF Pathway Advisor</div>
              <div><span style={{ color: "var(--ikf-text-dim)" }}>Subject:</span> About {details.child || "your child"} — let's talk</div>
              <p className="pt-3 border-t mt-3" style={{ borderColor: "var(--ikf-border)" }}>
                {details.parent.split(" ")[0] || "Hello"}, thank you for trusting us with the start of this conversation. I'll call you within the next 24 hours on {details.phone || "the number you shared"}. There's no script — just a chance to understand where {details.child || "your child"} is, and what you're hoping for. — Rahul
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link to="/ikf360/upload" className="ikf-btn-primary inline-flex items-center gap-2">See Stage 2 (Upload Portal) <ArrowRight size={16} /></Link>
            <Link to="/ikf360" className="ikf-btn-ghost inline-flex items-center gap-2">Back to overview</Link>
          </div>

          <div className="text-[12px] flex items-center gap-2" style={{ color: "var(--ikf-text-dim)" }}>
            <Phone size={12} /> Also notified via WhatsApp in production
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>{label}</div>
      {children}
    </label>
  );
}
