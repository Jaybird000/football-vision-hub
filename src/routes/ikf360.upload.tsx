import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Clock, FileUp, ShieldCheck, ArrowRight, Loader2, AlertCircle, LifeBuoy, Send, CheckCircle2 } from "lucide-react";
import { getMyStage2, requestMentorAssistance, type Stage2State } from "@/server/stage2";

export const Route = createFileRoute("/ikf360/upload")({
  loader: async () => ({ initial: await getMyStage2() }),
  component: UploadPortal,
});

function UploadPortal() {
  const { initial } = Route.useLoaderData();
  const qc = useQueryClient();
  const { data: state = initial } = useQuery({
    queryKey: ["stage2"],
    queryFn: () => getMyStage2(),
    initialData: initial,
  });

  if (!state.profileId) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="ikf-card p-8 text-center space-y-4">
          <AlertCircle size={40} className="mx-auto" style={{ color: "var(--ikf-brand-ink)" }} />
          <h1 className="text-[22px] sm:text-[28px] leading-tight">Complete the Parent SOP first</h1>
          <p className="text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
            Stage 2 unlocks automatically as soon as you've finished Stage 1.
          </p>
          <Link to="/ikf360/intent" className="ikf-btn-primary inline-flex items-center gap-2">
            Open the Parent SOP <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return <Portal state={state} onChanged={() => qc.invalidateQueries({ queryKey: ["stage2"] })} />;
}

function Portal({ state, onChanged }: { state: Stage2State; onChanged: () => void }) {
  const grouped = state.templates.reduce<Record<string, Stage2State["templates"]>>((acc, t) => {
    (acc[t.category] ||= []).push(t); return acc;
  }, {});

  const uploadByKey = new Map(state.uploads.map(u => [u.assessmentKey, u]));
  const missingRequired = state.templates.filter(t => t.required && !uploadByKey.has(t.key));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
          <span>Stage 2 of 3 — Deep Assessment</span>
          <span>{state.uploadedRequiredCount} of {state.requiredKeys.length} required uploaded</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${state.requiredKeys.length === 0 ? 0 : (state.uploadedRequiredCount / state.requiredKeys.length) * 100}%`,
              background: "var(--ikf-brand)",
            }}
          />
        </div>
      </div>

      <header className="mb-8">
        <h1 className="text-[26px] sm:text-[34px] leading-tight">Upload your child's reports</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          {state.childName ? `For ${state.childName}. ` : ""}Open each assessment to see what it is, pick an IKF partner, and upload the report. Re-uploads overwrite the previous version.
        </p>
      </header>

      {missingRequired.length > 0 && (
        <MentorAssistancePanel state={state} missingCount={missingRequired.length} onChanged={onChanged} />
      )}

      {state.minimumDatasetReached && (
        <div
          className="ikf-card p-5 mb-8 flex items-center justify-between gap-4 flex-wrap"
          style={{ borderColor: "var(--ikf-brand)" }}
        >
          <div className="flex items-center gap-3">
            <ShieldCheck size={22} style={{ color: "var(--ikf-brand-ink)" }} />
            <span className="text-[14px]">
              Minimum required dataset reached. Your advisor has been notified — Stage 3 recommendation will be issued within 48 hours.
            </span>
          </div>
          <Link to="/ikf360/dashboard" className="ikf-btn-primary inline-flex items-center gap-2 text-[13px]">
            See Stage 3 <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <section key={category} className="mb-10">
          <div className="flex items-end gap-3 mb-4">
            <h2 className="text-[22px] font-bold">{category}</h2>
            <span className="text-[12px] uppercase tracking-[0.14em] mb-1" style={{ color: "var(--ikf-text-dim)" }}>
              {items.length} report{items.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {items.map(t => {
              const upload = uploadByKey.get(t.key);
              const status: "verified" | "uploaded" | "pending" | "rejected" = upload?.status ?? "pending";
              return (
                <Link
                  key={t.key}
                  to="/ikf360/upload/$assessmentKey"
                  params={{ assessmentKey: t.key }}
                  className="ikf-card p-5 flex items-center justify-between gap-3 transition-colors hover:border-[var(--ikf-brand)]"
                >
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-bold leading-tight">{t.title}</h3>
                    <div className="text-[11px] uppercase tracking-[0.12em] mt-1" style={{ color: t.required ? "var(--ikf-brand-ink)" : "var(--ikf-text-dim)" }}>
                      {t.required ? "Required" : "Optional"}
                      {upload?.providerName ? <span style={{ color: "var(--ikf-text-dim)" }}> · {upload.providerName}</span> : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={status} />
                    <ArrowRight size={16} style={{ color: "var(--ikf-text-dim)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function MentorAssistancePanel({
  state,
  missingCount,
  onChanged,
}: {
  state: Stage2State;
  missingCount: number;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const mutation = useMutation({
    mutationFn: async () => requestMentorAssistance({ data: { message: message.trim() } }),
    onSuccess: () => onChanged(),
  });

  if (state.assistanceRequestedAt || mutation.isSuccess) {
    return (
      <div className="ikf-card p-6 mb-8 flex items-start gap-3" style={{ borderColor: "var(--ikf-brand)" }}>
        <CheckCircle2 size={22} className="mt-0.5 shrink-0" style={{ color: "var(--ikf-brand-ink)" }} />
        <div>
          <h3 className="text-[16px] font-bold">Your request is in.</h3>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
            Your IKF mentor has been notified and will get back to you within 48 hours to guide you on the documents you're missing. There's nothing more you need to do right now.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="ikf-card p-6 mb-8" style={{ borderColor: "var(--ikf-brand)", borderStyle: "dashed" }}>
      <div className="flex items-start gap-3">
        <LifeBuoy size={22} className="mt-0.5 shrink-0" style={{ color: "var(--ikf-brand-ink)" }} />
        <div className="flex-1">
          <h3 className="text-[16px] font-bold">Don't have these documents?</h3>
          <p className="mt-1 text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
            That's completely fine. If you don't currently have {missingCount === 1 ? "this report" : "these reports"}, your IKF mentor can guide you on the next steps — usually within 48 hours.
          </p>

          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] mt-4"
            >
              <LifeBuoy size={14} /> Contact my IKF Mentor
            </button>
          ) : (
            <div className="mt-4 space-y-3">
              <label className="block">
                <div className="text-[12px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
                  Anything you'd like your mentor to know? (optional)
                </div>
                <textarea
                  className="ikf-input"
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. We haven't done the fitness or psychometric assessments yet and aren't sure where to start."
                  maxLength={2000}
                />
              </label>
              {mutation.isError && (
                <div
                  className="text-[12px] p-3 rounded-lg"
                  style={{ background: "rgba(220, 38, 38, 0.08)", color: "#dc2626", border: "1px solid rgba(220, 38, 38, 0.2)" }}
                >
                  {mutation.error instanceof Error ? mutation.error.message : "Could not send your request."}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending}
                  className="ikf-btn-primary inline-flex items-center gap-2 text-[13px] disabled:opacity-50"
                >
                  {mutation.isPending ? (
                    <><Loader2 size={14} className="animate-spin" /> Sending…</>
                  ) : (
                    <><Send size={14} /> Request assistance</>
                  )}
                </button>
                <button onClick={() => setOpen(false)} className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "verified" | "uploaded" | "pending" | "rejected" }) {
  const map = {
    verified:  { bg: "rgba(34,197,94,0.12)",  color: "#22c55e", label: "Verified", icon: <Check size={11} /> },
    uploaded:  { bg: "rgba(245,197,24,0.18)", color: "#8A6D08", label: "Uploaded", icon: <FileUp size={11} /> },
    pending:   { bg: "rgba(160,160,160,0.12)", color: "#9ca3af", label: "Pending",  icon: <Clock size={11} /> },
    rejected:  { bg: "rgba(220,38,38,0.12)",  color: "#dc2626", label: "Rejected", icon: <AlertCircle size={11} /> },
  } as const;
  const cfg = map[status];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-[0.12em] font-bold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.icon} {cfg.label}
    </span>
  );
}
