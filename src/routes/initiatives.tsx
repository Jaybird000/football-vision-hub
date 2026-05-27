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
    { t: "Khelo Talent Hunt", tag: "Flagship", b: "Open city-round trials feeding zonal camps and a national final. The funnel that starts every IKF journey — free for girls and underprivileged players." },
    { t: "Naari Shakti", tag: "Women's Football", b: "Dedicated trials and pathway support for girls — no registration fee at any stage." },
    { t: "IKF Academies", tag: "Residential", b: "Residential training environments combining schooling with year-round football development." },
    { t: "Coach Education", tag: "Capacity Building", b: "Structured coach-development programs for grassroots coaches in tier-2 and tier-3 cities." },
    { t: "Rural Outreach", tag: "Last Mile", b: "On-the-ground trial drives, equipment support and village-level coaching clinics in underserved geographies." },
    { t: "Para-Football", tag: "Inclusion", b: "Adapted training and competitive trials for differently-abled players." },
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
