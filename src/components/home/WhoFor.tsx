import { Reveal } from "./Reveal";

const PARENTS = [
  {
    lead: "Believes in the potential",
    body: "The parent who believes their child has real potential — and wants an honest, structured picture of what that potential actually looks like and where it can go.",
  },
  {
    lead: "Unsure, and honest about it",
    body: "The parent who is unsure — investing in football but uncertain whether the commitment makes sense, and looking for clarity before the next decision.",
  },
  {
    lead: "Wants a future in sport",
    body: "The parent who wants a future in sport for their child — professional or not — and needs to understand what the realistic pathways look like beyond the first team.",
  },
];

/**
 * Section 6 — Who This Is For.
 * Name the three types of parents this serves — without hierarchy, without
 * judgment. Every parent should find themselves in at least one line.
 * Specificity is trust; no "regardless of background" / "for everyone".
 */
export function WhoFor() {
  return (
    <section className="bg-[#FAF8F3] text-[#1C1C19]">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <Reveal as="h2" className="max-w-3xl font-serif text-[clamp(1.8rem,4vw,3rem)] font-medium leading-[1.12] tracking-[-0.015em]">
          This is for every football parent — not just the ones funding a
          professional dream.
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
          {PARENTS.map((p, i) => (
            <Reveal key={p.lead} delay={i * 120} className="border-t-2 border-[#F5C518] pt-6">
              <h3 className="font-serif text-xl font-medium text-[#1E2A38]">{p.lead}</h3>
              <p className="mt-4 font-sans text-base leading-relaxed text-[#5C5A53]">
                {p.body}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
