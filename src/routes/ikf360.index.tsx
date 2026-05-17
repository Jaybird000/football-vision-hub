import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ClipboardList, Upload, LayoutDashboard, Users } from "lucide-react";

export const Route = createFileRoute("/ikf360/")({
  component: Overview,
});

const stages = [
  { to: "/ikf360/intent", num: "01", title: "Intent Form", desc: "Parent enters. 8 questions surface intent and readiness.", icon: ClipboardList, role: "Parent view" },
  { to: "/ikf360/upload", num: "02", title: "Upload Portal", desc: "9 third-party assessments uploaded into one profile.", icon: Upload, role: "Parent view" },
  { to: "/ikf360/dashboard", num: "03", title: "Parent Dashboard", desc: "Categorisation, recommendation, advisor and journey timeline.", icon: LayoutDashboard, role: "Parent view" },
  { to: "/ikf360/admin", num: "04", title: "Advisor Console", desc: "Profile list, scoring interface, recommendation issuer.", icon: Users, role: "Admin view" },
] as const;

function Overview() {
  return (
    <div className="space-y-12">
      <header className="space-y-4 max-w-3xl">
        <div className="ikf-chip" style={{ background: "var(--ikf-surface)", color: "var(--ikf-brand)" }}>Mockup walkthrough</div>
        <h1 className="text-[44px] leading-[1.05] tracking-tight">
          A complete clickable mockup of the<br />
          <span style={{ color: "var(--ikf-brand)" }}>IKF 360 Platform.</span>
        </h1>
        <p className="text-[16px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          Five surfaces, seeded with demo families, designed to be walked through end-to-end.
          Theme tokens live in one CSS block (<code style={{ color: "var(--ikf-brand)" }}>.ikf360-theme</code>) — change 8 variables to re-skin everything.
        </p>
      </header>

      <section className="grid md:grid-cols-2 gap-5">
        {stages.map(s => (
          <Link key={s.to} to={s.to} className="ikf-card p-7 group hover:border-[var(--ikf-brand)] transition-colors block">
            <div className="flex items-start justify-between">
              <div className="text-[12px] uppercase tracking-[0.18em]" style={{ color: "var(--ikf-text-dim)" }}>{s.role}</div>
              <s.icon size={20} style={{ color: "var(--ikf-brand)" }} />
            </div>
            <div className="mt-6 flex items-baseline gap-4">
              <div className="text-[44px] font-black leading-none" style={{ color: "var(--ikf-brand)" }}>{s.num}</div>
              <h3 className="text-[22px]">{s.title}</h3>
            </div>
            <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{s.desc}</p>
            <div className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold group-hover:gap-3 transition-all">
              Open <ArrowRight size={14} />
            </div>
          </Link>
        ))}
      </section>

      <section className="ikf-card p-8 grid md:grid-cols-3 gap-8">
        {[
          { k: "4", l: "Demo families seeded across stages" },
          { k: "9", l: "Third-party assessments mapped" },
          { k: "5×3", l: "Dimension × category matrix wired" },
        ].map(s => (
          <div key={s.l}>
            <div className="text-[44px] font-black leading-none" style={{ color: "var(--ikf-brand)" }}>{s.k}</div>
            <div className="mt-2 text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>{s.l}</div>
          </div>
        ))}
      </section>

      <section className="ikf-card p-7">
        <h3 className="text-[18px] mb-4">Production-ready notes</h3>
        <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
          <li>• Mobile-first layouts at every breakpoint</li>
          <li>• All colors reference 8 CSS variables</li>
          <li>• Mock data isolated in <code>src/lib/ikf360-data.ts</code></li>
          <li>• Routes file-based — drop-in for TanStack Start</li>
          <li>• Form scoring logic lives in pure functions</li>
          <li>• Component patterns match shadcn conventions</li>
        </ul>
      </section>

      <section className="ikf-card p-7">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] mb-1">Standalone mockup</h3>
            <p className="text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
              One self-contained HTML file with all 7 stages — paste into CodePen or JSFiddle.
            </p>
          </div>
          <Link to="/codepen-export" className="ikf-btn-primary inline-flex items-center gap-2 text-[13px]">
            Export to CodePen →
          </Link>
        </div>
      </section>
    </div>
  );
}
