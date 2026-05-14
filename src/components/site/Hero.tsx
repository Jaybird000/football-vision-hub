import heroImg from "@/assets/hero-maidan.jpg";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";

export function Hero() {
  const { t } = useLang();
  return (
    <section className="relative min-h-[92vh] flex items-end overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={heroImg} alt="" width={1920} height={1280} className="w-full h-full object-cover opacity-65" />
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-black via-pitch-black/40 to-pitch-black/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-pitch-black/80 via-transparent to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24 pt-32 w-full animate-fade-up">
        <span className="inline-block text-neon-strike font-display text-lg uppercase tracking-[0.25em] mb-6">
          The Grassroots Pipeline
        </span>
        <h1 className="font-display uppercase italic leading-[0.85] tracking-tighter text-[clamp(3.5rem,11vw,12rem)]">
          {t("home", "heroLine1")} <span className="text-neon-strike not-italic">{t("home", "heroStreet")}</span>
          <br />
          {t("home", "heroLine2") && <>{t("home", "heroLine2")} </>}
          <span className="underline decoration-neon-strike decoration-[6px] underline-offset-[12px]">{t("home", "heroStadium")}</span>
        </h1>
        <p className="mt-8 max-w-xl text-base md:text-lg text-chalk/80 leading-relaxed">
          {t("home", "heroSub")}
        </p>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link to="/players" className="bg-neon-strike text-pitch-black px-8 py-4 font-display text-2xl uppercase tracking-wide hover:scale-[1.03] transition-transform">
            {t("home", "ctaPrimary")}
          </Link>
          <Link to="/initiatives" className="border border-chalk/30 px-8 py-4 font-display text-2xl uppercase tracking-wide hover:bg-chalk/10 transition-colors">
            {t("home", "ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
