import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, MessagesSquare, Calendar, Users2, BookOpen } from "lucide-react";

export const Route = createFileRoute("/ikf360/support")({
  component: ParentSupport,
});

const planks = [
  {
    icon: MessagesSquare,
    title: "Parent circles",
    body: "Small moderated groups of parents whose children are at the same stage. A place to talk through the day-to-day of supporting a young footballer — what's working, what's hard, what nobody warned you about.",
  },
  {
    icon: Calendar,
    title: "Advisor office hours",
    body: "Scheduled drop-in sessions where any parent in the network can bring a question to an IKF advisor — not their assigned one. Useful when you want a second perspective on a recommendation or pathway decision.",
  },
  {
    icon: Users2,
    title: "Peer mentors",
    body: "Parents who have been through the IKF Pathway 360 journey before and have chosen to support new families. Matched on context — region, age of child, situation — not luck.",
  },
  {
    icon: BookOpen,
    title: "A library, not a feed",
    body: "Curated reading on the parts of football parenting that get asked about most: nutrition, sleep, managing setbacks, school-versus-academy, the financial reality. Written for parents, not coaches.",
  },
];

function ParentSupport() {
  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/ikf360" className="text-[12px] uppercase tracking-[0.14em] inline-flex items-center gap-1 mb-3" style={{ color: "var(--ikf-text-dim)" }}>
        <ArrowLeft size={12} /> Back to overview
      </Link>

      <header className="space-y-4 max-w-2xl">
        <div className="ikf-chip" style={{ background: "var(--ikf-surface)", color: "var(--ikf-brand-ink)" }}>Parent Support Track</div>
        <h1 className="text-[32px] sm:text-[44px] leading-[1.05] tracking-tight">You are not doing this alone.</h1>
        <p className="text-[16px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>
          The three stages of IKF Pathway 360 give your child a structured path. The Parent Support Track is a parallel space — for you,
          not your child. A place to learn from other parents, ask hard questions, and find footing when the journey gets uncertain.
        </p>
      </header>

      <div className="mt-10 rounded-xl p-5 text-[13px]" style={{ background: "var(--ikf-surface-2)", border: "1px solid var(--ikf-border)", color: "var(--ikf-text-dim)" }}>
        <strong style={{ color: "var(--ikf-text)" }}>Opening in stages.</strong> Parent circles will be the first to open, with the
        rest following as the network grows. Your IKF advisor will let you know when an invitation is ready for your region.
      </div>

      <section className="mt-10 grid md:grid-cols-2 gap-5">
        {planks.map(p => {
          const Icon = p.icon;
          return (
            <div key={p.title} className="ikf-card p-7">
              <Icon size={20} style={{ color: "var(--ikf-brand-ink)" }} />
              <h3 className="mt-4 text-[20px]">{p.title}</h3>
              <p className="mt-3 text-[14px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{p.body}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
