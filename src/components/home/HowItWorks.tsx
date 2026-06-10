import { Reveal } from "./Reveal";

const STEPS = [
  {
    n: "1",
    lead: "You tell us about your family's journey.",
    body: "Ten minutes. Your child's football story, your goals, your capacity, your questions. This is the foundation of everything that follows.",
  },
  {
    n: "2",
    lead: "We assess your child across three dimensions.",
    body: "Football skill and trajectory. Academic standing. Temperament and resilience. Not just what they can do today — but where they are headed.",
  },
  {
    n: "3",
    lead: "You receive a clear, honest recommendation.",
    body: "Where your child stands. What it means. What to focus on in the next six months. And who can help, if there is a gap.",
  },
];

/**
 * Section 4 — How It Works.
 * Three steps, plain language, no jargon. The parent should finish thinking
 * "that's it? I can do that." Never promise contracts, scholarships, or
 * breakthrough outcomes — the credibility rests on the word "honest".
 */
export function HowItWorks() {
  return (
    <section className="bg-[#FAF8F3] text-[#1C1C19]">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal as="h2" className="max-w-2xl font-serif text-[clamp(1.8rem,4vw,3rem)] font-medium leading-[1.1] tracking-[-0.015em]">
          Three steps. One honest picture.
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-y-12 md:grid-cols-3 md:gap-x-10 md:gap-y-0">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 120} className="md:border-l md:border-[#E2DCD0] md:pl-7 md:first:border-l-0 md:first:pl-0">
              <span className="font-serif text-4xl font-medium text-[#C99700]">{step.n}</span>
              <p className="mt-5 font-sans text-lg font-semibold leading-snug text-[#1C1C19]">
                {step.lead}
              </p>
              <p className="mt-3 font-sans text-base leading-relaxed text-[#5C5A53]">
                {step.body}
              </p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120} className="mt-16 border-t border-[#E2DCD0] pt-8">
          <p className="max-w-3xl font-sans text-base leading-relaxed text-[#5C5A53]">
            <span className="font-semibold text-[#1E2A38]">Every six months, we check in.</span>{" "}
            Because situations change — and your child's pathway should reflect
            where you are, not where you were.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
