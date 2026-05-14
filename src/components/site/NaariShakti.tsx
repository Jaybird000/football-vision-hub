import naariImg from "@/assets/naari-shakti.jpg";
import { useLang } from "@/lib/i18n";

export function NaariShakti() {
  const { t } = useLang();
  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={naariImg} alt="" loading="lazy" width={1400} height={1000} className="w-full h-full object-cover opacity-35" />
        <div className="absolute inset-0 bg-gradient-to-r from-pitch-black via-pitch-black/70 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        <div className="max-w-xl bg-pitch-black/70 backdrop-blur-sm p-10 md:p-12 border-l-4 border-neon-strike">
          <span className="text-neon-strike font-bold text-xs uppercase tracking-[0.25em]">Spotlight</span>
          <h2 className="font-display text-5xl md:text-6xl uppercase mt-4 leading-none">{t("home", "naariTitle")}</h2>
          <p className="mt-6 text-lg text-chalk/85 leading-relaxed">{t("home", "naariBody")}</p>
          <button className="mt-8 px-8 py-4 bg-neon-strike text-pitch-black font-display text-xl uppercase tracking-wide hover:scale-[1.03] transition-transform">
            {t("home", "naariCta")}
          </button>
        </div>
      </div>
    </section>
  );
}
