import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "hi";

const dict = {
  nav: {
    pathway: { en: "Pathway", hi: "रास्ता" },
    initiatives: { en: "Initiatives", hi: "पहल" },
    about: { en: "About", hi: "हमारे बारे में" },
    players: { en: "Players", hi: "खिलाड़ी" },
    parents: { en: "Parents", hi: "अभिभावक" },
    coaches: { en: "Coaches", hi: "कोच" },
    partners: { en: "Partners", hi: "साझेदार" },
    donate: { en: "Donate", hi: "दान करें" },
  },
  home: {
    heroLine1: { en: "From the", hi: "गली से" },
    heroStreet: { en: "Street", hi: "मैदान तक" },
    heroLine2: { en: "To the", hi: "" },
    heroStadium: { en: "Stadium", hi: "स्टेडियम तक" },
    heroSub: {
      en: "IKF is building India's largest football scouting ecosystem. We find the talent — you build the future. 100% merit-based, 0% barriers.",
      hi: "आईकेएफ भारत का सबसे बड़ा फुटबॉल स्काउटिंग नेटवर्क बना रहा है। हम प्रतिभा ढूँढते हैं — आप भविष्य बनाते हैं।",
    },
    ctaPrimary: { en: "Start Your Journey", hi: "यात्रा शुरू करें" },
    ctaSecondary: { en: "Watch the Pipeline", hi: "पाइपलाइन देखें" },
    pipelineEyebrow: { en: "The Pathway", hi: "रास्ता" },
    pipelineTitle: { en: "Five stages. One dream.", hi: "पाँच चरण। एक सपना।" },
    personasTitle: { en: "Who are you?", hi: "आप कौन हैं?" },
    statsTitle: { en: "Built on the ground.", hi: "ज़मीन पर बना।" },
    naariTitle: { en: "Naari Shakti", hi: "नारी शक्ति" },
    naariBody: {
      en: "Women's football is the fastest-growing track at IKF. Safe, competitive pathways for girls from every corner of Bharat.",
      hi: "महिला फुटबॉल आईकेएफ की सबसे तेज़ी से बढ़ती धारा है। भारत के हर कोने की लड़कियों के लिए सुरक्षित, प्रतिस्पर्धी रास्ता।",
    },
    naariCta: { en: "Explore Women's Pathway", hi: "महिला रास्ता देखें" },
  },
  donate: {
    title: { en: "Kickstart the Revolution.", hi: "क्रांति शुरू करें।" },
    sub: { en: "Help us find the next Indian football icon.", hi: "अगले भारतीय फुटबॉल आइकन की खोज में हमारा साथ दें।" },
    cta: { en: "Donate Now", hi: "अभी दान करें" },
    note: { en: "Registered 80G Non-Profit", hi: "पंजीकृत 80G गैर-लाभकारी" },
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
