import { Link, useLocation, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, X, LogOut, User } from "lucide-react";
import { Logo } from "./Logo";
import { LangToggle } from "./LangToggle";
import { useLang } from "@/lib/i18n";
import { currentUser, logout } from "@/server/auth";

const PARENT_TABS: { to: string; label: string }[] = [
  { to: "/ikf360", label: "Overview" },
  { to: "/ikf360/intent", label: "1 · Parent SOP" },
  { to: "/ikf360/upload", label: "2 · Upload Portal" },
  { to: "/ikf360/dashboard", label: "3 · Parent Dashboard" },
];

const ADMIN_TABS: { to: string; label: string }[] = [
  { to: "/ikf360/admin", label: "Profiles" },
  { to: "/ikf360/admin/templates", label: "Templates" },
  { to: "/ikf360/admin/providers", label: "Providers" },
  { to: "/ikf360/admin/axes", label: "Axes" },
  { to: "/ikf360/admin/cells", label: "Cells" },
];

export function Nav() {
  const { t } = useLang();
  const loc = useLocation();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isIkf360 = loc.pathname.startsWith("/ikf360");
  const isAdminArea = loc.pathname.startsWith("/ikf360/admin");

  const { data: user, refetch } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => currentUser(),
    staleTime: 60_000,
  });

  const isAdmin = user?.role === "admin" || user?.role === "advisor";
  const activeTabs = isAdmin ? ADMIN_TABS : PARENT_TABS;

  async function handleLogout() {
    await logout({});
    await refetch();
    setOpen(false);
    router.navigate({ to: "/" });
  }

  const publicLinks: Array<{ to: "/players" | "/coaches" | "/initiatives" | "/about"; label: string }> = [
    { to: "/players", label: t("nav", "players") },
    { to: "/coaches", label: t("nav", "coaches") },
    { to: "/initiatives", label: t("nav", "initiatives") },
    { to: "/about", label: t("nav", "about") },
  ];

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={
        isIkf360
          ? { background: "rgba(11, 18, 32, 0.92)", borderColor: "var(--ikf-border, rgba(255,255,255,0.08))" }
          : undefined
      }
    >
      {!isIkf360 && <div className="absolute inset-0 -z-10 bg-pitch-black/85 border-b border-chalk/10" />}
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between gap-6">
        <Link to="/" className="flex items-center"><Logo /></Link>

        {isIkf360 ? (
          <div className="hidden md:flex items-center gap-1 flex-wrap">
            {activeTabs.map(tab => {
              const active = loc.pathname === tab.to || (tab.to !== "/ikf360" && tab.to !== "/ikf360/admin" && loc.pathname.startsWith(tab.to)) || (tab.to === "/ikf360/admin" && loc.pathname === "/ikf360/admin");
              return (
                <Link
                  key={tab.to}
                  to={tab.to}
                  className="px-3 py-2 rounded-md text-[13px] font-semibold transition-colors"
                  style={active
                    ? { background: "var(--ikf-brand, #DFFF5E)", color: "#0B1220" }
                    : { color: "rgba(229,231,235,0.7)" }}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-bold">
            {publicLinks.map(l => (
              <Link key={l.to} to={l.to} className="text-chalk/80 hover:text-neon-strike transition-colors" activeProps={{ className: "text-neon-strike" }}>
                {l.label}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3">
          {!isIkf360 && <LangToggle />}
          {isIkf360 && isAdmin && (
            <Link
              to={isAdminArea ? "/ikf360" : "/ikf360/admin"}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold border border-chalk/20 text-chalk/80 hover:border-neon-strike hover:text-neon-strike transition-colors"
              title={isAdminArea ? "Switch to parent view" : "Switch to admin"}
            >
              {isAdminArea ? "Parent view" : "Admin console"}
            </Link>
          )}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              {!isIkf360 && (
                <Link
                  to={isAdmin ? "/ikf360/admin" : "/ikf360"}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-neon-strike/40 text-neon-strike font-bold text-[10px] uppercase tracking-widest hover:bg-neon-strike hover:text-pitch-black transition-colors"
                  title={isAdmin ? "Open admin console" : "Open my portal"}
                >
                  {isAdmin ? "Admin console" : "My portal"} →
                </Link>
              )}
              <div
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest"
                style={
                  isIkf360
                    ? { background: "rgba(255,255,255,0.06)", color: "rgba(229,231,235,0.9)" }
                    : { background: "rgba(255,255,255,0.04)", color: "rgba(229,231,235,0.85)", border: "1px solid rgba(255,255,255,0.12)" }
                }
              >
                <User size={12} />
                <span>{user.fullName.split(" ")[0]}</span>
                <span className="opacity-50">·</span>
                <span className="opacity-80">{user.role}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest text-chalk/80 hover:text-neon-strike transition-colors"
                title="Log out"
              >
                <LogOut size={12} /> Log out
              </button>
            </div>
          ) : (
            !isIkf360 && (
              <Link
                to="/login"
                className="hidden md:inline-flex text-chalk/80 px-3 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest hover:text-neon-strike transition-colors"
                activeProps={{ className: "text-neon-strike" }}
              >
                Log in
              </Link>
            )
          )}
          {!isIkf360 && (
            <Link to="/donate" className="hidden sm:inline-flex bg-chalk text-pitch-black px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-neon-strike transition-colors">
              {t("nav", "donate")}
            </Link>
          )}
          <button onClick={() => setOpen(!open)} className="md:hidden text-chalk p-2" aria-label="menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-chalk/10 bg-pitch-black px-6 py-6 flex flex-col gap-4 text-sm uppercase tracking-widest font-bold">
          {isIkf360
            ? activeTabs.map(tab => (
                <Link key={tab.to} to={tab.to} className="text-chalk/80 hover:text-neon-strike" onClick={() => setOpen(false)}>
                  {tab.label}
                </Link>
              ))
            : publicLinks.map(l => (
                <Link key={l.to} to={l.to} className="text-chalk/80 hover:text-neon-strike" onClick={() => setOpen(false)}>
                  {l.label}
                </Link>
              ))}

          {!isIkf360 && (
            <>
              <Link to="/parents" className="text-chalk/80 hover:text-neon-strike" onClick={() => setOpen(false)}>{t("nav", "parents")}</Link>
              <Link to="/partners" className="text-chalk/80 hover:text-neon-strike" onClick={() => setOpen(false)}>{t("nav", "partners")}</Link>
            </>
          )}

          {user ? (
            <>
              {!isIkf360 && (
                <Link
                  to={isAdmin ? "/ikf360/admin" : "/ikf360"}
                  className="text-neon-strike"
                  onClick={() => setOpen(false)}
                >
                  {isAdmin ? "Admin console →" : "My portal →"}
                </Link>
              )}
              <div className="text-chalk/80">{user.fullName} · {user.role}</div>
              <button onClick={handleLogout} className="text-left text-chalk/80 hover:text-neon-strike inline-flex items-center gap-2">
                <LogOut size={14} /> Log out
              </button>
            </>
          ) : (
            !isIkf360 && (
              <Link to="/login" className="text-chalk/80 hover:text-neon-strike" onClick={() => setOpen(false)}>Log in</Link>
            )
          )}

          {!isIkf360 && (
            <Link to="/donate" className="text-neon-strike" onClick={() => setOpen(false)}>{t("nav", "donate")}</Link>
          )}
        </div>
      )}
    </nav>
  );
}
