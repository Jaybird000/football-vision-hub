import { Reveal } from "./Reveal";

/**
 * Section 3 — The Difference.
 * One clean contrast: IKF versus everything else. A single differentiating
 * truth, stated with conviction. The parent should feel the logic, not learn
 * the vocabulary — so no engine terms ("Combo Profile", "SOP", "3x3 matrix").
 */
export function Difference() {
  return (
    <section className="bg-[#1A2229] text-[#F2F5F7]">
      <div className="mx-auto max-w-4xl px-6 py-24 md:py-36">
        <Reveal as="h2" className="font-serif text-[clamp(1.9rem,4.4vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.015em]">
          Every other platform assesses the player.{" "}
          <span className="text-[#FDFE00]">We assess the family.</span>
        </Reveal>

        <Reveal as="p" delay={140} className="mt-10 max-w-2xl font-sans text-lg leading-relaxed text-[#C6CED5]">
          A child does not make decisions alone. A parent does not play. But
          every significant choice — which academy, which city, which sacrifice,
          which path — involves both.
        </Reveal>

        <Reveal as="p" delay={220} className="mt-7 max-w-2xl font-sans text-lg leading-relaxed text-[#C6CED5]">
          IKF Pathway 360 is built on that reality. One profile. One honest
          picture. One recommendation that reflects where your child actually
          stands — and what your family can actually do about it.
        </Reveal>
      </div>
    </section>
  );
}
