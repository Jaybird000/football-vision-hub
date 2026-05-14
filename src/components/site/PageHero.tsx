import { type ReactNode } from "react";

export function PageHero({ eyebrow, title, sub, image }: { eyebrow: string; title: ReactNode; sub: string; image: string }) {
  return (
    <section className="relative min-h-[70vh] flex items-end overflow-hidden border-b border-chalk/10">
      <div className="absolute inset-0 z-0">
        <img src={image} alt="" width={1600} height={900} className="w-full h-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-pitch-black via-pitch-black/50 to-pitch-black/40" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full animate-fade-up">
        <span className="text-neon-strike font-bold text-xs uppercase tracking-[0.3em]">{eyebrow}</span>
        <h1 className="font-display uppercase italic text-[clamp(3rem,9vw,9rem)] leading-[0.9] mt-4 tracking-tighter">
          {title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-chalk/80 leading-relaxed">{sub}</p>
      </div>
    </section>
  );
}

export function Section({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`py-20 md:py-28 ${className}`}><div className="max-w-7xl mx-auto px-6">{children}</div></section>;
}
