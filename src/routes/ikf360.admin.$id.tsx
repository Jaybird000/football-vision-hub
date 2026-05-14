import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Check, MessageSquarePlus, Save, Send } from "lucide-react";
import { PROFILES, READINESS_META, ASSESSMENTS } from "@/lib/ikf360-data";

export const Route = createFileRoute("/ikf360/admin/$id")({
  component: ProfileDetail,
});

function ProfileDetail() {
  const { id } = useParams({ from: "/ikf360/admin/$id" });
  const profile = PROFILES.find(p => p.id === id);
  const [scores, setScores] = useState(() =>
    profile?.scores.length
      ? Object.fromEntries(profile.scores.map(s => [s.key, s.score]))
      : { football: 50, technical: 50, mental: 50, academic: 50, personality: 50 }
  );
  const [note, setNote] = useState("");

  if (!profile) {
    return (
      <div className="ikf-card p-8 text-center">
        <p>Profile not found.</p>
        <Link to="/ikf360/admin" className="ikf-btn-ghost mt-4 inline-block">Back to list</Link>
      </div>
    );
  }

  const r = READINESS_META[profile.readiness];

  return (
    <div className="space-y-8">
      <Link to="/ikf360/admin" className="text-[12px] inline-flex items-center gap-1.5" style={{ color: "var(--ikf-text-dim)" }}>
        <ArrowLeft size={12} /> All profiles
      </Link>

      <header className="ikf-card p-7 grid md:grid-cols-[1fr_auto] gap-5 items-start">
        <div>
          <h1 className="text-[32px] leading-tight">{profile.childName}</h1>
          <div className="mt-1 text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
            Age {profile.childAge} · {profile.gender} · {profile.city}
          </div>
          <div className="mt-3 text-[13px]" style={{ color: "var(--ikf-text-dim)" }}>
            Parent: <span style={{ color: "var(--ikf-text)" }}>{profile.parentName}</span> · {profile.parentPhone}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="ikf-chip" style={{ background: r.bg, color: r.color }}>{r.label}</span>
          <span className="ikf-chip" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-text)" }}>Stage {profile.stage}</span>
        </div>
      </header>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Scoring interface */}
          <section className="ikf-card p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[18px]">Score the five dimensions</h2>
              <button className="ikf-btn-primary text-[12px] py-2 px-3 inline-flex items-center gap-1.5">
                <Save size={13} /> Save scores
              </button>
            </div>
            <div className="space-y-5">
              {(["football","technical","mental","academic","personality"] as const).map(k => (
                <div key={k}>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[13px] font-semibold capitalize">{labelFor(k)}</label>
                    <span className="font-mono text-[13px]">{scores[k]}</span>
                  </div>
                  <input type="range" min={0} max={100} value={scores[k]}
                    onChange={e => setScores({ ...scores, [k]: Number(e.target.value) })}
                    className="w-full accent-[var(--ikf-brand)]" />
                </div>
              ))}
            </div>
          </section>

          {/* Categorisation matrix */}
          <section className="ikf-card p-7">
            <h2 className="text-[18px] mb-4">Categorisation</h2>
            <div className="grid sm:grid-cols-3 gap-3 text-[13px]">
              <CatBox label="Player category" value={profile.playerCategory} />
              <CatBox label="Parent category" value={profile.parentCategory} />
              <CatBox label="Combo category" value={profile.comboCategory} highlight />
            </div>
            <div className="mt-5 pt-5 border-t" style={{ borderColor: "var(--ikf-border)" }}>
              <div className="text-[11px] uppercase tracking-[0.14em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>Issued recommendation</div>
              <div className="text-[15px] font-semibold mb-2">{profile.recommendation.headline}</div>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--ikf-text-dim)" }}>{profile.recommendation.body}</p>
              <button className="ikf-btn-primary text-[12px] py-2 px-3 inline-flex items-center gap-1.5 mt-4">
                <Send size={13} /> Re-issue to parent
              </button>
            </div>
          </section>

          {/* Uploaded documents */}
          <section className="ikf-card p-7">
            <h2 className="text-[18px] mb-4">Uploaded assessments</h2>
            <div className="space-y-2">
              {ASSESSMENTS.filter(a => a.status !== "pending").map(a => (
                <div key={a.key} className="flex items-center justify-between py-2.5 border-b last:border-0 text-[13px]" style={{ borderColor: "var(--ikf-border)" }}>
                  <div>
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>{a.provider} · {a.uploadedOn}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="ikf-chip" style={{ background: a.status === "verified" ? "#1A2A1F" : "#1F2A3D", color: a.status === "verified" ? "var(--ikf-success)" : "var(--ikf-accent)" }}>
                      {a.status === "verified" ? <Check size={11} /> : null} {a.status}
                    </span>
                    <button className="ikf-btn-ghost text-[11px] py-1 px-2">Open</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          {/* Advisor card + log note */}
          <section className="ikf-card p-6">
            <div className="text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--ikf-text-dim)" }}>Assigned advisor</div>
            <div className="font-bold text-[15px]">{profile.advisor.name}</div>
            <div className="text-[12px] mb-3" style={{ color: "var(--ikf-text-dim)" }}>{profile.advisor.role}</div>
            <button className="ikf-btn-ghost text-[12px] w-full">Reassign advisor</button>
          </section>

          <section className="ikf-card p-6">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--ikf-text-dim)" }}>
              <MessageSquarePlus size={12} /> Log interaction
            </div>
            <textarea value={note} onChange={e => setNote(e.target.value)} className="ikf-input min-h-[100px] resize-y" placeholder="Spoke to parent today about academy intake timing…" />
            <button className="ikf-btn-primary w-full text-[13px] mt-3">Save note</button>
          </section>

          <section className="ikf-card p-6">
            <div className="text-[11px] uppercase tracking-[0.14em] mb-3" style={{ color: "var(--ikf-text-dim)" }}>Activity</div>
            <ol className="space-y-3 text-[12px]">
              {profile.timeline.slice().reverse().map((e, i) => (
                <li key={i} className="flex gap-3">
                  <span className="font-mono w-[68px] flex-shrink-0" style={{ color: "var(--ikf-text-dim)" }}>{e.date.split(" ").slice(0, 2).join(" ")}</span>
                  <span>{e.text}</span>
                </li>
              ))}
            </ol>
          </section>

          <Link to="/ikf360/dashboard" className="ikf-btn-ghost w-full text-center text-[13px] block">View parent-facing dashboard</Link>
        </aside>
      </div>
    </div>
  );
}

function CatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="p-4 rounded-lg" style={{ background: "var(--ikf-surface-2)", border: highlight ? "1px solid var(--ikf-brand)" : "1px solid var(--ikf-border)" }}>
      <div className="text-[10px] uppercase tracking-[0.12em] mb-1.5" style={{ color: "var(--ikf-text-dim)" }}>{label}</div>
      <div className="font-semibold leading-snug" style={{ color: highlight ? "var(--ikf-brand)" : "var(--ikf-text)" }}>{value}</div>
    </div>
  );
}

function labelFor(k: string) {
  return ({ football: "Football Ability", technical: "Technical Strength", mental: "Mental Strength", academic: "Academic Performance", personality: "Personality Fit" } as Record<string,string>)[k];
}
