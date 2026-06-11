import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { currentUser } from "@/server/auth";
import { submitPreReview } from "@/server/notifications";
import { PRE_REVIEW_QUESTIONS, EMPTY_PRE_REVIEW, type PreReviewResponses } from "@/lib/ikf360-data";

export const Route = createFileRoute("/ikf360/pre-review")({
  // `child` carries the profile the reminder was about (multi-child); the server
  // ownership-checks it and falls back to the active child if absent.
  validateSearch: (search: Record<string, unknown>): { child?: string } =>
    typeof search.child === "string" ? { child: search.child } : {},
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user) throw redirect({ to: "/login", search: { next: "/ikf360/pre-review" } });
  },
  component: PreReviewRoute,
});

function PreReviewRoute() {
  const { child } = Route.useSearch();
  const [responses, setResponses] = useState<PreReviewResponses>(EMPTY_PRE_REVIEW);
  const submit = useMutation({
    mutationFn: () => submitPreReview({ data: { responses, profileId: child } }),
  });

  const set = (id: keyof PreReviewResponses, value: string) => setResponses(r => ({ ...r, [id]: value }));

  // Every single-select question must be answered; pr5 (free text) is optional.
  const required = PRE_REVIEW_QUESTIONS.filter(q => q.kind === "single");
  const complete = required.every(q => responses[q.id].trim().length > 0);

  if (submit.isSuccess) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <div className="ikf-card p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full inline-flex items-center justify-center" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>
            <CheckCircle2 size={24} strokeWidth={2.5} />
          </div>
          <h1 className="text-[24px] leading-tight">Thank you — that's everything we needed.</h1>
          <p className="text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
            Your advisor now has the latest picture and will factor it into the upcoming review.
          </p>
          <Link to="/ikf360/dashboard" className="ikf-btn-primary inline-flex items-center gap-2">
            Back to the dashboard <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="text-[11px] uppercase tracking-[0.16em] mb-2 flex items-center gap-1.5" style={{ color: "var(--ikf-brand-ink)" }}>
          <Clock size={12} /> Before your next review
        </div>
        <h1 className="text-[28px] sm:text-[34px] leading-tight">A quick check-in.</h1>
        <p className="mt-3 text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          Five short questions — just anything that's changed since you last told us about your situation. It helps your advisor walk into the review already knowing where things stand.
        </p>
      </div>

      <div className="space-y-5">
        {PRE_REVIEW_QUESTIONS.map((q, i) => (
          <div key={q.id} className="ikf-card p-6">
            <div className="text-[14px] font-semibold mb-3">{i + 1}. {q.q}</div>
            {q.kind === "single" ? (
              <div className="flex flex-col gap-2">
                {q.options!.map(opt => {
                  const active = responses[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => set(q.id, opt)}
                      className="text-left px-4 py-2.5 rounded-lg text-[13.5px] transition"
                      style={{
                        background: active ? "var(--ikf-brand)" : "var(--ikf-surface-2)",
                        color: "var(--ikf-text)",
                        border: active ? "1px solid var(--ikf-brand)" : "1px solid var(--ikf-border)",
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            ) : (
              <textarea
                value={responses[q.id]}
                onChange={e => set(q.id, e.target.value)}
                rows={3}
                placeholder="Optional — anything else worth knowing."
                className="ikf-input w-full text-[13.5px]"
              />
            )}
          </div>
        ))}
      </div>

      {submit.isError && (
        <div className="mt-4 p-3 rounded-lg text-[12px]" style={{ background: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
          {submit.error instanceof Error ? submit.error.message : "Couldn't send that — please try again."}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => submit.mutate()}
          disabled={!complete || submit.isPending}
          className="ikf-btn-primary inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submit.isPending ? "Sending…" : "Send my update"} <ArrowRight size={16} />
        </button>
        <Link to="/ikf360/dashboard" className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>Skip for now</Link>
      </div>
    </div>
  );
}
