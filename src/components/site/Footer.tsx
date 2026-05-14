import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useLang } from "@/lib/i18n";

export function Footer() {
  const { t } = useLang();
  return (
    <footer className="border-t border-chalk/10 pt-20 pb-12 bg-pitch-black">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12 pb-16 border-b border-chalk/10">
          <div className="max-w-lg">
            <h2 className="font-display text-5xl md:text-7xl leading-[0.9] uppercase">
              Kickstart the <span className="text-neon-strike">Revolution.</span>
            </h2>
            <p className="mt-4 text-chalk/60 uppercase tracking-widest text-xs font-bold italic">
              {t("donate", "sub")}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link to="/donate" className="bg-neon-strike text-pitch-black px-10 py-5 font-display text-3xl uppercase tracking-wide hover:scale-[1.02] transition-transform inline-block">
              {t("donate", "cta")}
            </Link>
            <p className="text-[10px] text-chalk/40 uppercase text-center tracking-widest">
              {t("donate", "note")}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 text-sm">
          <div className="col-span-2"><Logo /></div>
          <div>
            <h4 className="font-display text-lg uppercase mb-4 text-chalk/40">Pathway</h4>
            <ul className="space-y-2 text-chalk/70">
              <li><Link to="/players" className="hover:text-neon-strike">Players</Link></li>
              <li><Link to="/parents" className="hover:text-neon-strike">Parents</Link></li>
              <li><Link to="/coaches" className="hover:text-neon-strike">Coaches</Link></li>
              <li><Link to="/partners" className="hover:text-neon-strike">Partners</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-lg uppercase mb-4 text-chalk/40">Org</h4>
            <ul className="space-y-2 text-chalk/70">
              <li><Link to="/about" className="hover:text-neon-strike">About</Link></li>
              <li><Link to="/initiatives" className="hover:text-neon-strike">Initiatives</Link></li>
              <li><Link to="/donate" className="hover:text-neon-strike">Donate</Link></li>
            </ul>
          </div>
        </div>
        <p className="mt-12 text-[10px] text-chalk/40 uppercase tracking-widest">
          © India Khelo Football. Registered 80G Non-Profit. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
