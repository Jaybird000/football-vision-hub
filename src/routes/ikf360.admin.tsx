import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Filter } from "lucide-react";
import { PROFILES, READINESS_META, STAGE_META, type Stage, type Readiness } from "@/lib/ikf360-data";

export const Route = createFileRoute("/ikf360/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const loc = useLocation();
  const isDetail = loc.pathname !== "/ikf360/admin" && loc.pathname.startsWith("/ikf360/admin/");
  if (isDetail) return <Outlet />;
  return <AdminList />;
}

function AdminList() {
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [readiness, setReadiness] = useState<Readiness | "all">("all");

  const filtered = PROFILES.filter(p =>
    (stage === "all" || p.stage === stage) &&
    (readiness === "all" || p.readiness === readiness) &&
    (q === "" || (p.childName + p.parentName + p.city).toLowerCase().includes(q.toLowerCase()))
  );

  const stats = {
    total: PROFILES.length,
    s1: PROFILES.filter(p => p.stage === 1).length,
    s2: PROFILES.filter(p => p.stage === 2).length,
    s3: PROFILES.filter(p => p.stage === 3).length,
  };

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--ikf-brand)" }}>Advisor console</div>
        <h1 className="text-[34px] leading-tight">Profiles</h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
          Every parent–child pair across every stage. Click a row to open the full file.
        </p>
      </header>

      <section className="grid sm:grid-cols-4 gap-4">
        <Stat label="Total profiles" value={stats.total.toString()} />
        <Stat label="Stage 1 — Intent" value={stats.s1.toString()} />
        <Stat label="Stage 2 — Assessment" value={stats.s2.toString()} />
        <Stat label="Stage 3 — Pathway" value={stats.s3.toString()} accent />
      </section>

      <section className="ikf-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ikf-text-dim)" }} />
          <input value={q} onChange={e => setQ(e.target.value)} className="ikf-input pl-9" placeholder="Search by name or city" />
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <Filter size={14} style={{ color: "var(--ikf-text-dim)" }} />
          <FilterBtn label="All stages" active={stage === "all"} onClick={() => setStage("all")} />
          <FilterBtn label="1" active={stage === 1} onClick={() => setStage(1)} />
          <FilterBtn label="2" active={stage === 2} onClick={() => setStage(2)} />
          <FilterBtn label="3" active={stage === 3} onClick={() => setStage(3)} />
        </div>
        <div className="flex items-center gap-2 text-[12px]">
          <FilterBtn label="Any readiness" active={readiness === "all"} onClick={() => setReadiness("all")} />
          <FilterBtn label="High" active={readiness === "high"} onClick={() => setReadiness("high")} />
          <FilterBtn label="Medium" active={readiness === "medium"} onClick={() => setReadiness("medium")} />
          <FilterBtn label="Forming" active={readiness === "forming"} onClick={() => setReadiness("forming")} />
        </div>
      </section>

      <section className="ikf-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-[0.12em]" style={{ color: "var(--ikf-text-dim)", background: "var(--ikf-surface-2)" }}>
                <th className="px-5 py-3 font-semibold">Child</th>
                <th className="px-5 py-3 font-semibold">Parent</th>
                <th className="px-5 py-3 font-semibold">Stage</th>
                <th className="px-5 py-3 font-semibold">Readiness</th>
                <th className="px-5 py-3 font-semibold">Advisor</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const r = READINESS_META[p.readiness];
                return (
                  <tr key={p.id} className="border-t hover:bg-[var(--ikf-surface-2)] transition-colors" style={{ borderColor: "var(--ikf-border)" }}>
                    <td className="px-5 py-4">
                      <div className="font-bold">{p.childName}</div>
                      <div className="text-[12px]" style={{ color: "var(--ikf-text-dim)" }}>Age {p.childAge} · {p.city}</div>
                    </td>
                    <td className="px-5 py-4">{p.parentName}</td>
                    <td className="px-5 py-4">
                      <span className="ikf-chip" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-text)" }}>{STAGE_META[p.stage].label.split("—")[0]}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="ikf-chip" style={{ background: r.bg, color: r.color }}>{r.label}</span>
                    </td>
                    <td className="px-5 py-4">{p.advisor.name}</td>
                    <td className="px-5 py-4" style={{ color: "var(--ikf-text-dim)" }}>{p.joinedOn}</td>
                    <td className="px-5 py-4 text-right">
                      <Link to="/ikf360/admin/$id" params={{ id: p.id }} className="ikf-btn-ghost text-[12px] py-1.5 px-3">Open</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="ikf-card p-5">
      <div className="text-[11px] uppercase tracking-[0.14em] mb-2" style={{ color: "var(--ikf-text-dim)" }}>{label}</div>
      <div className="text-[28px] font-black leading-none" style={{ color: accent ? "var(--ikf-brand)" : "var(--ikf-text)" }}>{value}</div>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="px-2.5 py-1 rounded-md text-[12px] font-semibold transition-colors"
      style={active
        ? { background: "var(--ikf-brand)", color: "#0B1220" }
        : { background: "var(--ikf-surface-2)", color: "var(--ikf-text-dim)" }}>
      {label}
    </button>
  );
}
