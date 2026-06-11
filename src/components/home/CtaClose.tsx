import { Link } from "@tanstack/react-router";
import { Reveal } from "./Reveal";

/**
 * Section 7 — The CTA Close.
 * Lands after the full case. Doesn't restate the pitch — it removes the last
 * friction, which for a Tier 2 parent is almost always: is this going to cost
 * me something? No countdown timers, no "limited slots".
 */
export function CtaClose() {
  return (
    <section className="bg-[#1A2229] text-[#F2F5F7]">
      <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
        <Reveal as="h2" className="font-serif text-[clamp(1.9rem,4.4vw,3.25rem)] font-medium leading-[1.1] tracking-[-0.015em]">
          Start with what's free. Stay because it's useful.
        </Reveal>

        <Reveal as="p" delay={120} className="mx-auto mt-8 max-w-2xl font-sans text-lg leading-relaxed text-[#C6CED5]">
          Registration is free. The first profile and assessment are free. If you
          want deeper guidance, a more detailed recommendation, or access to our
          expert directory — that is available when you are ready for it.
        </Reveal>

        <Reveal as="p" delay={200} className="mx-auto mt-6 max-w-xl font-sans text-base leading-relaxed text-[#3A4754]">
          No pressure. No sales calls. No coach reaching out to sell you
          something. Just an honest picture of where your child stands.
        </Reveal>

        <Reveal delay={300} className="mt-11">
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-full bg-[#FDFE00] px-9 py-4 font-sans text-base font-semibold text-[#1A2229] transition-colors duration-300 hover:bg-[#E0C800]"
          >
            Build your child's profile — start free
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
