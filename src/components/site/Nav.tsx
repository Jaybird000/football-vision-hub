import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { LangToggle } from "./LangToggle";
import { useLang } from "@/lib/i18n";

export function Nav() {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  const links: Array<{ to: "/players" | "/coaches" | "/initiatives" | "/about"; label: string }> = [
    { to: "/players", label: t("nav", "players") },
    { to: "/coaches", label: t("nav", "coaches") },
    { to: "/initiatives", label: t("nav", "initiatives") },
    { to: "/about", label: t("nav", "about") },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-chalk/10 bg-pitch-black/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link to="/" className="flex items-center"><Logo /></Link>
        <div className="hidden md:flex items-center gap-8 text-xs uppercase tracking-widest font-bold">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="text-chalk/80 hover:text-neon-strike transition-colors" activeProps={{ className: "text-neon-strike" }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LangToggle />
          <Link to="/ikf360/admin" className="hidden md:inline-flex items-center gap-1.5 border border-chalk/20 text-chalk/80 px-3 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest hover:border-neon-strike hover:text-neon-strike transition-colors" activeProps={{ className: "border-neon-strike text-neon-strike" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-neon-strike" /> Admin
          </Link>
          <Link to="/donate" className="hidden sm:inline-flex bg-chalk text-pitch-black px-5 py-2 rounded-full font-bold text-xs uppercase tracking-wider hover:bg-neon-strike transition-colors">
            {t("nav", "donate")}
          </Link>
          <button onClick={() => setOpen(!open)} className="md:hidden text-chalk p-2" aria-label="menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-chalk/10 bg-pitch-black px-6 py-6 flex flex-col gap-4 text-sm uppercase tracking-widest font-bold">
          {links.map(l => (
            <Link key={l.to} to={l.to} className="text-chalk/80 hover:text-neon-strike" onClick={() => setOpen(false)}>
              {l.label}
            </Link>
          ))}
          <Link to="/parents" className="text-chalk/80 hover:text-neon-strike" onClick={() => setOpen(false)}>{t("nav", "parents")}</Link>
          <Link to="/partners" className="text-chalk/80 hover:text-neon-strike" onClick={() => setOpen(false)}>{t("nav", "partners")}</Link>
          <Link to="/ikf360/admin" className="text-chalk/80 hover:text-neon-strike" onClick={() => setOpen(false)}>Admin</Link>
          <Link to="/donate" className="text-neon-strike" onClick={() => setOpen(false)}>{t("nav", "donate")}</Link>
        </div>
      )}
    </nav>
  );
}
