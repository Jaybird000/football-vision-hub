import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import { PROFILES, READINESS_META } from "@/lib/ikf360-data";

export const Route = createFileRoute("/ikf360/dashboard")({
  component: ParentDashboard,
});

function ParentDashboard() {
  // Demo: show the fully-progressed profile
  const p = PROFILES[0];
  const readiness = READINESS_META[p.readiness];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <header className="ikf-card p-7 grid md:grid-cols-[1fr_auto] gap-6 items-end">
        <div>
          <div className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>Family dashboard</div>
          <h1 className="text-[36px] leading-tight">{p.childName}</h1>
          <p className="mt-1 text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
            Age {p.childAge} · {p.gender} · {p.city}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="ikf-chip" style={{ background: readiness.bg, color: readiness.color }}>{readiness.label}</span>
          <span className="ikf-chip" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-text)" }}>Stage 3 · Pathway active</span>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: scorecard + recommendation */}
        <div className="lg:col-span-2 space-y-6">
          {/* 5-dimension scorecard */}
          <section className="ikf-card p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px]">Five-dimension scorecard</h2>
              <span className="text-[11px] uppercase tracking-[0.14em]" style={{ color: "var(--ikf-text-dim)" }}>Cycle 1 · May 2026</span>
            </div>
            <div className="space-y-4">
              {p.scores.map(s => (
                <div key={s.key}>
                  <div className="flex items-center justify-between mb-1.5 text-[13px]">
                    <span className="font-semibold">{s.label}</span>
                    <span className="flex items-center gap-3">
                      <span className="ikf-chip" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-text-dim)" }}>{s.band}</span>
                      <span className="font-mono w-8 text-right">{s.score}</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--ikf-surface-2)" }}>
                    <div className="h-full" style={{ width: `${s.score}%`, background: bandColor(s.band) }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t grid sm:grid-cols-3 gap-4 text-[12px]" style={{ borderColor: "var(--ikf-border)" }}>
              <Cell k="Player category" v={p.playerCategory} />
              <Cell k="Parent category" v={p.parentCategory} />
              <Cell k="Combo category" v={p.comboCategory} highlight />
            </div>
          </section>

          {/* Recommendation */}
          <section className="ikf-card p-7" style={{ borderColor: "var(--ikf-brand)" }}>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] mb-3" style={{ color: "var(--ikf-brand)" }}>
              <Sparkles size={12} /> Pathway recommendation
            </div>
            <h2 className="text-[22px] leading-snug">{p.recommendation.headline}</h2>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{p.recommendation.body}</p>
            <div className="mt-6">
              <div className="text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--ikf-text-dim)" }}>Next steps</div>
              <ul className="space-y-2">
                {p.recommendation.nextSteps.map((s, i) => (
                  <li key={i} className="flex items-start gap-3 text-[14px]">
                    <span className="mt-1 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>{i + 1}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Timeline */}
          <section className="ikf-card p-7">
            <h2 className="text-[18px] mb-5">Journey timeline</h2>
            <ol className="relative border-l pl-6 space-y-5" style={{ borderColor: "var(--ikf-border)" }}>
              {p.timeline.slice().reverse().map((e, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full" style={{ background: i === 0 ? "var(--ikf-brand)" : "var(--ikf-surface-2)", border: `2px solid ${i === 0 ? "var(--ikf-brand)" : "var(--ikf-border)"}` }} />
                  <div className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>{e.date}</div>
                  <div className="text-[14px] mt-0.5">{e.text}</div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        {/* Right: advisor + reassessment */}
        <aside className="space-y-6">
          <section className="ikf-card p-6">
            <div className="text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--ikf-text-dim)" }}>Your IKF advisor</div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-[18px]" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>
                {initials(p.advisor.name)}
              </div>
              <div>
                <div className="font-bold text-[15px]">{p.advisor.name}</div>
                <div className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>{p.advisor.role}</div>
              </div>
            </div>
            <div className="text-[12px] mb-4" style={{ color: "var(--ikf-text-dim)" }}>Last spoke {p.advisor.lastInteraction}</div>
            <button className="ikf-btn-primary w-full inline-flex items-center justify-center gap-2 text-[13px]">
              <MessageCircle size={14} /> Message Rahul
            </button>
          </section>

          <section className="ikf-card p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--ikf-text-dim)" }}>
              <Calendar size={12} /> Next reassessment
            </div>
            <div className="text-[18px] font-bold mb-1">November 2026</div>
            <div className="text-[12px] mb-4" style={{ color: "var(--ikf-text-dim)" }}>
              Refresh fitness, technical and academic reports — 6-month cycle.
            </div>
            <button className="ikf-btn-ghost w-full text-[13px]">Set reminder</button>
          </section>

          <section className="ikf-card p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--ikf-text-dim)" }}>
              <TrendingUp size={12} /> Cohort context
            </div>
            <div className="text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
              Arjun ranks in the top <b style={{ color: "var(--ikf-brand)" }}>12%</b> of 13-year-old boys in the IKF Eastern India cohort across the five dimensions.
            </div>
          </section>

          <Link to="/ikf360/admin" className="ikf-btn-ghost w-full text-center inline-flex items-center justify-center gap-2 text-[13px]">
            See advisor view <ArrowRight size={14} />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function Cell({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <div>
      <div className="uppercase tracking-[0.12em] text-[10px] mb-1" style={{ color: "var(--ikf-text-dim)" }}>{k}</div>
      <div className="font-semibold text-[13px]" style={{ color: highlight ? "var(--ikf-brand)" : "var(--ikf-text)" }}>{v}</div>
    </div>
  );
}

function bandColor(band: string) {
  return band === "Elite" ? "var(--ikf-brand)"
       : band === "Strong" ? "#A8E063"
       : band === "Developing" ? "var(--ikf-accent)"
       : "var(--ikf-text-dim)";
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).slice(0, 2).join("");
}
