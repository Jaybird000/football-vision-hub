import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";

const stages = [
  { num: "01", en: "Grassroots Trials", hi: "ज़मीनी ट्रायल्स", body_en: "Open city-round trials with a one-time ₹125 registration — free for girls and underprivileged players.", body_hi: "एकमुश्त ₹125 पंजीकरण पर खुले शहर-राउंड ट्रायल्स — लड़कियों और वंचित खिलाड़ियों के लिए निःशुल्क।" },
  { num: "02", en: "Zonal Camps", hi: "ज़ोनल कैंप", body_en: "Shortlisted players move to regional zonal rounds — completely free to attend.", body_hi: "चयनित खिलाड़ी क्षेत्रीय ज़ोनल राउंड्स के लिए जाते हैं — पूर्णत: निःशुल्क।" },
  { num: "03", en: "National Finals", hi: "राष्ट्रीय फाइनल्स", body_en: "The best converge for a national finals showcase in front of I-League and ISL scouts — fully funded.", body_hi: "सर्वश्रेष्ठ खिलाड़ी I-League और ISL स्काउट्स के सामने राष्ट्रीय फाइनल में प्रदर्शन करते हैं।" },
  { num: "04", en: "Academy Placement", hi: "अकादमी चयन", body_en: "Connect with professional academies and clubs — IKF charges no fee from clubs or players for the bridge.", body_hi: "पेशेवर अकादमियों और क्लबों से जुड़ाव — IKF क्लबों या खिलाड़ियों से कोई शुल्क नहीं लेता।" },
  { num: "05", en: "Pro Debut", hi: "प्रो डेब्यू", body_en: "The journey closes as our alumni take the field in India's top professional leagues.", body_hi: "हमारे पूर्व छात्र भारत की शीर्ष लीगों में पदार्पण करते हैं।" },
];

export function Pathway() {
  const { lang, t } = useLang();
  const [active, setActive] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Drive active stage from scroll position over the section
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // Progress 0..1 across the scroll area (excluding the sticky pin height)
      const total = rect.height - vh;
      if (total <= 0) return;
      const p = Math.min(1, Math.max(0, -rect.top / total));
      const idx = Math.min(stages.length - 1, Math.floor(p * stages.length));
      setActive(idx);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section ref={wrapRef} className="relative bg-pitch-green/10 border-y border-chalk/5" style={{ height: `${stages.length * 90}vh` }}>
      <div className="sticky top-0 h-screen flex items-center overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
          {/* Left: title + stage list (desktop) / compact title (mobile) */}
          <div className="lg:col-span-5">
            <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em]">{t("home", "pipelineEyebrow")}</span>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl uppercase mt-3 lg:mt-4 leading-[0.9]">{t("home", "pipelineTitle")}</h2>
            <p className="hidden lg:block mt-4 text-chalk/82 text-sm max-w-md">Scroll to walk the path — from a kid on a maidan to a contract in the Indian Super League.</p>

            <ol className="hidden lg:block mt-10 space-y-3">
              {stages.map((s, i) => {
                const isActive = i === active;
                const isPast = i < active;
                return (
                  <li key={s.num} className="flex items-center gap-4">
                    <span className={`grid place-items-center size-8 rounded-full text-xs font-display transition-colors ${isActive ? "bg-neon-strike text-ink" : isPast ? "bg-neon-strike/30 text-ink" : "bg-chalk/10 text-chalk/82"}`}>
                      {s.num}
                    </span>
                    <span className={`font-display uppercase tracking-wide transition-colors ${isActive ? "text-chalk text-xl" : "text-chalk/72 text-base"}`}>
                      {lang === "hi" ? s.hi : s.en}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Right: animated active stage card */}
          <div className="lg:col-span-7">
            <div className="relative min-h-[340px] md:min-h-[420px]">
              {stages.map((s, i) => (
                <article
                  key={s.num}
                  aria-hidden={i !== active}
                  className={`absolute inset-0 ml-0 md:ml-8 lg:ml-16 p-6 md:p-10 bg-paper-2 shadow-sm border-l-4 border-neon-strike transition-all duration-700 ease-out ${i === active ? "opacity-100 translate-y-0" : i < active ? "opacity-0 -translate-y-6 pointer-events-none" : "opacity-0 translate-y-6 pointer-events-none"}`}
                >
                  <div className="flex items-baseline gap-6 mb-6">
                    <span className="font-display text-[5rem] md:text-[8rem] leading-[0.8] text-gold-ink/80">{s.num}</span>
                    <span className="font-display uppercase tracking-widest text-chalk/72 text-xs">Stage {s.num} of 0{stages.length}</span>
                  </div>
                  <h3 className="font-display text-4xl md:text-6xl uppercase leading-[0.95]">
                    {lang === "hi" ? s.hi : s.en}
                  </h3>
                  <p className="mt-6 text-chalk/86 text-base md:text-lg leading-relaxed max-w-xl">
                    {lang === "hi" ? s.body_hi : s.body_en}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-chalk/5">
          <div
            className="h-full bg-neon-strike transition-[width] duration-500"
            style={{ width: `${((active + 1) / stages.length) * 100}%` }}
          />
        </div>
      </div>
    </section>
  );
}
