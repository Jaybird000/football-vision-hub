import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/initiatives-pitch.jpg";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/initiatives")({
  head: () => ({ meta: [
    { title: "Initiatives — India Khelo Football" },
    { name: "description", content: "Programs and projects: Khelo Talent Hunt, Naari Shakti, IKF Academies, Coach Education and rural football outreach." },
  ]}),
  component: Initiatives,
});

function Initiatives() {
  const items = [
    { t: "Khelo Talent Hunt", tag: "Flagship", b: "200+ open trials a year, 50 cities, 100,000+ players scouted. The funnel that starts every IKF journey." },
    { t: "Naari Shakti", tag: "Women's Football", b: "Dedicated trials, residential camps, and pathway support for girls aged 12-21 across rural India." },
    { t: "IKF Academies", tag: "Residential", b: "Year-round residential academies in Goa, Manipur, and West Bengal. Full school + football integration." },
    { t: "Coach Education", tag: "Capacity Building", b: "AIFF-aligned D and C License programs subsidised for grassroots coaches in tier-2 and tier-3 cities." },
    { t: "Rural Outreach", tag: "Last Mile", b: "Mobile trial vans, equipment drops, and village-level coaching clinics in 12 underserved states." },
    { t: "Para-Football", tag: "Inclusion", b: "Adapted training and competitive trials for differently-abled players — launched 2024." },
  ];
  return (
    <>
      <PageHero eyebrow="Initiatives"
        title={<>Many <span className="text-neon-strike not-italic">programs</span>. One pipeline.</>}
        sub="Every IKF initiative feeds the same pathway — from a kid touching a ball for the first time, to a player signing a professional contract."
        image={img} />
      <Section>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(it => (
            <article key={it.t} className="bg-pitch-green/10 border border-chalk/10 p-8 hover:border-neon-strike transition-colors flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neon-strike">{it.tag}</span>
              <h3 className="font-display text-3xl uppercase mt-3">{it.t}</h3>
              <p className="mt-4 text-chalk/70 text-sm leading-relaxed flex-1">{it.b}</p>
              <span className="mt-6 text-xs uppercase tracking-widest font-bold text-chalk/60 hover:text-neon-strike">Learn more →</span>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
