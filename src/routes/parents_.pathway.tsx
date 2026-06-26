import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, FolderUp, Compass, ArrowRight, ShieldCheck, Languages, Clock, IndianRupee, LifeBuoy } from "lucide-react";
import img from "@/assets/persona-parent.jpg";
import { PageHero, Section } from "@/components/site/PageHero";
import { useLang } from "@/lib/i18n";
import { requireAccount } from "@/lib/route-guards";

export const Route = createFileRoute("/parents_/pathway")({
  beforeLoad: requireAccount,
  head: () => ({ meta: [
    { title: "IKF Pathway 360 — A Parent's Guide" },
    { name: "description", content: "What IKF Pathway 360 is, the journey your child goes through, and exactly what you can expect — explained for parents, before you sign up." },
  ]}),
  component: ParentPathway,
});

// All copy for this page lives here as { en, hi } so the LangToggle works and the
// Hinglish simplification pass (Module C) has a single place to refine. Placeholder
// copy — final terminology to be reconciled with the "About IKF" reference doc.
const C = {
  hero: {
    eyebrow: { en: "IKF Pathway 360 · For Parents", hi: "IKF पाथवे 360 · पैरेंट्स के लिए" },
    sub: {
      en: "A simple, guided way to understand where your child stands in football today — and the clearest next step forward. Built with parents in mind, in your language, with a real IKF mentor by your side.",
      hi: "यह समझने का एक आसान, गाइडेड तरीका कि आज फुटबॉल में आपका बच्चा कहाँ खड़ा है — और आगे का सबसे साफ़ अगला कदम क्या है। अभिभावकों के लिए बनाया गया, आपकी भाषा में, एक असली IKF मेंटर के साथ।",
    },
  },
  ctaPrimary: { en: "Fill the Parent SOP", hi: "पैरेंट SOP भरें" },
  ctaSecondary: { en: "Log in to explore first", hi: "पहले लॉग इन करके देखें" },
  ctaHelper: {
    en: "No cost. Takes about 5 minutes. You can explore the platform before filling anything.",
    hi: "कोई शुल्क नहीं। लगभग 5 मिनट लगते हैं। कुछ भरने से पहले आप प्लेटफ़ॉर्म देख सकते हैं।",
  },

  aboutEyebrow: { en: "What is it?", hi: "यह क्या है?" },
  aboutTitle: { en: "IKF Pathway 360, in one line.", hi: "एक लाइन में IKF पाथवे 360।" },
  aboutBody: {
    en: "IKF Pathway 360 is your child's personalised football roadmap. You share a few things about your child, optionally add assessment reports, and an IKF advisor gives you a clear, honest picture of where they stand and what to do next — no jargon, no pressure, no hidden charges.",
    hi: "IKF पाथवे 360 आपके बच्चे का पर्सनलाइज़्ड फुटबॉल रोडमैप है। आप अपने बच्चे के बारे में कुछ बातें बताते हैं, चाहें तो असेसमेंट रिपोर्ट जोड़ते हैं, और एक IKF एडवाइज़र आपको साफ़, ईमानदार तस्वीर देता है कि वे कहाँ हैं और आगे क्या करना है — कोई मुश्किल शब्द नहीं, कोई दबाव नहीं, कोई छुपा शुल्क नहीं।",
  },

  journeyEyebrow: { en: "The Parent Journey", hi: "पैरेंट जर्नी" },
  journeyTitle: { en: "Three simple stages.", hi: "तीन आसान चरण।" },
  stages: [
    {
      n: "01",
      title: { en: "Parent SOP", hi: "पैरेंट SOP" },
      body: {
        en: "A short set of questions about your child's football, school and your hopes. About 5 minutes. This is where every journey begins.",
        hi: "आपके बच्चे के फुटबॉल, स्कूल और आपकी उम्मीदों के बारे में कुछ छोटे सवाल। लगभग 5 मिनट। हर यात्रा यहीं से शुरू होती है।",
      },
    },
    {
      n: "02",
      title: { en: "Deep Assessment", hi: "गहरा असेसमेंट" },
      body: {
        en: "Add reports across football, fitness, mind, academics and personality — at your own pace. Don't have them? Your IKF mentor will guide you.",
        hi: "फुटबॉल, फ़िटनेस, माइंड, पढ़ाई और पर्सनैलिटी की रिपोर्ट अपनी सुविधा से जोड़ें। आपके पास नहीं हैं? आपका IKF मेंटर मदद करेगा।",
      },
    },
    {
      n: "03",
      title: { en: "Your Recommendation", hi: "आपकी सिफ़ारिश" },
      body: {
        en: "Your advisor reviews everything and gives you one clear, personalised recommendation — and reviews it with you over time.",
        hi: "आपका एडवाइज़र सब कुछ देखता है और आपको एक साफ़, पर्सनलाइज़्ड सिफ़ारिश देता है — और समय-समय पर आपके साथ उसकी समीक्षा करता है।",
      },
    },
  ],

  sopEyebrow: { en: "Start here", hi: "यहाँ से शुरू करें" },
  sopTitle: { en: "What is the Parent SOP?", hi: "पैरेंट SOP क्या है?" },
  sopBody: {
    en: "SOP just means \"Statement of Purpose\" — your starting point. It's a short, friendly form where you tell us about your child in your own words. There are no right or wrong answers, and nothing here is a test of your child. It simply helps your IKF advisor understand your family and point you in the right direction.",
    hi: "SOP का मतलब है \"स्टेटमेंट ऑफ़ पर्पस\" — आपका शुरुआती बिंदु। यह एक छोटा, सरल फ़ॉर्म है जिसमें आप अपने शब्दों में अपने बच्चे के बारे में बताते हैं। कोई सही या ग़लत जवाब नहीं है, और यह आपके बच्चे की परीक्षा नहीं है। यह बस आपके IKF एडवाइज़र को आपके परिवार को समझने और सही दिशा दिखाने में मदद करता है।",
  },

  deliverEyebrow: { en: "What you get", hi: "आपको क्या मिलता है" },
  deliverTitle: { en: "What you can expect.", hi: "आप क्या उम्मीद कर सकते हैं।" },
  deliverables: [
    { icon: Compass, title: { en: "A clear readiness picture", hi: "साफ़ रेडीनेस तस्वीर" }, body: { en: "An honest sense of where your child stands today — explained, not just labelled.", hi: "एक ईमानदार समझ कि आज आपका बच्चा कहाँ है — सिर्फ़ लेबल नहीं, समझाया गया।" } },
    { icon: ClipboardList, title: { en: "A personalised recommendation", hi: "पर्सनलाइज़्ड सिफ़ारिश" }, body: { en: "One concrete next step tailored to your child — not generic advice.", hi: "आपके बच्चे के लिए एक ठोस अगला कदम — कोई आम सलाह नहीं।" } },
    { icon: LifeBuoy, title: { en: "A real IKF mentor", hi: "एक असली IKF मेंटर" }, body: { en: "A named advisor you can reach when you're stuck or unsure.", hi: "एक नामित एडवाइज़र जिससे आप अटकने या उलझन में संपर्क कर सकते हैं।" } },
    { icon: ShieldCheck, title: { en: "Privacy by default", hi: "डिफ़ॉल्ट रूप से प्राइवेसी" }, body: { en: "Only you and your advisor see your child's information. Nothing is shared without consent.", hi: "केवल आप और आपका एडवाइज़र आपके बच्चे की जानकारी देखते हैं। बिना सहमति कुछ साझा नहीं होता।" } },
  ],

  faqEyebrow: { en: "Good to know", hi: "जानना ज़रूरी है" },
  faqTitle: { en: "Questions, answered.", hi: "सवाल, जवाब के साथ।" },
  faqs: [
    {
      icon: IndianRupee,
      q: { en: "Does this cost anything?", hi: "क्या इसमें कोई खर्च है?" },
      a: { en: "Filling the Parent SOP and getting your recommendation is free. If you later choose paid assessments from outside providers, you'll always see the charges upfront so you can compare.", hi: "पैरेंट SOP भरना और सिफ़ारिश पाना मुफ़्त है। अगर आप बाद में बाहरी प्रोवाइडर से पेड असेसमेंट चुनते हैं, तो आपको शुल्क पहले से दिखेगा ताकि आप तुलना कर सकें।" },
    },
    {
      icon: Languages,
      q: { en: "Is it available in Hindi?", hi: "क्या यह हिंदी में है?" },
      a: { en: "Yes. Use the language toggle at the top to switch between English and Hindi anytime.", hi: "हाँ। कभी भी इंग्लिश और हिंदी के बीच बदलने के लिए ऊपर दिए गए लैंग्वेज टॉगल का इस्तेमाल करें।" },
    },
    {
      icon: Clock,
      q: { en: "How long does it take?", hi: "इसमें कितना समय लगता है?" },
      a: { en: "The Parent SOP takes about 5 minutes. The deeper assessment you can complete at your own pace — there's no deadline.", hi: "पैरेंट SOP में लगभग 5 मिनट लगते हैं। गहरा असेसमेंट आप अपनी सुविधा से पूरा कर सकते हैं — कोई डेडलाइन नहीं।" },
    },
    {
      icon: FolderUp,
      q: { en: "What if I don't have any documents?", hi: "अगर मेरे पास कोई दस्तावेज़ न हों तो?" },
      a: { en: "That's completely fine. You can start without any documents. When you reach the assessment stage, there's an option to ask your IKF mentor for help — they'll guide you on the next steps, usually within 48 hours.", hi: "यह बिल्कुल ठीक है। आप बिना किसी दस्तावेज़ के शुरू कर सकते हैं। असेसमेंट स्टेज पर पहुँचने पर, अपने IKF मेंटर से मदद माँगने का विकल्प होता है — वे आमतौर पर 48 घंटों के अंदर अगले कदम बताएँगे।" },
    },
    {
      icon: ShieldCheck,
      q: { en: "Who can see my child's information?", hi: "मेरे बच्चे की जानकारी कौन देख सकता है?" },
      a: { en: "Only you and your assigned IKF advisor. We never share your data with anyone else without your consent.", hi: "केवल आप और आपका नियुक्त IKF एडवाइज़र। हम आपकी सहमति के बिना आपका डेटा किसी और के साथ साझा नहीं करते।" },
    },
  ],

  // Placeholder testimonials — to be replaced with real IKF parent stories.
  storiesEyebrow: { en: "From other parents", hi: "दूसरे पैरेंट्स से" },
  storiesTitle: { en: "Families like yours.", hi: "आपके जैसे परिवार।" },
  stories: [
    { quote: { en: "I finally understood where my son actually stands — without feeling judged. The advisor explained everything in simple Hindi.", hi: "आख़िरकार मैं समझ पाई कि मेरा बेटा असल में कहाँ खड़ा है — बिना किसी जजमेंट के। एडवाइज़र ने सब कुछ आसान हिंदी में समझाया।" }, author: { en: "Parent of a 12-year-old, Lucknow", hi: "12 साल के बच्चे की अभिभावक, लखनऊ" } },
    { quote: { en: "We didn't have most of the reports. One message to the mentor and we knew exactly what to do.", hi: "हमारे पास ज़्यादातर रिपोर्ट नहीं थीं। मेंटर को एक मैसेज और हमें पता चल गया कि क्या करना है।" }, author: { en: "Parent of a 14-year-old, Ranchi", hi: "14 साल के बच्चे के अभिभावक, राँची" } },
  ],

  finalTitle: { en: "Ready to begin?", hi: "शुरू करने के लिए तैयार?" },
  finalBody: { en: "Start with the Parent SOP, or log in and look around first. There's no pressure either way.", hi: "पैरेंट SOP से शुरू करें, या पहले लॉग इन करके देखें। किसी भी तरह कोई दबाव नहीं।" },
} as const;

function ParentPathway() {
  const { lang } = useLang();
  const L = <T,>(pair: { en: T; hi: T }) => pair[lang];

  return (
    <>
      <PageHero
        eyebrow={L(C.hero.eyebrow)}
        title={<>IKF <span className="text-gold-ink not-italic mx-[0.1em]">Pathway 360</span></>}
        sub={L(C.hero.sub)}
        image={img}
      />

      {/* Primary CTAs */}
      <Section className="!pt-12 md:!pt-16">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
          <Link to="/signup" search={{ next: "/ikf360/intent" }} className="inline-flex items-center justify-center gap-2 bg-neon-strike text-ink px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider hover:brightness-95 transition-all">
            {L(C.ctaPrimary)} <ArrowRight size={16} />
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-neon-strike text-ink px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider hover:brightness-95 transition-all">
            {L(C.ctaSecondary)}
          </Link>
        </div>
        <p className="mt-4 text-sm text-chalk/78">{L(C.ctaHelper)}</p>
      </Section>

      {/* What is it */}
      <Section className="!pt-0">
        <div className="max-w-3xl">
          <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em]">{L(C.aboutEyebrow)}</span>
          <h2 className="font-display text-4xl md:text-5xl uppercase mt-4 mb-6">{L(C.aboutTitle)}</h2>
          <p className="text-lg text-chalk/86 leading-relaxed">{L(C.aboutBody)}</p>
        </div>
      </Section>

      {/* The journey */}
      <Section className="border-t border-chalk/10">
        <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em]">{L(C.journeyEyebrow)}</span>
        <h2 className="font-display text-4xl md:text-5xl uppercase mt-4 mb-10 md:mb-12">{L(C.journeyTitle)}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {C.stages.map((s) => (
            <div key={s.n} className="bg-pitch-green/10 border border-chalk/10 p-7 hover:border-neon-strike/40 transition-colors">
              <div className="font-display text-5xl text-gold-ink/30">{s.n}</div>
              <h3 className="font-display text-2xl uppercase mt-3 mb-3">{L(s.title)}</h3>
              <p className="text-chalk/86 leading-relaxed">{L(s.body)}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Parent SOP intro */}
      <Section className="border-t border-chalk/10">
        <div className="max-w-3xl">
          <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em]">{L(C.sopEyebrow)}</span>
          <h2 className="font-display text-4xl md:text-5xl uppercase mt-4 mb-6">{L(C.sopTitle)}</h2>
          <p className="text-lg text-chalk/86 leading-relaxed">{L(C.sopBody)}</p>
        </div>
      </Section>

      {/* Deliverables */}
      <Section className="border-t border-chalk/10">
        <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em]">{L(C.deliverEyebrow)}</span>
        <h2 className="font-display text-4xl md:text-5xl uppercase mt-4 mb-10 md:mb-12">{L(C.deliverTitle)}</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {C.deliverables.map((d, i) => {
            const Icon = d.icon;
            return (
              <div key={i} className="flex gap-5 bg-pitch-green/10 border border-chalk/10 p-7">
                <Icon className="text-gold-ink shrink-0" size={28} />
                <div>
                  <h3 className="font-display text-xl uppercase mb-2">{L(d.title)}</h3>
                  <p className="text-chalk/86 leading-relaxed">{L(d.body)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* FAQ */}
      <Section className="border-t border-chalk/10">
        <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em]">{L(C.faqEyebrow)}</span>
        <h2 className="font-display text-4xl md:text-5xl uppercase mt-4 mb-10 md:mb-12">{L(C.faqTitle)}</h2>
        <div className="space-y-1">
          {C.faqs.map((f, i) => {
            const Icon = f.icon;
            return (
              <details key={i} className="group bg-pitch-green/10 border border-chalk/10 p-6 open:bg-pitch-green/20">
                <summary className="cursor-pointer flex justify-between items-center gap-4 font-display text-xl md:text-2xl uppercase">
                  <span className="flex items-center gap-3"><Icon className="text-gold-ink shrink-0" size={20} />{L(f.q)}</span>
                  <span className="text-gold-ink text-3xl group-open:rotate-45 transition-transform shrink-0">+</span>
                </summary>
                <p className="mt-4 text-chalk/86 leading-relaxed">{L(f.a)}</p>
              </details>
            );
          })}
        </div>
      </Section>

      {/* Stories */}
      <Section className="border-t border-chalk/10">
        <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em]">{L(C.storiesEyebrow)}</span>
        <h2 className="font-display text-4xl md:text-5xl uppercase mt-4 mb-10 md:mb-12">{L(C.storiesTitle)}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {C.stories.map((s, i) => (
            <figure key={i} className="border-l-4 border-neon-strike pl-6 py-2">
              <blockquote className="font-display italic text-2xl md:text-3xl leading-tight">&ldquo;{L(s.quote)}&rdquo;</blockquote>
              <figcaption className="mt-4 text-xs uppercase tracking-[0.25em] text-chalk/78">— {L(s.author)}</figcaption>
            </figure>
          ))}
        </div>
      </Section>

      {/* Final CTA */}
      <Section className="border-t border-chalk/10">
        <div className="bg-ink text-paper p-10 md:p-14 rounded-sm">
          <h2 className="font-display text-4xl md:text-6xl uppercase leading-none">{L(C.finalTitle)}</h2>
          <p className="mt-4 text-lg max-w-2xl text-paper/80">{L(C.finalBody)}</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link to="/signup" search={{ next: "/ikf360/intent" }} className="inline-flex items-center justify-center gap-2 bg-neon-strike text-ink px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider hover:brightness-95 transition-all">
              {L(C.ctaPrimary)} <ArrowRight size={16} />
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 border border-paper/50 text-paper px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider hover:bg-paper hover:text-ink transition-colors">
              {L(C.ctaSecondary)}
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
