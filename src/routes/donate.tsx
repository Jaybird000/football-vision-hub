import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import img from "@/assets/naari-shakti.jpg";
import { PageHero, Section } from "@/components/site/PageHero";
import { Counter } from "@/components/site/Counter";
import { ctaSoundProps } from "@/lib/sound";
import { requireAccount } from "@/lib/route-guards";

export const Route = createFileRoute("/donate")({
  beforeLoad: requireAccount,
  head: () => ({ meta: [
    { title: "Donate — India Khelo Football" },
    { name: "description", content: "Sponsor a kit, fund a trial, back a city. Every rupee is 80G tax-deductible and goes straight to the grassroots." },
  ]}),
  component: Donate,
});

const tiers = [
  { amt: 500, t: "Kit a Player", b: "Boots, jersey, shorts and shin pads for one trial-stage athlete." },
  { amt: 2500, t: "Sponsor a Trial", b: "Cover venue, refs, and meals for one open trial day in a tier-3 city." },
  { amt: 10000, t: "Fund a Camp Week", b: "Lodging, meals and coaching for one player at a residential camp for a week." },
  { amt: 50000, t: "Adopt a City", b: "Underwrite an entire season of trials in one city. Recognition on all kit." },
];

type Stats = {
  month: string;
  raisedThisMonth: number;
  kitsDelivered: number;
  trialsFunded: number;
  rupeesPerKit: number;
  lastDonor: string;
  minutesAgo: number;
};

function Donate() {
  const [selected, setSelected] = useState(2500);
  const [custom, setCustom] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/donate-stats.json").then(r => r.json()).then(setStats).catch(() => {});
  }, []);

  return (
    <>
      <PageHero eyebrow="Donate"
        title={<>Fuel the <span className="text-gold-ink not-italic mx-[0.1em]">grassroots</span>.</>}
        sub="100% of donations go to player kits, trials, camps, and academy scholarships. Operating costs are covered by our corporate partners — your money goes straight to the pitch."
        image={img} />

      {/* Live impact ticker */}
      {stats && (
        <section className="border-y border-neon-strike/30 bg-pitch-green/15">
          <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-3 gap-6 items-end">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-gold-ink font-bold mb-2">Live · {stats.month}</div>
              <div className="font-display text-5xl md:text-6xl leading-none">
                <Counter to={stats.raisedThisMonth} prefix="₹" />
              </div>
              <div className="text-chalk/82 text-xs uppercase tracking-widest mt-2">raised this month</div>
            </div>
            <div>
              <div className="font-display text-5xl md:text-6xl leading-none text-gold-ink">
                = <Counter to={stats.kitsDelivered} />
              </div>
              <div className="text-chalk/82 text-xs uppercase tracking-widest mt-2">kits delivered to players</div>
            </div>
            <div className="text-sm text-chalk/82">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-2 h-2 rounded-full bg-neon-strike animate-pulse" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-chalk/74 font-bold">Last donation</span>
              </div>
              <div className="font-display text-2xl">{stats.lastDonor}</div>
              <div className="text-chalk/72 text-xs">{stats.minutesAgo} min ago · {stats.trialsFunded} trials funded this month</div>
            </div>
          </div>
        </section>
      )}

      <Section>
        <div className="grid lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7">
            <h2 className="font-display text-4xl uppercase mb-8">Pick a tier</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {tiers.map(tier => {
                const active = selected === tier.amt && custom === "";
                return (
                  <button key={tier.amt} onClick={() => { setSelected(tier.amt); setCustom(""); }}
                    className={`text-left p-6 border transition-colors ${active ? "border-neon-strike bg-pitch-green/20" : "border-chalk/15 bg-pitch-green/5 hover:border-chalk/40"}`}>
                    <div className="font-display text-4xl text-gold-ink">₹{tier.amt.toLocaleString("en-IN")}</div>
                    <h3 className="font-display text-xl uppercase mt-2">{tier.t}</h3>
                    <p className="text-chalk/82 text-sm mt-2">{tier.b}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <aside className="lg:col-span-5 bg-paper-2 border border-black/10 shadow-sm p-8 lg:self-start lg:sticky lg:top-28">
            <h3 className="font-display text-3xl uppercase">Your donation</h3>
            <div className="mt-6">
              <label className="text-xs uppercase tracking-widest text-chalk/82 font-bold">Custom amount (₹)</label>
              <input type="number" value={custom} onChange={e => setCustom(e.target.value)} placeholder="Any amount"
                className="mt-2 w-full bg-pitch-green/10 border border-chalk/15 px-4 py-3 font-display text-2xl text-chalk focus:outline-none focus:border-neon-strike" />
            </div>
            <div className="mt-6 flex justify-between text-sm text-chalk/86">
              <span>Total</span>
              <span className="font-display text-3xl text-gold-ink">₹{(custom ? Number(custom) || 0 : selected).toLocaleString("en-IN")}</span>
            </div>
            {stats && (
              <div className="mt-2 text-xs text-chalk/78">
                ≈ <span className="text-gold-ink font-bold">{Math.max(1, Math.floor((custom ? Number(custom) || 0 : selected) / stats.rupeesPerKit))}</span> player kit{Math.floor((custom ? Number(custom) || 0 : selected) / stats.rupeesPerKit) === 1 ? "" : "s"} delivered
              </div>
            )}
            <button {...ctaSoundProps} className="cta-cursor mt-6 w-full bg-neon-strike text-ink px-8 py-4 font-display text-2xl uppercase tracking-wide hover:scale-[1.01] transition-transform">
              Donate Now
            </button>
            <p className="mt-4 text-[10px] text-chalk/72 uppercase tracking-widest text-center">80G Tax Deductible · Registered Non-Profit</p>
          </aside>
        </div>
      </Section>
    </>
  );
}
