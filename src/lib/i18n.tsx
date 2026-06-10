import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  nav: {
    pathway: { en: "Pathway", hi: "रास्ता" },
    initiatives: { en: "Initiatives", hi: "पहल" },
    about: { en: "About", hi: "हमारे बारे में" },
    players: { en: "Players", hi: "खिलाड़ी" },
    parents: { en: "Parents", hi: "पैरेंट्स" },
    parentPathway: { en: "Pathway 360", hi: "पाथवे 360" },
    coaches: { en: "Coaches", hi: "कोच" },
    partners: { en: "Partners", hi: "पार्टनर्स" },
    donate: { en: "Donate", hi: "डोनेट करें" },
  },
  home: {
    heroLine1: { en: "From the", hi: "गली से" },
    heroStreet: { en: "Street", hi: "मैदान तक" },
    heroLine2: { en: "To the", hi: "" },
    heroStadium: { en: "Stadium", hi: "स्टेडियम तक" },
    heroSub: {
      en: "IKF is building India's largest football scouting ecosystem. We find the talent — you build the future. 100% merit-based, 0% barriers.",
      hi: "IKF इंडिया का सबसे बड़ा फुटबॉल स्काउटिंग नेटवर्क बना रहा है। टैलेंट हम ढूँढते हैं — फ्यूचर आप बनाते हैं। 100% मेरिट पर, बिना किसी रुकावट के।",
    },
    ctaPrimary: { en: "Start Your Journey", hi: "अपनी जर्नी शुरू करें" },
    ctaSecondary: { en: "Watch the Pipeline", hi: "पाथवे देखें" },
    pipelineEyebrow: { en: "The Pathway", hi: "पाथवे" },
    pipelineTitle: { en: "Five stages. One dream.", hi: "पाँच स्टेज। एक सपना।" },
    personasTitle: { en: "Who are you?", hi: "आप कौन हैं?" },
    statsTitle: { en: "Built on the ground.", hi: "ज़मीन से बना।" },
    naariTitle: { en: "Naari Shakti", hi: "नारी शक्ति" },
    naariBody: {
      en: "Women's football is the fastest-growing track at IKF. Safe, competitive pathways for girls from every corner of Bharat.",
      hi: "वुमेंस फुटबॉल IKF का सबसे तेज़ी से बढ़ता ट्रैक है। इंडिया के हर कोने की लड़कियों के लिए सेफ और कॉम्पिटिटिव रास्ता।",
    },
    naariCta: { en: "Explore Women's Pathway", hi: "वुमेंस पाथवे देखें" },
  },
  donate: {
    title: { en: "Kickstart the Revolution.", hi: "बदलाव की शुरुआत करें।" },
    sub: { en: "Help us find the next Indian football icon.", hi: "अगले इंडियन फुटबॉल स्टार को ढूँढने में हमारी मदद करें।" },
    cta: { en: "Donate Now", hi: "अभी डोनेट करें" },
    note: { en: "Registered 80G Non-Profit", hi: "रजिस्टर्ड 80G नॉन-प्रॉफिट" },
  },
} as const;

type DictKey = keyof typeof dict;
type SubKey<K extends DictKey> = keyof (typeof dict)[K];

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: <K extends DictKey, S extends SubKey<K>>(k: K, s: S) => string }>({
  lang: "en",
  setLang: () => {},
  t: () => "",
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("ikf_lang") as Lang | null;
    if (saved === "en" || saved === "hi") setLangState(saved);
  }, []);
  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem("ikf_lang", l);
  };
  const t = <K extends DictKey, S extends SubKey<K>>(k: K, s: S): string => {
    const entry = (dict[k] as Record<string, { en: string; hi: string }>)[s as string];
    return entry?.[lang] ?? entry?.en ?? "";
  };
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useLang = () => useContext(Ctx);
