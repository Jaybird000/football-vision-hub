import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Eye } from "lucide-react";

export const Route = createFileRoute("/ikf360")({
  head: () => ({
    meta: [
      { title: "IKF 360 Platform — Internal Mockup" },
      { name: "description", content: "Clickable mockup of the IKF Career 360 platform — Intent → Assessment → Pathway." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: IKF360Layout,
});

function IKF360Layout() {
  const loc = useLocation();
  const tabs: { to: string; label: string; role: "Parent" | "Admin" }[] = [
    { to: "/ikf360", label: "Overview", role: "Parent" },
    { to: "/ikf360/intent", label: "1 · Intent Form", role: "Parent" },
    { to: "/ikf360/upload", label: "2 · Upload Portal", role: "Parent" },
    { to: "/ikf360/dashboard", label: "3 · Parent Dashboard", role: "Parent" },
    { to: "/ikf360/admin", label: "Admin · Profiles", role: "Admin" },
  ];
  return (
    <div className="ikf360-theme">
      {/* Demo banner */}
      <div className="bg-[#DFFF5E] text-[#0B1220] text-[11px] font-bold uppercase tracking-[0.18em] py-2 px-4 flex items-center justify-center gap-3 flex-wrap">
        <Eye size={12} />
        Internal mockup — seeded data, no backend
        <Link to="/" className="underline opacity-70 hover:opacity-100 normal-case font-semibold tracking-normal text-[12px] inline-flex items-center gap-1">
          <ArrowLeft size={12} /> Back to public site
        </Link>
      </div>

      {/* Top nav */}
      <header className="border-b" style={{ borderColor: "var(--ikf-border)", background: "var(--ikf-surface)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6 flex-wrap">
          <Link to="/ikf360" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center font-black text-[15px]" style={{ background: "var(--ikf-brand)", color: "#0B1220" }}>360</div>
            <div>
              <div className="text-[15px] font-bold leading-tight">IKF Career 360</div>
              <div className="text-[11px]" style={{ color: "var(--ikf-text-dim)" }}>Pathway Platform</div>
            </div>
          </Link>
          <nav className="flex items-center gap-1 flex-wrap">
            {tabs.map(t => {
              const active = loc.pathname === t.to || (t.to !== "/ikf360" && loc.pathname.startsWith(t.to));
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className="px-3 py-2 rounded-md text-[13px] font-semibold transition-colors"
                  style={active
                    ? { background: "var(--ikf-brand)", color: "#0B1220" }
                    : { color: "var(--ikf-text-dim)" }}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t mt-20 py-8 text-center text-[11px] uppercase tracking-[0.2em]" style={{ borderColor: "var(--ikf-border)", color: "var(--ikf-text-dim)" }}>
        IKF 360 · Mockup v0.1 · May 2026
      </footer>
    </div>
  );
}
