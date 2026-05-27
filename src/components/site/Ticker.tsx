export function Ticker() {
  const items = [
    "50,000+ LIVES ENGAGED ACROSS INDIA",
    "ONE-TIME ₹125 CITY REGISTRATION · FREE FOR GIRLS",
    "ZONAL ROUNDS · FREE TO ATTEND",
    "NATIONAL FINALS · FULLY FUNDED",
    "₹0 CHARGED TO CLUBS",
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
