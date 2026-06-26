import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, Upload, LayoutDashboard, MessagesSquare, CheckCircle2 } from "lucide-react";
import { getMyIntent } from "@/server/intent";

export const Route = createFileRoute("/ikf360/")({
  loader: async () => ({ existing: await getMyIntent() }),
  component: Overview,
});

const stages = [
  { to: "/ikf360/intent", num: "01", title: "Parent SOP", desc: "8 quick questions about your child and your hopes — surfaces where we should start.", icon: ClipboardList },
  { to: "/ikf360/upload", num: "02", title: "Upload Portal", desc: "Upload third-party assessments and reports into one profile.", icon: Upload },
  { to: "/ikf360/dashboard", num: "03", title: "Parent Dashboard", desc: "See your child's categorisation, recommendation, advisor and journey timeline.", icon: LayoutDashboard },
] as const;

function Overview() {
  const { existing } = Route.useLoaderData();
  const hasStarted = !!existing;
  const firstName = existing?.parentName.split(" ")[0];

  return (
    <div className="space-y-12">
      <header className="space-y-4 max-w-3xl">
        <h1 className="text-[40px] sm:text-[44px] leading-[1.05] tracking-tight">
          {hasStarted ? `Welcome back${firstName ? `, ${firstName}` : ""}.` : "Welcome to your child's IKF journey."}
          <br />
          <span style={{ color: "var(--ikf-brand-ink)" }}>
            {hasStarted ? "Pick up where you left off." : "Let's begin."}
          </span>
        </h1>
        <p className="text-[16px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          {hasStarted
            ? "Your Stage 1 details are saved. Continue to Stage 2 to upload assessment reports, or revisit the details you've already shared."
            : "Three stages, at your own pace. Look around below to see what's ahead — then start the Parent SOP whenever you're ready. It's about four minutes: eight questions about you and your child."}
        </p>
      </header>

      <section className="ikf-card p-6 sm:p-8 space-y-4">
        <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--ikf-brand-ink)" }}>What is IKF Pathway 360?</div>
        <p className="text-[15px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          IKF Pathway 360 is your child's personalised football roadmap. You share a little about your child, add a few assessment reports when you're ready, and an IKF advisor gives you a clear, honest picture of where they stand today — and the best next step forward. No jargon, no pressure.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 text-[13px]">
          <div><span className="font-semibold" style={{ color: "var(--ikf-text)" }}>1 · Parent SOP</span><div style={{ color: "var(--ikf-text-dim)" }}>Tell us about your child.</div></div>
          <div><span className="font-semibold" style={{ color: "var(--ikf-text)" }}>2 · Deep Assessment</span><div style={{ color: "var(--ikf-text-dim)" }}>Add reports at your own pace.</div></div>
          <div><span className="font-semibold" style={{ color: "var(--ikf-text)" }}>3 · Recommendation</span><div style={{ color: "var(--ikf-text-dim)" }}>A clear, personalised plan.</div></div>
        </div>
        <Link to="/parents/pathway" target="_blank" rel="noopener noreferrer" className="ikf-btn-primary inline-flex items-center gap-2 text-[13px]">
          Read the full parent guide <ArrowRight size={14} />
        </Link>
      </section>

      <section className="ikf-card p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5" style={{ background: "var(--ikf-surface-2)", borderColor: "var(--ikf-brand)" }}>
        <div className="flex items-start gap-4">
          {hasStarted ? (
            <CheckCircle2 size={28} className="mt-0.5 shrink-0" style={{ color: "var(--ikf-brand-ink)" }} />
          ) : (
            <ClipboardList size={28} className="mt-0.5 shrink-0" style={{ color: "var(--ikf-brand-ink)" }} />
          )}
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "var(--ikf-brand-ink)" }}>
              {hasStarted ? "Stage 1 complete" : "Start here · Stage 1"}
            </div>
            <h2 className="mt-1 text-[20px] sm:text-[22px]">
              {hasStarted ? "Your Parent SOP is on file" : "Begin with the Parent SOP"}
            </h2>
          </div>
        </div>
        {hasStarted ? (
          <div className="flex flex-wrap gap-3 lg:shrink-0">
            <Link
              to="/ikf360/intent"
              className="ikf-btn-ghost inline-flex items-center gap-2 whitespace-nowrap"
            >
              View details
            </Link>
            <Link
              to="/ikf360/upload"
              className="ikf-btn-primary inline-flex items-center gap-2 whitespace-nowrap"
            >
              Continue to Stage 2 <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <Link
            to="/ikf360/intent"
            className="ikf-btn-primary inline-flex items-center gap-2 whitespace-nowrap self-start lg:self-auto"
          >
            Let's get started <ArrowRight size={16} />
          </Link>
        )}
      </section>

      <section className="grid md:grid-cols-3 gap-5">
        {stages.map(s => (
          <Link key={s.to} to={s.to} className="ikf-card p-7 group hover:border-[var(--ikf-brand)] transition-colors block">
            <div className="flex items-start justify-between">
              <div className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "var(--ikf-text-dim)" }}>Stage {s.num}</div>
              <s.icon size={20} style={{ color: "var(--ikf-brand-ink)" }} />
            </div>
            <div className="mt-6 flex items-baseline gap-4">
              <div className="text-[44px] font-black leading-none" style={{ color: "var(--ikf-brand-ink)" }}>{s.num}</div>
              <h3 className="text-[22px]">{s.title}</h3>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{s.desc}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold group-hover:gap-3 transition-all">
              Open <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </section>

      <section>
        <div className="text-[12px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--ikf-text-dim)" }}>
          Outside the stage flow
        </div>
        <Link
          to="/ikf360/support"
          className="ikf-card p-7 group hover:border-[var(--ikf-brand)] transition-colors block"
          style={{ borderColor: "var(--ikf-brand)", borderStyle: "dashed" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "var(--ikf-brand-ink)" }}>Parent community</div>
              <h3 className="mt-3 text-[22px]">Parent Support Track</h3>
              <p className="mt-2 text-[14px] leading-relaxed max-w-2xl" style={{ color: "var(--ikf-text-dim)" }}>
                A parallel space for parents in the network — circles, advisor office hours, peer mentors, and a curated library.
                Not part of the 3-stage flow; available alongside it.
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold group-hover:gap-3 transition-all">
                Open <ArrowRight size={14} />
              </div>
            </div>
            <MessagesSquare size={28} style={{ color: "var(--ikf-brand-ink)" }} className="shrink-0" />
          </div>
        </Link>
      </section>

    </div>
  );
}
