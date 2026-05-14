import { useLang } from "@/lib/i18n";

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex border border-chalk/20 rounded-full p-0.5 text-[10px] font-bold">
      <button
        onClick={() => setLang("en")}
        className={`px-3 py-1 rounded-full transition-colors ${lang === "en" ? "bg-neon-strike text-pitch-black" : "text-chalk/70 hover:text-chalk"}`}
      >
        EN
      </button>
      <button
        onClick={() => setLang("hi")}
        className={`px-3 py-1 rounded-full transition-colors ${lang === "hi" ? "bg-neon-strike text-pitch-black" : "text-chalk/70 hover:text-chalk"}`}
        style={{ fontFamily: "Hind, Inter, sans-serif" }}
      >
        हिं
      </button>
    </div>
  );
}
