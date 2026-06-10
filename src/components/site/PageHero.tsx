import { type ReactNode } from "react";

type Quote = { text: string; author: string; role?: string };

export function PageHero({ eyebrow, title, sub, image, quote }: { eyebrow: string; title: ReactNode; sub: string; image: string; quote?: Quote }) {
  return (
    <section className="on-dark relative min-h-[78vh] flex items-end overflow-hidden border-b border-chalk/10">
      <div className="absolute inset-0 z-0">
        <img src={image} alt="" width={1600} height={900} className="w-full h-full object-cover opacity-95 animate-ken-burns" />
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-black via-pitch-black/30 to-transparent" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
        <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em] animate-fade-up">{eyebrow}</span>
        <h1 className="font-display uppercase italic text-[clamp(3rem,9vw,9rem)] leading-[0.9] mt-4 tracking-tighter animate-fade-up" style={{ animationDelay: "0.15s" }}>
          {title}
        </h1>
        {quote ? (
          <figure className="mt-10 max-w-3xl border-l-4 border-neon-strike pl-6 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <blockquote className="font-display italic text-2xl md:text-4xl text-chalk leading-tight">
              &ldquo;{quote.text}&rdquo;
            </blockquote>
            <figcaption className="mt-4 text-xs uppercase tracking-[0.25em] text-chalk/82">
              — {quote.author}{quote.role ? <span className="text-chalk/72"> · {quote.role}</span> : null}
            </figcaption>
          </figure>
        ) : (
          <p className="mt-6 max-w-2xl text-lg text-chalk/80 leading-relaxed animate-fade-up" style={{ animationDelay: "0.4s" }}>{sub}</p>
        )}
        {quote && (
          <p className="mt-8 max-w-2xl text-base text-chalk/82 leading-relaxed animate-fade-up" style={{ animationDelay: "0.55s" }}>{sub}</p>
        )}
      </div>
    </section>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`py-20 md:py-28 ${className}`}><div className="max-w-7xl mx-auto px-6">{children}</div></section>;
}
