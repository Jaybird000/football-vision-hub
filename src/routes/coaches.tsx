import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/persona-coach.jpg";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/coaches")({
  head: () => ({ meta: [
    { title: "For Coaches — India Khelo Football" },
    { name: "description", content: "Nominate talent, get AIFF-aligned certification, and become part of India's largest grassroots scouting network." },
  ]}),
  component: Coaches,
});

function Coaches() {
  const tracks = [
    { t: "Talent Nomination", b: "Submit your best players directly to our scouts. Verified coaches get priority lane review." },
    { t: "AIFF-Aligned Certification", b: "D-License and C-License courses subsidised for IKF coaches. Online + in-person modules." },
    { t: "Coach Network", b: "Join a community of 1,400+ grassroots coaches across India. Monthly clinics, peer reviews, free resources." },
  ];
  return (
    <>
      <PageHero eyebrow="For Coaches"
        title={<>You see them <span className="text-gold-ink not-italic mx-[0.1em]">first</span>.</>}
        sub="Grassroots coaches are the most important scouts in Indian football. IKF gives you the certification, network, and pipeline to channel that talent."
        image={img}
        quote={{ text: "I've coached on broken pitches for 14 years. IKF was the first organisation to actually pick up the phone when I called about a player.", author: "Sandeep Rawat", role: "D-License coach, Dehradun" }} />
      <Section>
        <div className="grid md:grid-cols-3 gap-3">
          {tracks.map(t => (
            <div key={t.t} className="bg-pitch-green/10 border border-chalk/10 p-8 hover:border-neon-strike transition-colors">
              <h3 className="font-display text-3xl uppercase text-gold-ink">{t.t}</h3>
              <p className="mt-4 text-chalk/86 leading-relaxed">{t.b}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
