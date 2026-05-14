export function Ticker() {
  const items = [
    "LIVE TRIALS · KOLKATA · OCT 12-14",
    "50,000+ REGISTERED PLAYERS",
    "14 SCOUTS ON PITCH",
    "NEXT TRIAL · MUMBAI · OCT 20",
    "420 ACADEMY PLACEMENTS · 12 ISL CONTRACTS",
  ];
  return (
    <div className="bg-neon-strike text-pitch-black py-3 overflow-hidden border-y border-pitch-black/10">
      <div className="animate-marquee whitespace-nowrap flex w-max">
        {[0, 1].map(loop => (
          <div key={loop} className="flex items-center gap-10 px-5 shrink-0">
            {items.map((it, i) => (
              <span key={`${loop}-${i}`} className="font-display font-semibold text-sm md:text-base uppercase tracking-wider flex items-center gap-10">
                {it}
                <span className="size-1.5 bg-pitch-black rounded-full" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
