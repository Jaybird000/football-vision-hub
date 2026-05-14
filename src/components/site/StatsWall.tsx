import { useLang } from "@/lib/i18n";
import { Counter } from "./Counter";

const stats = [
  { to: 100000, suffix: "+", en: "Players Scouted", hi: "खिलाड़ी देखे गए", accent: true,
    format: (n: number) => n >= 1000 ? `${(n/1000).toFixed(0)}K` : `${n}` },
  { to: 50, suffix: "+", en: "City Chapters", hi: "शहर अध्याय" },
  { to: 420, suffix: "", en: "Academy Placements", hi: "अकादमी चयन" },
  { to: 0, prefix: "₹", suffix: "", en: "Charged to Players", hi: "खिलाड़ियों से शुल्क", accent: true,
    fixed: "₹0" },
];

export function StatsWall() {
  const { lang, t } = useLang();
  return (
    <section className="py-24 md:py-32 bg-pitch-black">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-display text-5xl md:text-6xl uppercase mb-16 leading-[0.9]">{t("home", "statsTitle")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-chalk/10">
          {stats.map(s => (
            <div key={s.en} className="bg-pitch-black p-8 md:p-10">
              <div className={`font-display text-6xl md:text-7xl mb-2 leading-none ${s.accent ? "text-neon-strike" : "text-chalk"}`}>
                {s.fixed ? s.fixed : (
                  <Counter to={s.to} prefix={s.prefix} suffix={s.suffix} format={s.format} />
                )}
              </div>
              <div className="text-chalk/50 uppercase tracking-widest text-[10px] font-bold">{lang === "hi" ? s.hi : s.en}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
