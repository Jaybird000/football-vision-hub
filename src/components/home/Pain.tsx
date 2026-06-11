import { Reveal } from "./Reveal";

/**
 * Section 2 — The Pain Statement.
 * Name the reality of being a football parent in India — plainly, without
 * drama. No bullets. Each statement lands separately. No solution here; the
 * pain needs a full breath before the answer arrives.
 */
export function Pain() {
  return (
    <section className="bg-[#F2F5F7] text-[#144A6C]">
      <div className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <Reveal as="p" className="font-serif text-[clamp(1.6rem,3.4vw,2.6rem)] font-medium leading-[1.18] tracking-[-0.01em]">
          Nobody tells you the truth about your child's football journey.
        </Reveal>

        <Reveal as="p" delay={120} className="mt-12 font-sans text-lg leading-relaxed text-[#3A4754]">
          Academies assess skill. Nobody assesses the whole picture — the
          child's trajectory, the family's capacity, the realistic options at
          every stage.
        </Reveal>

        <Reveal as="p" delay={200} className="mt-8 font-sans text-lg leading-relaxed text-[#3A4754]">
          Parents invest years without structured feedback. Coaches give
          encouragement, not clarity. And by the time the picture becomes clear,
          the window has often closed.
        </Reveal>

        <Reveal as="p" delay={280} className="mt-14 font-serif text-[clamp(1.3rem,2.6vw,1.9rem)] font-medium leading-snug text-[#1A2229]">
          That is not a talent problem. That is a pathway problem.
        </Reveal>
      </div>
    </section>
  );
}
