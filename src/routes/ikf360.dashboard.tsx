import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Sparkles, ArrowRight, Clock, MessageCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getMyCategorisation } from "@/server/stage3";
import { getMyStage2 } from "@/server/stage2";

export const Route = createFileRoute("/ikf360/dashboard")({
  loader: async () => ({
    categorisation: await getMyCategorisation(),
    stage2: await getMyStage2(),
  }),
  component: ParentDashboard,
});

function ParentDashboard() {
  const { categorisation: initialCat, stage2: initialStage2 } = Route.useLoaderData();
  const { data: cat = initialCat } = useQuery({
    queryKey: ["myCategorisation"],
    queryFn: () => getMyCategorisation(),
    initialData: initialCat,
  });
  const { data: stage2 = initialStage2 } = useQuery({
    queryKey: ["stage2"],
    queryFn: () => getMyStage2(),
    initialData: initialStage2,
  });

  // Not logged in / no profile yet
  if (!stage2.profileId) {
    return (
      <EmptyCard
        title="Complete the Intent Form first"
        body="Your dashboard appears here once you've finished Stage 1."
        to="/ikf360/intent"
        cta="Go to Intent Form"
      />
    );
  }

  // Profile exists but no categorisation yet — show waiting state
  if (!cat) {
    return (
      <div className="max-w-3xl mx-auto">
        <Header childName={stage2.childName} />
        <div className="ikf-card p-7 mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <Clock size={20} style={{ color: "var(--ikf-brand)" }} />
            <h2 className="text-[18px] font-bold">Your recommendation is being prepared.</h2>
          </div>
          <p className="text-[14px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
            {stage2.minimumDatasetReached
              ? "All required reports are in. An IKF advisor will review and publish your child's recommendation within 48 hours."
              : `${stage2.uploadedRequiredCount} of ${stage2.requiredKeys.length} required reports uploaded. Upload the rest to unlock your recommendation.`}
          </p>
          <Link to="/ikf360/upload" className="ikf-btn-primary inline-flex items-center gap-2 text-[13px]">
            Open upload portal <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Header childName={stage2.childName} />

      {/* Category summary */}
      <div className="ikf-card p-7 mt-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--ikf-brand)" }}>Your category</div>
            <h2 className="text-[24px] font-bold mt-1">{cat.cellTitle || "Recommendation"}</h2>
          </div>
          <div className="text-right text-[11px]" style={{ color: "var(--ikf-text-dim)" }}>
            <div className="flex items-center gap-1.5 justify-end">
              <Calendar size={11} /> Scored {new Date(cat.scoredAt).toLocaleDateString()}
            </div>
            {cat.validUntil && (
              <div className="mt-0.5">Next review by {new Date(cat.validUntil).toLocaleDateString()}</div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-2 border-t" style={{ borderColor: "var(--ikf-border)" }}>
          {cat.axisValues.map(av => (
            <span key={av.axisKey} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px]" style={{ background: "var(--ikf-surface-2)" }}>
              <span style={{ color: "var(--ikf-text-dim)" }}>{av.axisName}:</span>
              <span className="font-semibold">{av.valueLabel}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Recommendation body */}
      <div className="ikf-card p-7 mt-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} style={{ color: "var(--ikf-brand)" }} />
          <h3 className="text-[15px] uppercase tracking-[0.12em] font-bold">Your recommendation</h3>
        </div>
        <div
          className="ikf-prose text-[14px] leading-relaxed"
          style={{ color: "var(--ikf-text)" }}
        >
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-[20px] font-bold mt-5 first:mt-0 mb-2">{children}</h1>,
              h2: ({ children }) => <h2 className="text-[16px] font-bold mt-4 first:mt-0 mb-2">{children}</h2>,
              h3: ({ children }) => <h3 className="text-[14px] font-bold uppercase tracking-[0.08em] mt-4 first:mt-0 mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>{children}</h3>,
              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              em: ({ children }) => <em className="italic">{children}</em>,
              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline" style={{ color: "var(--ikf-brand)" }}>{children}</a>,
              code: ({ children }) => <code className="px-1 py-0.5 rounded text-[12px]" style={{ background: "var(--ikf-surface-2)" }}>{children}</code>,
            }}
          >
            {cat.recommendationMd}
          </ReactMarkdown>
        </div>
      </div>

      {/* Advisor */}
      <div className="ikf-card p-7 mt-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full inline-flex items-center justify-center font-bold" style={{ background: "var(--ikf-surface-2)" }}>
            {(cat.scoredByName || "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--ikf-text-dim)" }}>Your IKF advisor</div>
            <div className="font-semibold">{cat.scoredByName || "Unassigned"}</div>
          </div>
        </div>
        <div className="text-[12px] inline-flex items-center gap-1.5" style={{ color: "var(--ikf-text-dim)" }}>
          <MessageCircle size={12} /> Contact channel coming soon
        </div>
      </div>
    </div>
  );
}

function Header({ childName }: { childName: string | null }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.16em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>
        Stage 3 of 3 — Recommendation
      </div>
      <h1 className="text-[34px] leading-tight">{childName ? `${childName}'s pathway` : "Your pathway"}</h1>
    </div>
  );
}

function EmptyCard({ title, body, to, cta }: { title: string; body: string; to: string; cta: string }) {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="ikf-card p-8 text-center space-y-4">
        <h1 className="text-[28px] leading-tight">{title}</h1>
        <p className="text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>{body}</p>
        <Link to={to} className="ikf-btn-primary inline-flex items-center gap-2">
          {cta} <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
