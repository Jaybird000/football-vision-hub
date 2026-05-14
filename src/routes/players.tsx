import { createFileRoute, Link } from "@tanstack/react-router";
import img from "@/assets/persona-player.jpg";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [
    { title: "For Players — India Khelo Football" },
    { name: "description", content: "Register for free open trials in 50+ cities. Get scouted, get placed, go pro." },
    { property: "og:title", content: "For Players — IKF" },
  ]}),
  component: Players,
});

function Players() {
  const steps = [
    { n: "01", t: "Register for a Trial", b: "Pick the city closest to you. No fees. Just bring your boots and ID." },
    { n: "02", t: "Show Up. Show Out.", b: "60 minutes on pitch. Scouts watch every touch — talent over reputation." },
    { n: "03", t: "Get Scouted", b: "Selected players move into IKF zonal residential camps within 30 days." },
    { n: "04", t: "Sign with an Academy", b: "Best performers earn fully-funded contracts at ISL & I-League academies." },
  ];
  return (
    <>
      <PageHero eyebrow="For Players"
        title={<>Your <span className="text-neon-strike not-italic">talent</span><br />deserves a stage.</>}
        sub="If you can play, we'll find you. IKF runs 200+ free open trials a year across India. Show up — the rest is on us."
        image={img} />
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <span className="text-neon-strike font-bold text-xs uppercase tracking-widest">How it works</span>
            <h2 className="font-display text-5xl uppercase mt-3 leading-tight">Four steps. Zero rupees.</h2>
            <p className="mt-6 text-chalk/70 leading-relaxed">No agent. No federation politics. No "pay-to-play". The IKF pathway is the most transparent route from a maidan to a professional contract in India.</p>
            <Link to="/donate" className="inline-block mt-8 bg-neon-strike text-pitch-black px-8 py-4 font-display text-2xl uppercase tracking-wide">Register Interest</Link>
          </div>
          <div className="space-y-1">
            {steps.map((s, i) => (
              <div key={s.n} className={`p-6 border-l-4 ${i === 0 ? "border-neon-strike bg-pitch-green/10" : "border-chalk/10"}`}>
                <div className="flex gap-6 items-start">
                  <span className="font-display text-4xl text-chalk/30">{s.n}</span>
                  <div>
                    <h3 className="font-display text-2xl uppercase">{s.t}</h3>
                    <p className="text-chalk/60 mt-2 text-sm leading-relaxed">{s.b}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>
      <Section className="bg-pitch-green/10 border-y border-chalk/5">
        <h2 className="font-display text-4xl md:text-5xl uppercase mb-10">Eligibility</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            { t: "Age", b: "Boys & girls between 12-21." },
            { t: "Skill", b: "Any level. We grade on potential, not resume." },
            { t: "Cost", b: "₹0 — trials, kit and meals are free." },
          ].map(c => (
            <div key={c.t} className="bg-pitch-black p-8 border border-chalk/10">
              <h3 className="font-display text-3xl uppercase text-neon-strike">{c.t}</h3>
              <p className="text-chalk/70 mt-3">{c.b}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
