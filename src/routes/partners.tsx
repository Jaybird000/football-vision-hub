import { createFileRoute } from "@tanstack/react-router";
import img from "@/assets/persona-partner.jpg";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/partners")({
  head: () => ({ meta: [
    { title: "For Partners — India Khelo Football" },
    { name: "description", content: "Corporate CSR, brand partnerships, and academy sponsorship opportunities with India's largest football grassroots platform." },
  ]}),
  component: Partners,
});

function Partners() {
  return (
    <>
      <PageHero eyebrow="For Partners"
        title={<>Build the next <span className="text-neon-strike not-italic">India</span>.</>}
        sub="Brands, corporates, and federations: partner with IKF to fund, scale, and shape the most ambitious grassroots sports programme in India."
        image={img}
        quote={{ text: "Our CSR rupees finally feel like they hit the pitch. The IKF impact dashboard tells us exactly which kid wore which kit.", author: "Ritika Menon", role: "Head of CSR, Partner Brand" }} />
      <Section>
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="font-display text-4xl uppercase">Why IKF</h2>
            <ul className="mt-6 space-y-4 text-chalk/80">
              {["50,000+ lives already engaged through IKF's pathway","Verified 80G non-profit — full CSR eligibility","City-round to national-final pipeline feeding I-League & ISL scouts","Dedicated impact dashboard for every partner"].map(p => (
                <li key={p} className="flex gap-3"><span className="text-neon-strike">→</span>{p}</li>
              ))}
            </ul>
          </div>
          <div className="bg-pitch-green/15 p-10 border-l-4 border-neon-strike">
            <h3 className="font-display text-3xl uppercase">Partnership Tracks</h3>
            <div className="mt-6 space-y-5">
              {[
                { t: "Title Sponsor", b: "National season-long visibility across every IKF city round, zonal camp and final." },
                { t: "City Chapter", b: "Sponsor a city — own all trials, kits, and impact in that geography." },
                { t: "Naari Shakti Patron", b: "Power women's football pathways across rural India." },
              ].map(p => (
                <div key={p.t}>
                  <h4 className="font-display text-xl uppercase text-neon-strike">{p.t}</h4>
                  <p className="text-chalk/70 text-sm mt-1">{p.b}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
