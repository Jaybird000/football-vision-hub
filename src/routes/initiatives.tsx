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
    { t: "IKF Trials", tag: "Flagship", b: "Open city-round trials feeding zonal camps and a national final — the funnel that starts every IKF journey.", href: "https://indiakhelofootball.com/IkfTrials" },
    { t: "Project Naari Shakti", tag: "Women's Football", b: "Dedicated trials and pathway support for girls across India.", href: "https://indiakhelofootball.com/naari_shakti" },
    { t: "Scout on Wheel", tag: "Mobile Scouting", b: "A travelling scouting unit that takes the IKF pathway directly to communities.", href: "https://indiakhelofootball.com/scouts_on_wheels" },
    { t: "North East Rising", tag: "Regional", b: "Focused football scouting and development across India's North-East.", href: "https://indiakhelofootball.com/north_east_rising" },
    { t: "IKF Pathway 360", tag: "Pathway", b: "The end-to-end IKF talent, parent and coach engagement pathway.", href: "https://indiakhelofootball.com/ikf360vision" },
    { t: "IKF Scouting Certification", tag: "Capacity Building", b: "Structured certification programme for scouts working inside the IKF pathway.", href: "https://indiakhelofootball.com/scoutingcertification" },
    { t: "Global Pathways", tag: "International", b: "Connections between Indian talent and international clubs and academies.", href: "https://indiakhelofootball.com/international-clubs-academies" },
  ];
  return (
    <>
      <PageHero eyebrow="Initiatives"
        title={<>Many <span className="text-gold-ink not-italic mx-[0.1em]">programs</span>. One pipeline.</>}
        sub="Every IKF initiative feeds the same pathway — from a kid touching a ball for the first time, to a player signing a professional contract."
        image={img} />
      <Section>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map(it => (
            <a key={it.t} href={it.href} target="_blank" rel="noopener noreferrer"
              className="group bg-pitch-green/10 border border-chalk/10 p-8 hover:border-neon-strike transition-colors flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gold-ink">{it.tag}</span>
              <h3 className="font-display text-3xl uppercase mt-3">{it.t}</h3>
              <p className="mt-4 text-chalk/86 text-sm leading-relaxed flex-1">{it.b}</p>
              <span className="mt-6 text-xs uppercase tracking-widest font-bold text-chalk/82 group-hover:text-gold-ink">Learn more →</span>
            </a>
          ))}
        </div>
      </Section>
    </>
  );
}
