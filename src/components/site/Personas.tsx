import { Link } from "@tanstack/react-router";
import playerImg from "@/assets/persona-player.jpg";
import parentImg from "@/assets/persona-parent.jpg";
import coachImg from "@/assets/persona-coach.jpg";
import partnerImg from "@/assets/persona-partner.jpg";
import { useLang } from "@/lib/i18n";

export function Personas() {
  const { lang, t } = useLang();
  const personas = [
    { to: "/players" as const, img: playerImg, en: "Players", hi: "खिलाड़ी", cta_en: "Join the trials", cta_hi: "ट्रायल में शामिल हों" },
    { to: "/parents" as const, img: parentImg, en: "Parents", hi: "अभिभावक", cta_en: "Support the dream", cta_hi: "सपने का साथ दें" },
    { to: "/coaches" as const, img: coachImg, en: "Coaches", hi: "कोच", cta_en: "Nominate talent", cta_hi: "प्रतिभा नामांकित करें" },
    { to: "/partners" as const, img: partnerImg, en: "Partners", hi: "साझेदार", cta_en: "Invest in India", cta_hi: "भारत में निवेश करें" },
  ];
  return (
    <section className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <h2 className="font-display text-5xl md:text-7xl uppercase mb-16 leading-[0.9]">{t("home", "personasTitle")}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {personas.map(p => (
            <Link key={p.to} to={p.to} className="group relative aspect-[3/4] overflow-hidden bg-pitch-green block">
              <img src={p.img} alt="" loading="lazy" width={800} height={1100} className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-pitch-black via-pitch-black/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h4 className="font-display text-4xl uppercase">{lang === "hi" ? p.hi : p.en}</h4>
                <span className="text-neon-strike text-[10px] font-bold uppercase tracking-widest mt-2 inline-block">
                  {lang === "hi" ? p.cta_hi : p.cta_en} →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
