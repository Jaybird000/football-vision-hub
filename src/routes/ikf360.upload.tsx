import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Clock, ExternalLink, FileUp, ShieldCheck, ArrowRight } from "lucide-react";
import { ASSESSMENTS, type Assessment } from "@/lib/ikf360-data";

export const Route = createFileRoute("/ikf360/upload")({
  component: UploadPortal,
});

function UploadPortal() {
  const [items, setItems] = useState<Assessment[]>(ASSESSMENTS);
  const required = items.filter(i => i.required);
  const requiredDone = required.filter(i => i.status !== "pending").length;
  const totalDone = items.filter(i => i.status !== "pending").length;
  const percent = Math.round((totalDone / items.length) * 100);
  const stage3Unlocked = requiredDone === required.length;

  function simulateUpload(key: string) {
    setItems(prev => prev.map(i => i.key === key ? { ...i, status: "uploaded", uploadedOn: "Today" } : i));
  }

  const grouped = items.reduce<Record<string, Assessment[]>>((acc, a) => {
    (acc[a.category] ||= []).push(a); return acc;
  }, {});

  return (
    <div className="space-y-10">
      <header className="grid md:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--ikf-brand)" }}>Stage 2 of 3 — Assessment</div>
          <h1 className="text-[34px] leading-tight">Build the picture of your child.</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
            We don't run these tests ourselves — we work with vetted partners. Upload the reports here as you receive them. Required reports unlock your pathway recommendation.
          </p>
        </div>
        <div className="ikf-card p-5 min-w-[260px]">
          <div className="flex items-center justify-between text-[12px] mb-2">
            <span style={{ color: "var(--ikf-text-dim)" }}>Profile completion</span>
            <span className="font-bold">{percent}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: "var(--ikf-surface-2)" }}>
            <div className="h-full transition-all" style={{ width: `${percent}%`, background: "var(--ikf-brand)" }} />
          </div>
          <div className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>
            {requiredDone} of {required.length} required reports in
          </div>
        </div>
      </header>

      <div className="ikf-card p-4 flex items-center gap-3 text-[13px]" style={{ borderColor: stage3Unlocked ? "var(--ikf-brand)" : "var(--ikf-border)" }}>
        <ShieldCheck size={18} style={{ color: stage3Unlocked ? "var(--ikf-brand)" : "var(--ikf-text-dim)" }} />
        <div className="flex-1">
          {stage3Unlocked
            ? <>Minimum required dataset reached. Your advisor has been notified — Stage 3 recommendation will be issued within 48 hours.</>
            : <>Upload all <b>required</b> reports to unlock Stage 3. Optional reports enrich your recommendation but aren't blocking.</>
          }
        </div>
        {stage3Unlocked && (
          <Link to="/ikf360/dashboard" className="ikf-btn-primary text-[12px] py-2 px-3 inline-flex items-center gap-1.5">
            See Stage 3 <ArrowRight size={13} />
          </Link>
        )}
      </div>

      {Object.entries(grouped).map(([cat, list]) => (
        <section key={cat}>
          <h2 className="text-[18px] mb-4 flex items-center gap-3">
            {cat}
            <span className="text-[11px] font-normal uppercase tracking-[0.14em]" style={{ color: "var(--ikf-text-dim)" }}>
              {list.length} {list.length === 1 ? "report" : "reports"}
            </span>
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {list.map(a => <AssessmentCard key={a.key} item={a} onUpload={() => simulateUpload(a.key)} />)}
          </div>
        </section>
      ))}
    </div>
  );
}

function AssessmentCard({ item, onUpload }: { item: Assessment; onUpload: () => void }) {
  const status = item.status;
  const meta = {
    pending:  { label: "Pending",  icon: Clock,  bg: "var(--ikf-surface-2)", color: "var(--ikf-text-dim)" },
    uploaded: { label: "Uploaded", icon: FileUp, bg: "#1F2A3D",              color: "var(--ikf-accent)" },
    verified: { label: "Verified", icon: Check,  bg: "#1A2A1F",              color: "var(--ikf-success)" },
  }[status];
  const Icon = meta.icon;

  return (
    <div className="ikf-card p-5 flex flex-col">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-[15px] font-bold leading-snug">{item.title}</h3>
          {item.required && <div className="text-[10px] uppercase tracking-[0.14em] mt-1" style={{ color: "var(--ikf-brand)" }}>Required</div>}
        </div>
        <span className="ikf-chip" style={{ background: meta.bg, color: meta.color }}>
          <Icon size={11} /> {meta.label}
        </span>
      </div>
      <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--ikf-text-dim)" }}>{item.desc}</p>
      <div className="text-[12px] mb-4 pb-4 border-b" style={{ color: "var(--ikf-text-dim)", borderColor: "var(--ikf-border)" }}>
        Provider: <span style={{ color: "var(--ikf-text)" }}>{item.provider}</span>
        {item.uploadedOn && <> · Uploaded {item.uploadedOn}</>}
      </div>
      <div className="flex gap-2 mt-auto">
        {status === "pending" ? (
          <>
            <button onClick={onUpload} className="ikf-btn-primary text-[12px] py-2 px-3 inline-flex items-center gap-1.5 flex-1 justify-center">
              <FileUp size={13} /> Upload report
            </button>
            <a href="#" onClick={e => e.preventDefault()} className="ikf-btn-ghost text-[12px] py-2 px-3 inline-flex items-center gap-1.5">
              <ExternalLink size={12} /> Find provider
            </a>
          </>
        ) : (
          <button className="ikf-btn-ghost text-[12px] py-2 px-3 w-full">View report</button>
        )}
      </div>
    </div>
  );
}
