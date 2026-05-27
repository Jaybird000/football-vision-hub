import { createFileRoute, Link, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, FileText, Settings, Database, Layers, Grid3x3 } from "lucide-react";
import { currentUser } from "@/server/auth";
import { listAdminProfiles, type AdminProfileRow } from "@/server/admin";

export const Route = createFileRoute("/ikf360/admin")({
  beforeLoad: async () => {
    const user = await currentUser();
    if (!user || (user.role !== "admin" && user.role !== "advisor")) {
      throw redirect({ to: "/admin-login" });
    }
  },
  loader: async () => ({ initial: await listAdminProfiles() }),
  component: AdminLayout,
});

function AdminLayout() {
  const loc = useLocation();
  const isDetail = loc.pathname !== "/ikf360/admin" && loc.pathname.startsWith("/ikf360/admin/");
  if (isDetail) return <Outlet />;
  return <AdminList />;
}

function AdminList() {
  const { initial } = Route.useLoaderData();
  const { data: profiles = initial } = useQuery({
    queryKey: ["admin", "profiles"],
    queryFn: () => listAdminProfiles(),
    initialData: initial,
  });

  const [q, setQ] = useState("");
  const [readiness, setReadiness] = useState<"all" | "high" | "medium" | "forming">("all");

  const filtered = profiles.filter((p: AdminProfileRow) =>
    (readiness === "all" || p.readiness === readiness) &&
    (q === "" || (p.childName + " " + p.parentName + " " + p.parentEmail).toLowerCase().includes(q.toLowerCase()))
  );

  const stats = {
    total: profiles.length,
    s1: profiles.filter(p => p.stage === 1).length,
    s2: profiles.filter(p => p.stage === 2).length,
    s3: profiles.filter(p => p.stage === 3).length,
  };

  return (
    <div className="space-y-8">
      <header>
        <div className="text-[11px] uppercase tracking-[0.18em] mb-2" style={{ color: "var(--ikf-brand)" }}>Advisor console</div>
        <h1 className="text-[34px] leading-tight">Profiles</h1>
        <p className="mt-2 text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
          Every parent–child pair across every stage. Live from Postgres.
        </p>
      </header>

      <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminLink to="/ikf360/admin/templates" icon={<Settings size={16} />} label="Templates" hint="Toggle required Stage 2 reports" />
        <AdminLink to="/ikf360/admin/providers" icon={<Database size={16} />} label="Providers" hint="Provider directory per assessment" />
        <AdminLink to="/ikf360/admin/axes" icon={<Layers size={16} />} label="Axes" hint="Stage 3 categorisation axes + values" />
        <AdminLink to="/ikf360/admin/cells" icon={<Grid3x3 size={16} />} label="Cells" hint="Recommendation copy per cell" />
      </section>

      <section className="grid sm:grid-cols-4 gap-4">
        <Stat label="Total profiles" value={stats.total.toString()} />
        <Stat label="Stage 1" value={stats.s1.toString()} />
        <Stat label="Stage 2" value={stats.s2.toString()} />
        <Stat label="Stage 3" value={stats.s3.toString()} accent />
      </section>

      <section className="ikf-card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--ikf-text-dim)" }} />
          <input
            className="ikf-input pl-9"
            placeholder="Search by child, parent, email"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <select className="ikf-input w-auto" value={readiness} onChange={e => setReadiness(e.target.value as typeof readiness)}>
          <option value="all">All readiness</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="forming">Forming</option>
        </select>
      </section>

      <section className="ikf-card overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-10 text-center text-[14px]" style={{ color: "var(--ikf-text-dim)" }}>
            <FileText size={28} className="mx-auto mb-3 opacity-50" />
            No profiles match.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead style={{ background: "var(--ikf-surface-2)" }}>
              <tr className="text-left uppercase tracking-[0.14em] text-[10px]">
                <th className="p-4">Child</th>
                <th className="p-4">Parent</th>
                <th className="p-4">Readiness</th>
                <th className="p-4">Stage</th>
                <th className="p-4 text-right">Uploads (req / total)</th>
                <th className="p-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t hover:bg-white/5" style={{ borderColor: "var(--ikf-border)" }}>
                  <td className="p-4 font-semibold">
                    <Link to="/ikf360/admin/profiles/$id" params={{ id: p.id }} className="hover:underline" style={{ color: "var(--ikf-brand)" }}>
                      {p.childName}
                    </Link>
                  </td>
                  <td className="p-4">
                    <div>{p.parentName}</div>
                    <div className="text-[11px]" style={{ color: "var(--ikf-text-dim)" }}>{p.parentEmail}</div>
                  </td>
                  <td className="p-4"><ReadinessBadge r={p.readiness} /></td>
                  <td className="p-4">Stage {p.stage}</td>
                  <td className="p-4 text-right tabular-nums">{p.uploadsRequired} / {p.uploadsTotal}</td>
                  <td className="p-4" style={{ color: "var(--ikf-text-dim)" }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function AdminLink({ to, icon, label, hint }: { to: string; icon: React.ReactNode; label: string; hint: string }) {
  return (
    <Link
      to={to}
      className="ikf-card p-4 flex items-start gap-3 hover:opacity-100 transition-opacity"
    >
      <div className="p-2 rounded-md" style={{ background: "var(--ikf-surface-2)", color: "var(--ikf-brand)" }}>
        {icon}
      </div>
      <div>
        <div className="font-semibold text-[14px]">{label}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "var(--ikf-text-dim)" }}>{hint}</div>
      </div>
    </Link>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="ikf-card p-5">
      <div className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "var(--ikf-text-dim)" }}>{label}</div>
      <div className="text-[28px] font-bold mt-1" style={{ color: accent ? "var(--ikf-brand)" : undefined }}>{value}</div>
    </div>
  );
}

function ReadinessBadge({ r }: { r: "high" | "medium" | "forming" }) {
  const map = {
    high:    { bg: "rgba(34,197,94,0.12)",  color: "#22c55e" },
    medium:  { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
    forming: { bg: "rgba(160,160,160,0.12)", color: "#9ca3af" },
  };
  const cfg = map[r];
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.12em] font-bold" style={{ background: cfg.bg, color: cfg.color }}>
      {r}
    </span>
  );
}
