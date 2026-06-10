import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowRight, ArrowLeft, Check, Mail, Loader2, CheckCircle2, Shield, Clock, Lock } from "lucide-react";
import {
  EMPTY_SOP_RESPONSES,
  JOURNEY_QUESTIONS,
  JOURNEY_SECTIONS,
  JOURNEY_ENTRY,
  JOURNEY_SUBMISSION,
  JOURNEY_Q11_PLACEHOLDER,
  PREFER_NOT_TO_SAY,
  READINESS_META,
  READINESS_PARENT_COPY,
  STAGE1_EXPLAINER,
  deriveReadiness,
  type SopResponses,
  type JourneyQuestion,
  type Readiness,
} from "@/lib/ikf360-data";
import { currentUser } from "@/server/auth";
import { submitJourney, getMyIntent, getMySopDraft, saveSopDraft, type MyIntent } from "@/server/intent";

export const Route = createFileRoute("/ikf360/intent")({
  // The SOP autosaves and resumes per account, so it requires a signed-in
  // parent. Module B's flow is Landing → Login → Explore → SOP; the login page
  // honors ?next=/ikf360/intent to return here after sign-in.
  // ?addChild=1 starts a fresh SOP for an *additional* child even when this
  // parent already has a profile on file (multi-child, 0015) — used by the
  // dashboard's "Add another child" action.
  validateSearch: (search: Record<string, unknown>): { addChild?: boolean } =>
    search.addChild === true || search.addChild === "1" || search.addChild === "true"
      ? { addChild: true }
      : {},
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user) throw redirect({ to: "/login", search: { next: "/ikf360/intent" } });
  },
  loader: async () => ({
    existing: await getMyIntent(),
    draft: await getMySopDraft(),
  }),
  component: JourneyRoute,
});

function JourneyRoute() {
  const { existing, draft } = Route.useLoaderData();
  const { addChild } = Route.useSearch();
  // When adding another child, always show the form (the resumable per-user
  // draft is reused if one is in progress).
  if (existing && !addChild) return <AlreadySubmitted intent={existing} />;
  return <JourneyForm initial={draft} />;
}

// ─── Already submitted ───────────────────────────────────────────────────────

function AlreadySubmitted({ intent }: { intent: MyIntent }) {
  const meta = READINESS_META[intent.readiness];
  const submittedDate = new Date(intent.submittedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const hasGender = intent.childGender && intent.childGender !== "Not specified";
  return (
    <div className="max-w-2xl mx-auto animate-fade-up space-y-8">
      <div className="mb-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
          <span>Stage 1 of 3 — Parent SOP</span>
          <span style={{ color: "var(--ikf-brand-ink)" }}>Complete</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
          <div className="h-full" style={{ width: "100%", background: "var(--ikf-brand)" }} />
        </div>
      </div>

      <header className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full inline-flex items-center justify-center shrink-0" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>
          <CheckCircle2 size={24} strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-[26px] sm:text-[30px] leading-tight">Your child's profile has been started.</h1>
          <p className="mt-2 text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
            Submitted on {submittedDate}. Below are the details we have on file.
          </p>
        </div>
      </header>

      <div className="ikf-card p-7">
        <div className="flex items-center justify-between mb-5">
          <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--ikf-text-dim)" }}>Your submitted details</div>
          <span className="ikf-chip" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
        </div>
        <dl className="grid sm:grid-cols-2 gap-x-8 gap-y-4 text-[14px]">
          <DetailRow label="Parent" value={intent.parentName} />
          <DetailRow label="Child" value={intent.childName} />
          <DetailRow label="Email" value={intent.parentEmail} />
          <DetailRow label="Child's age" value={`${intent.childAge}`} />
          {hasGender && <DetailRow label="Gender" value={intent.childGender} />}
        </dl>
      </div>

      <ReadinessExplainer readiness={intent.readiness} />

      <div className="ikf-card p-5 flex items-start gap-3" style={{ background: "var(--ikf-surface-2)" }}>
        <Mail size={16} className="mt-0.5 shrink-0" style={{ color: "var(--ikf-brand-ink)" }} />
        <p className="text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          Need to update something? Reach your IKF advisor — they'll edit the file on your behalf.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link to="/ikf360/upload" className="ikf-btn-primary inline-flex items-center gap-2">
          Continue to Stage 2 — Upload Portal <ArrowRight size={16} />
        </Link>
        <Link to="/ikf360/dashboard" className="ikf-btn-ghost inline-flex items-center gap-2">
          View dashboard
        </Link>
      </div>
    </div>
  );
}

// Module D readiness explanation — kept alongside the new flow so the parent
// stays informed (and curious) about what their starting signal means.
function ReadinessExplainer({ readiness }: { readiness: Readiness }) {
  const meta = READINESS_META[readiness];
  const pcopy = READINESS_PARENT_COPY[readiness];
  return (
    <div className="ikf-card p-7 space-y-5">
      <div>
        <div className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>What is Stage 1?</div>
        <p className="text-[14px] leading-relaxed">{STAGE1_EXPLAINER.whatIsStage1}</p>
      </div>
      <div className="pt-5 border-t" style={{ borderColor: "var(--ikf-border)" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--ikf-text-dim)" }}>Your starting signal</div>
          <span className="ikf-chip" style={{ background: meta.bg, color: meta.color }}>{meta.label}</span>
        </div>
        <h3 className="text-[18px] mb-2">{pcopy.headline}</h3>
        <p className="text-[14px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{pcopy.meaning}</p>
      </div>
      <div className="pt-5 border-t" style={{ borderColor: "var(--ikf-border)" }}>
        <div className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-brand-ink)" }}>What happens next</div>
        <p className="text-[14px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{pcopy.next}</p>
        <p className="mt-3 text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{STAGE1_EXPLAINER.curiosity}</p>
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] mb-1" style={{ color: "var(--ikf-text-dim)" }}>{label}</dt>
      <dd className="text-[15px]">{value}</dd>
    </div>
  );
}

// ─── The SOP wizard ──────────────────────────────────────────────────────────

type Step = "entry" | "section" | "bridge" | "submitting" | "done";

function JourneyForm({ initial }: { initial: { responses: SopResponses; section: number } | null }) {
  const [responses, setResponses] = useState<SopResponses>(initial?.responses ?? EMPTY_SOP_RESPONSES);
  // Resume straight into the saved section if a draft exists; otherwise open on
  // the entry/trust screen.
  const [step, setStep] = useState<Step>(initial ? "section" : "entry");
  const [section, setSection] = useState<number>(initial?.section ?? 1);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; readiness: Readiness } | null>(null);
  const [saved, setSaved] = useState(false);

  const set = (patch: Partial<SopResponses>) => setResponses(r => ({ ...r, ...patch }));

  // Debounced autosave — "your answers save automatically". Runs while the
  // parent is moving through the sections; never after submission.
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inWizard = step === "section" || step === "bridge";
  useEffect(() => {
    if (!inWizard) return;
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveSopDraft({ data: { responses, section } })
        .then(() => setSaved(true))
        .catch(() => { /* autosave is best-effort */ });
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [responses, section, inWizard]);

  const readiness = result?.readiness ?? deriveReadiness(responses);
  const sectionMeta = JOURNEY_SECTIONS[section - 1];
  const valid = sectionValid(section, responses);

  async function submit() {
    setStep("submitting");
    setSubmitError(null);
    try {
      const r = await submitJourney({ data: responses });
      setResult(r);
      setStep("done");
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : "Something went wrong saving your responses.");
      setStep("section");
    }
  }

  function advance() {
    if (section < 4) {
      // Section close → bridging screen → next section.
      setStep("bridge");
    } else {
      void submit();
    }
  }

  // ── Entry / trust screen ──
  if (step === "entry") {
    return (
      <div className="max-w-2xl mx-auto animate-fade-up">
        <Progress section={1} />
        <header className="mt-2">
          <h1 className="text-[26px] sm:text-[34px] leading-tight">{JOURNEY_ENTRY.headline}</h1>
        </header>
        <div className="ikf-card p-7 mt-7 space-y-4">
          {JOURNEY_ENTRY.body.map((p, i) => (
            <p key={i} className="text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{p}</p>
          ))}
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            <TrustChip icon={Clock} text="About ten minutes" />
            <TrustChip icon={Shield} text="No right answers" />
            <TrustChip icon={Lock} text="Never shared without your permission" />
          </div>
        </div>
        <button onClick={() => { setStep("section"); setSection(1); }} className="ikf-btn-primary inline-flex items-center gap-2 mt-7">
          {JOURNEY_ENTRY.button} <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  // ── Section-close bridge ──
  if (step === "bridge") {
    const close = JOURNEY_SECTIONS[section - 1].close;
    const nextSection = section + 1;
    return (
      <div className="max-w-2xl mx-auto animate-fade-up">
        <Progress section={section} />
        <div className="ikf-card p-8 mt-6 text-center">
          <div className="w-12 h-12 rounded-full inline-flex items-center justify-center mb-5" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-brand-ink)" }}>
            <Check size={22} strokeWidth={2.5} />
          </div>
          <p className="text-[19px] sm:text-[22px] leading-snug max-w-md mx-auto">{close}</p>
        </div>
        <div className="flex items-center justify-between mt-7">
          <button onClick={() => setStep("section")} className="text-[13px] inline-flex items-center gap-1.5" style={{ color: "var(--ikf-text-dim)" }}>
            <ArrowLeft size={14} /> Back
          </button>
          <button onClick={() => { setSection(nextSection); setStep("section"); }} className="ikf-btn-primary inline-flex items-center gap-2">
            Continue to Section {nextSection} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  // ── Submitting ──
  if (step === "submitting") {
    return (
      <div className="max-w-2xl mx-auto animate-fade-up flex flex-col items-center justify-center py-24 text-center">
        <Loader2 size={28} className="animate-spin mb-4" style={{ color: "var(--ikf-brand-ink)" }} />
        <div className="text-[15px]" style={{ color: "var(--ikf-text-dim)" }}>Starting your child's profile…</div>
      </div>
    );
  }

  // ── Submission screen ──
  if (step === "done") {
    return (
      <div className="max-w-2xl mx-auto animate-fade-up space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full inline-flex items-center justify-center mb-5" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>
            <Check size={28} strokeWidth={3} />
          </div>
          <h1 className="text-[26px] sm:text-[32px] leading-tight">{JOURNEY_SUBMISSION.headline}</h1>
          <p className="mt-3 text-[15px]" style={{ color: "var(--ikf-text-dim)" }}>{JOURNEY_SUBMISSION.intro}</p>
        </div>

        <div className="ikf-card p-7 space-y-4">
          {JOURNEY_SUBMISSION.body.map((p, i) => (
            <p key={i} className="text-[14px] leading-relaxed" style={i === JOURNEY_SUBMISSION.body.length - 1 ? undefined : { color: "var(--ikf-text-dim)" }}>{p}</p>
          ))}
        </div>

        <ReadinessExplainer readiness={readiness} />

        <Link to="/ikf360/dashboard" className="ikf-btn-primary inline-flex items-center gap-2">
          {JOURNEY_SUBMISSION.button} <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  // ── A section of questions ──
  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <Progress section={section} saved={saved} />

      <header className="mt-2 mb-7">
        <div className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--ikf-brand-ink)" }}>{sectionMeta.eyebrow}</div>
        <h1 className="text-[24px] sm:text-[30px] leading-tight">{sectionMeta.header}</h1>
        <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{sectionMeta.subtext}</p>
      </header>

      {submitError && (
        <div className="mb-6 p-4 rounded-lg text-[13px]" style={{ background: "rgba(220, 38, 38, 0.08)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)" }}>
          {submitError}
        </div>
      )}

      <div className="space-y-8">
        {section === 1 && <SectionOne r={responses} set={set} />}
        {section === 2 && <SectionTwo r={responses} set={set} />}
        {section === 3 && <SectionThree r={responses} set={set} />}
        {section === 4 && <SectionFour r={responses} set={set} />}
      </div>

      <div className="flex items-center justify-between mt-9">
        {section > 1 ? (
          <button onClick={() => { setSection(section - 1); }} className="text-[13px] inline-flex items-center gap-1.5" style={{ color: "var(--ikf-text-dim)" }}>
            <ArrowLeft size={14} /> Back
          </button>
        ) : <span />}
        <button onClick={advance} disabled={!valid} className="ikf-btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed">
          {section < 4 ? <>Continue to Section {section + 1} <ArrowRight size={16} /></> : <>Start my child's profile <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}

// ─── Per-section validation (gates the Continue button) ──────────────────────

function sectionValid(section: number, r: SopResponses): boolean {
  if (section === 1) {
    return Boolean(r.firstName.trim() && r.age != null && r.q2 && r.q3 && (r.q4.prior === "yes" || r.q4.prior === "no"));
  }
  if (section === 2) {
    const concernOk = r.q6.choices.length >= 1 && (!r.q6.choices.includes("Something else") || Boolean(r.q6.other.trim()));
    return Boolean(r.q5 && concernOk && r.q7);
  }
  if (section === 3) {
    return Boolean(r.q8 && r.q9 && r.q10);
  }
  return true; // Section 4 — Q11 is optional.
}

// ─── Sections ────────────────────────────────────────────────────────────────

type SectionProps = { r: SopResponses; set: (p: Partial<SopResponses>) => void };

function q(id: JourneyQuestion["id"]): JourneyQuestion {
  return JOURNEY_QUESTIONS.find(x => x.id === id)!;
}

function SectionOne({ r, set }: SectionProps) {
  return (
    <>
      <QuestionBlock title="What is your child's name and age?" note="First name is enough — we already have the rest from your account.">
        <div className="grid sm:grid-cols-2 gap-5">
          <Field label="First name">
            <input className="ikf-input" value={r.firstName} onChange={e => set({ firstName: e.target.value })} placeholder="Arjun" />
          </Field>
          <Field label="Age">
            <select className="ikf-input" value={r.age ?? ""} onChange={e => set({ age: e.target.value ? parseInt(e.target.value, 10) : null })}>
              <option value="">Select age</option>
              {Array.from({ length: 11 }, (_, i) => 8 + i).map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </Field>
        </div>
      </QuestionBlock>

      <SingleQuestion q={q("q2")} value={r.q2} onSelect={v => set({ q2: v })} />
      <SingleQuestion q={q("q3")} value={r.q3} onSelect={v => set({ q3: v })} />

      <QuestionBlock title={q("q4").q}>
        <div className="space-y-3">
          {q("q4").options.map(o => (
            <OptionButton key={o.label} label={o.label} selected={r.q4.prior === (o.label === "Yes" ? "yes" : "no")}
              onClick={() => set({ q4: { ...r.q4, prior: o.label === "Yes" ? "yes" : "no" } })} />
          ))}
        </div>
        {r.q4.prior === "yes" && (
          <div className="mt-4">
            <Field label={q("q4").followPrompt ?? "Tell us more"}>
              <input className="ikf-input" value={r.q4.detail} onChange={e => set({ q4: { ...r.q4, detail: e.target.value } })} placeholder="e.g. Pune, around March 2025" />
            </Field>
          </div>
        )}
      </QuestionBlock>
    </>
  );
}

function SectionTwo({ r, set }: SectionProps) {
  return (
    <>
      <SingleQuestion q={q("q5")} value={r.q5} onSelect={v => set({ q5: v })} />

      <QuestionBlock title={q("q6").q} note={q("q6").note}>
        <div className="space-y-3">
          {q("q6").options.map(o => {
            const selected = r.q6.choices.includes(o.label);
            const atMax = r.q6.choices.length >= (q("q6").max ?? 2);
            const disabled = !selected && atMax;
            return (
              <OptionButton key={o.label} label={o.label} selected={selected} disabled={disabled} multi
                onClick={() => {
                  if (selected) set({ q6: { ...r.q6, choices: r.q6.choices.filter(c => c !== o.label) } });
                  else if (!atMax) set({ q6: { ...r.q6, choices: [...r.q6.choices, o.label] } });
                }} />
            );
          })}
        </div>
        {r.q6.choices.includes("Something else") && (
          <div className="mt-4">
            <Field label="Tell us more">
              <input className="ikf-input" value={r.q6.other} onChange={e => set({ q6: { ...r.q6, other: e.target.value } })} placeholder="What's been on your mind?" />
            </Field>
          </div>
        )}
      </QuestionBlock>

      <SingleQuestion q={q("q7")} value={r.q7} onSelect={v => set({ q7: v })} />
    </>
  );
}

function SectionThree({ r, set }: SectionProps) {
  const q8 = q("q8");
  return (
    <>
      <QuestionBlock title={q8.q}>
        <div className="space-y-3">
          {q8.options.map(o => (
            <OptionButton key={o.label} label={o.label} selected={r.q8 === o.label} onClick={() => set({ q8: o.label })} />
          ))}
          {/* Q8 is the highest drop-off question — a visible, lower-key escape
              valve gives parents a way to stay in the form honestly. */}
          <button
            onClick={() => set({ q8: PREFER_NOT_TO_SAY })}
            className="w-full text-left p-4 rounded-lg border border-dashed text-[13px] transition-colors"
            style={r.q8 === PREFER_NOT_TO_SAY
              ? { borderColor: "var(--ikf-brand)", background: "var(--ikf-surface-2)", color: "var(--ikf-text)" }
              : { borderColor: "var(--ikf-border)", background: "transparent", color: "var(--ikf-text-dim)" }}
          >
            {PREFER_NOT_TO_SAY}
          </button>
        </div>
      </QuestionBlock>

      <SingleQuestion q={q("q9")} value={r.q9} onSelect={v => set({ q9: v })} />
      <SingleQuestion q={q("q10")} value={r.q10} onSelect={v => set({ q10: v })} />
    </>
  );
}

function SectionFour({ r, set }: SectionProps) {
  return (
    <QuestionBlock title="" >
      <textarea
        className="ikf-input min-h-[160px]"
        value={r.q11}
        onChange={e => set({ q11: e.target.value })}
        placeholder={JOURNEY_Q11_PLACEHOLDER}
      />
    </QuestionBlock>
  );
}

// ─── Shared bits ─────────────────────────────────────────────────────────────

function Progress({ section, saved }: { section: number; saved?: boolean }) {
  const total = JOURNEY_SECTIONS.length;
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
        <span>Section {section} of {total}</span>
        {saved !== undefined && (
          <span className="inline-flex items-center gap-1" style={{ color: "var(--ikf-text-dim)" }}>
            {saved ? <><Check size={11} /> Saved</> : "Saving…"}
          </span>
        )}
      </div>
      <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
        <div className="h-full transition-all duration-500" style={{ width: `${(section / total) * 100}%`, background: "var(--ikf-brand)" }} />
      </div>
    </div>
  );
}

function SingleQuestion({ q, value, onSelect }: { q: JourneyQuestion; value: string; onSelect: (v: string) => void }) {
  return (
    <QuestionBlock title={q.q} note={q.note}>
      <div className="space-y-3">
        {q.options.map(o => (
          <OptionButton key={o.label} label={o.label} selected={value === o.label} onClick={() => onSelect(o.label)} />
        ))}
      </div>
    </QuestionBlock>
  );
}

function QuestionBlock({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <h2 className="text-[16px] sm:text-[18px] leading-snug mb-1.5">{title}</h2>}
      {note && <p className="text-[12px] mb-3" style={{ color: "var(--ikf-text-dim)" }}>{note}</p>}
      <div className={title && !note ? "mt-3" : ""}>{children}</div>
    </div>
  );
}

function OptionButton({
  label, selected, onClick, disabled, multi,
}: {
  label: string; selected: boolean; onClick: () => void; disabled?: boolean; multi?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full text-left p-4 rounded-lg border transition-colors flex items-center justify-between gap-3 disabled:opacity-40 disabled:cursor-not-allowed"
      style={selected
        ? { borderColor: "var(--ikf-brand)", background: "var(--ikf-surface-2)" }
        : { borderColor: "var(--ikf-border)", background: "var(--ikf-surface)" }}
    >
      <span className="text-[14px] leading-snug">{label}</span>
      <span
        className="shrink-0 inline-flex items-center justify-center w-5 h-5 transition-colors"
        style={{
          borderRadius: multi ? 4 : 999,
          border: `2px solid ${selected ? "var(--ikf-brand)" : "var(--ikf-border)"}`,
          background: selected ? "var(--ikf-brand)" : "transparent",
          color: "#0B1220",
        }}
      >
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
    </button>
  );
}

function TrustChip({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg p-3" style={{ background: "var(--ikf-surface-2)" }}>
      <Icon size={15} className="shrink-0" style={{ color: "var(--ikf-brand-ink)" }} />
      <span className="text-[12px] leading-tight" style={{ color: "var(--ikf-text-dim)" }}>{text}</span>
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
