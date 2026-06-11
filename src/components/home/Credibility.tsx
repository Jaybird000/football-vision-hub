import { Reveal } from "./Reveal";

const STATS = [
  { figure: "5", unit: "years" },
  { figure: "50,000", unit: "players" },
  { figure: "135", unit: "cities & villages" },
];

/**
 * Section 5 — Credibility.
 * Numbers first, story second. The numbers establish scale; the story makes it
 * human. No awards, media mentions, or celebrity endorsements — those signal
 * status. This portal signals trust.
 */
export function Credibility() {
  return (
    <section className="bg-[#F2F5F7] text-[#144A6C]">
      <div className="mx-auto max-w-5xl px-6 py-24 md:py-32">
        <Reveal as="h2" className="font-serif text-[clamp(1.8rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.015em]">
          Five years. 50,000 players. 135 cities and villages.
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STATS.map((s, i) => (
            <Reveal key={s.unit} delay={i * 110} className="border-t border-[#C6CED5] pt-5">
              <div className="font-serif text-[clamp(2.5rem,6vw,3.75rem)] font-medium leading-none text-[#0A5A94]">
                {s.figure}
              </div>
              <div className="mt-3 font-sans text-sm uppercase tracking-[0.16em] text-[#3A4754]">
                {s.unit}
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-16 max-w-2xl space-y-6 font-sans text-lg leading-relaxed text-[#3A4754]">
          <Reveal as="p">
            From Andaman &amp; Nicobar to Naxal-affected belts in Jharkhand. From
            border towns in the Northeast to tribal communities no football
            programme had reached before.
          </Reveal>
          <Reveal as="p" delay={100}>
            IKF has spent five years on the ground — not building a brand, but
            building a picture of what Indian football actually looks like, and
            what it actually needs.
          </Reveal>
          <Reveal as="p" delay={180} className="font-medium text-[#144A6C]">
            IKF Pathway 360 is built from that picture.
          </Reveal>
        </div>
      </div>
    </section>
  );
}
