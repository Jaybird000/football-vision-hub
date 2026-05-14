import { useLang } from "@/lib/i18n";

const stats = [
  { value: "100K+", en: "Players Scouted", hi: "खिलाड़ी देखे गए", accent: true },
  { value: "50+", en: "City Chapters", hi: "शहर अध्याय" },
  { value: "420", en: "Academy Placements", hi: "अकादमी चयन" },
  { value: "₹0", en: "Charged to Players", hi: "खिलाड़ियों से शुल्क", accent: true },
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
              <div className={`font-display text-6xl md:text-7xl mb-2 leading-none ${s.accent ? "text-neon-strike" : "text-chalk"}`}>{s.value}</div>
              <div className="text-chalk/50 uppercase tracking-widest text-[10px] font-bold">{lang === "hi" ? s.hi : s.en}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
