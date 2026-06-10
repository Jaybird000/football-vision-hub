import { createFileRoute, Link } from "@tanstack/react-router";
import img from "@/assets/persona-player.jpg";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/players")({
  head: () => ({ meta: [
    { title: "For Players — India Khelo Football" },
    { name: "description", content: "Register for IKF open trials — free for girls and underprivileged, otherwise a one-time ₹125 city-round registration. Get scouted, get placed, go pro." },
    { property: "og:title", content: "For Players — IKF" },
  ]}),
  component: Players,
});

function Players() {
  const steps = [
    { n: "01", t: "Register for a Trial", b: "Pick the city closest to you. One-time ₹125 registration for the city round — free for girls and underprivileged children. Just bring your boots and ID." },
    { n: "02", t: "Show Up. Show Out.", b: "Time on pitch in front of IKF coaches. Scouts watch every touch — talent over reputation." },
    { n: "03", t: "Get Scouted", b: "Shortlisted players progress to IKF zonal rounds — completely free to attend." },
    { n: "04", t: "Connect with Academies & Clubs", b: "Top performers from the national finals are presented to I-League and ISL scouts — IKF charges no fee to clubs or players for the bridge." },
  ];
  return (
    <>
      <PageHero eyebrow="For Players"
        title={<>Your <span className="text-gold-ink not-italic mx-[0.1em]">talent</span><br />deserves a stage.</>}
        sub="If you can play, we'll find you. IKF runs open city-round trials nationwide — free for girls and underprivileged players, otherwise a one-time ₹125 registration. Show up — the rest is on us."
        image={img}
        quote={{ text: "I played barefoot in Imphal till IKF gave me boots. Eight months later I signed with an I-League academy.", author: "Lalrinpuia H.", role: "Age 16, Mizoram" }} />
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
          <div>
            <span className="text-gold-ink font-bold text-xs uppercase tracking-widest">How it works</span>
            <h2 className="font-display text-4xl md:text-5xl uppercase mt-3 leading-tight">Four steps. Merit-only.</h2>
            <p className="mt-6 text-chalk/86 leading-relaxed">No agent. No federation politics. A one-time ₹125 city-round registration (free for girls and underprivileged children) — every stage after that is fully funded. The IKF pathway is the most transparent route from a maidan to a professional contract in India.</p>
            <Link to="/donate" className="inline-block mt-8 bg-neon-strike text-ink px-8 py-4 font-display text-2xl uppercase tracking-wide">Register Interest</Link>
          </div>
          <div className="space-y-1">
            {steps.map(s => (
              <div key={s.n} className="p-6 border-l-4 border-chalk/15 hover:border-neon-strike hover:bg-pitch-green/5 transition-colors">
                <div className="flex gap-6 items-start">
                  <span className="font-display text-4xl text-chalk/30">{s.n}</span>
                  <div>
                    <h3 className="font-display text-2xl uppercase">{s.t}</h3>
                    <p className="text-chalk/82 mt-2 text-sm leading-relaxed">{s.b}</p>
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
            { t: "Cost", b: "One-time ₹125 city-round registration. Free for girls and underprivileged children. Zonal rounds and national finals — ₹0." },
          ].map(c => (
            <div key={c.t} className="bg-paper-2 p-8 border border-black/10 shadow-sm">
              <h3 className="font-display text-3xl uppercase text-gold-ink">{c.t}</h3>
              <p className="text-chalk/86 mt-3">{c.b}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
