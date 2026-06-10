import { useLang } from "@/lib/i18n";
import { Counter } from "./Counter";

const stats = [
  { to: 50000, suffix: "+", en: "Lives Engaged", hi: "खिलाड़ी जुड़े", accent: true,
    format: (n: number) => n >= 1000 ? `${(n/1000).toFixed(0)}K` : `${n}` },
  { to: 125, prefix: "₹", suffix: "", en: "One-Time City Registration", hi: "एकमुश्त शहर पंजीकरण" },
  { to: 0, suffix: "", en: "Free for Girls & Underprivileged", hi: "लड़कियों व वंचितों के लिए निःशुल्क",
    fixed: "FREE", accent: true },
  { to: 0, prefix: "₹", suffix: "", en: "Charged to Clubs", hi: "क्लबों से शुल्क",
    fixed: "₹0" },
];

export function StatsWall() {
  const { lang, t } = useLang();
  return (
    <section className="py-24 md:py-32 bg-pitch-black">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-display text-4xl md:text-6xl uppercase mb-12 md:mb-16 leading-[0.9]">{t("home", "statsTitle")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-chalk/10">
          {stats.map(s => (
            <div key={s.en} className="bg-paper-2 p-5 md:p-10">
              <div className={`font-display text-4xl sm:text-5xl md:text-7xl mb-2 leading-none ${s.accent ? "text-gold-ink" : "text-chalk"}`}>
                {s.fixed ? s.fixed : (
                  <Counter to={s.to} prefix={s.prefix} suffix={s.suffix} format={s.format} />
                )}
              </div>
              <div className="text-chalk/74 uppercase tracking-widest text-[10px] font-bold">{lang === "hi" ? s.hi : s.en}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
