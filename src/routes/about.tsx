import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/about-team.jpg";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About — India Khelo Football" },
    { name: "description", content: "Founded in 2015 to fix Indian football's broken talent pipeline. Now scouting in 28 states." },
  ]}),
  component: About,
});

function About() {
  return (
    <>
      <PageHero eyebrow="About"
        title={<>We're not a <span className="text-neon-strike not-italic">federation</span>.<br />We're a fix.</>}
        sub="IKF was founded in 2015 because Indian football's biggest problem wasn't talent — it was the pipeline. We built one."
        image={img} />
      <Section>
        <div className="grid md:grid-cols-12 gap-12">
          <div className="md:col-span-7">
            <h2 className="font-display text-4xl uppercase">The story</h2>
            <div className="mt-6 space-y-5 text-chalk/80 leading-relaxed text-lg">
              <p>For decades, the Indian football story repeated itself: a kid with talent, a maidan in a small town, and no road from one to the other. Coaches couldn't reach scouts. Scouts couldn't reach villages. Federations were busy at the top of the pyramid.</p>
              <p>India Khelo Football was started to fix the bottom — and to build a transparent, free, merit-only ladder from the ground floor to the professional game.</p>
              <p>Ten years later we run trials in 50+ cities, operate residential academies in three states, have placed 420+ players into professional academies, and have moved 12 IKF graduates into the Indian Super League.</p>
            </div>
          </div>
          <aside className="md:col-span-5 bg-pitch-green/15 border-l-4 border-neon-strike p-8 self-start">
            <h3 className="font-display text-2xl uppercase">By the numbers</h3>
            <dl className="mt-6 space-y-4">
              {[["100K+", "Players scouted"],["28","States covered"],["420","Academy placements"],["12","ISL contracts"],["₹0","Charged to players"]].map(([v,l]) => (
                <div key={l} className="flex justify-between border-b border-chalk/10 pb-2">
                  <dt className="text-chalk/60 text-sm uppercase tracking-widest">{l}</dt>
                  <dd className="font-display text-2xl text-neon-strike">{v}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </Section>
    </>
  );
}
