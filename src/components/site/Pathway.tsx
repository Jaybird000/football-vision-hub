import { useLang } from "@/lib/i18n";

const stages = [
  { num: "01", en: "Grassroots Trials", hi: "ज़मीनी ट्रायल्स", body_en: "Free open trials across 50+ cities. The pitch finds you.", body_hi: "50+ शहरों में निःशुल्क खुले ट्रायल्स। मैदान आपको ढूँढता है।" },
  { num: "02", en: "Zonal Camps", hi: "ज़ोनल कैंप", body_en: "Top performers move to regional residential camps for 6 weeks of intensive scouting.", body_hi: "शीर्ष खिलाड़ी 6 सप्ताह के क्षेत्रीय कैंप के लिए चुने जाते हैं।" },
  { num: "03", en: "National Finals", hi: "राष्ट्रीय फाइनल्स", body_en: "The 200 best converge for a week-long showcase in front of ISL & I-League scouts.", body_hi: "200 सबसे अच्छे खिलाड़ी ISL और I-League स्काउट्स के सामने प्रदर्शन करते हैं।" },
  { num: "04", en: "Academy Placement", hi: "अकादमी चयन", body_en: "Direct contracts with professional academies — fully funded training, education and lodging.", body_hi: "पेशेवर अकादमियों में सीधा चयन — पूर्णत: प्रायोजित प्रशिक्षण।" },
  { num: "05", en: "Pro Debut", hi: "प्रो डेब्यू", body_en: "The journey closes as our alumni take the field in India's top professional leagues.", body_hi: "हमारे पूर्व छात्र भारत की शीर्ष लीगों में पदार्पण करते हैं।" },
];

export function Pathway() {
  const { lang, t } = useLang();
  return (
    <section className="py-24 md:py-32 bg-pitch-green/10 border-y border-chalk/5">
      <div className="max-w-7xl mx-auto px-6">
        <div className="max-w-2xl mb-16">
          <span className="text-neon-strike font-bold text-xs uppercase tracking-[0.25em]">{t("home", "pipelineEyebrow")}</span>
          <h2 className="font-display text-5xl md:text-7xl uppercase mt-4 leading-[0.9]">{t("home", "pipelineTitle")}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-1">
          {stages.map((s, i) => (
            <div key={s.num} className={`group bg-pitch-black p-8 border-l-4 ${i === 0 ? "border-neon-strike" : "border-chalk/15"} hover:border-neon-strike transition-colors duration-500 min-h-[280px] flex flex-col`}>
              <span className={`font-display text-5xl ${i === 0 ? "text-neon-strike/50" : "text-chalk/15"} group-hover:text-neon-strike/60 transition-colors`}>{s.num}</span>
              <h3 className="font-display text-2xl uppercase mt-2 leading-tight">{lang === "hi" ? s.hi : s.en}</h3>
              <p className="text-sm text-chalk/60 mt-4 italic leading-relaxed">{lang === "hi" ? s.body_hi : s.body_en}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
