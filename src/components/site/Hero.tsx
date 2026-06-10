import heroImg from "@/assets/hero-maidan.jpg";
import { Link } from "@tanstack/react-router";
import { useLang } from "@/lib/i18n";
import { SplitReveal } from "./SplitReveal";
import { ctaSoundProps } from "@/lib/sound";

export function Hero() {
  const { t } = useLang();
  const line1 = t("home", "heroLine1");
  const street = t("home", "heroStreet");
  const line2 = t("home", "heroLine2");
  const stadium = t("home", "heroStadium");
  return (
    <section className="on-dark relative min-h-[92vh] flex items-end overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/* Optional silent documentary loop — falls back to image if video missing */}
        <video
          className="absolute inset-0 w-full h-full object-cover opacity-95 animate-ken-burns"
          autoPlay muted loop playsInline preload="metadata"
          poster={heroImg}
          aria-hidden
        >
          <source src="/hero-loop.mp4" type="video/mp4" />
        </video>
        <img src={heroImg} alt="" width={1920} height={1280} className="hidden" />
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-black via-pitch-black/25 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-pitch-black/70 via-pitch-black/10 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-24 pt-32 w-full">
        <span className="inline-block text-gold-ink font-display text-lg uppercase tracking-[0.25em] mb-6 animate-fade-up">
          The Grassroots Pipeline
        </span>
        <h1 className="font-display uppercase italic leading-[0.85] tracking-tighter text-[clamp(3.5rem,11vw,12rem)]">
          <SplitReveal text={`${line1} `} />
          <SplitReveal text={street} className="text-gold-ink not-italic mx-[0.1em]" delay={(line1.length + 1) * 0.025} />
          <br />
          {line2 && <SplitReveal text={`${line2} `} delay={0.4} />}
          <span className="underline decoration-neon-strike decoration-[6px] underline-offset-[12px]">
            <SplitReveal text={stadium} delay={0.4 + (line2?.length || 0) * 0.025} />
          </span>
        </h1>
        <p className="mt-8 max-w-xl text-base md:text-lg text-chalk/80 leading-relaxed animate-fade-up" style={{ animationDelay: "1.4s" }}>
          {t("home", "heroSub")}
        </p>
        <div className="mt-10 flex flex-wrap gap-4 animate-fade-up" style={{ animationDelay: "1.7s" }}>
          <Link to="/players" {...ctaSoundProps} className="cta-cursor bg-neon-strike text-ink px-8 py-4 font-display text-2xl uppercase tracking-wide hover:scale-[1.03] transition-transform">
            {t("home", "ctaPrimary")}
          </Link>
          <Link to="/initiatives" {...ctaSoundProps} className="cta-cursor border border-chalk/30 px-8 py-4 font-display text-2xl uppercase tracking-wide hover:bg-chalk/10 transition-colors">
            {t("home", "ctaSecondary")}
          </Link>
        </div>
      </div>
    </section>
  );
}
