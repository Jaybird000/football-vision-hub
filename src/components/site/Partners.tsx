export function Partners() {
  const partners = ["Hero ISL", "AIFF", "LaLiga", "Bundesliga", "SAI", "Kalyani Group"];
  return (
    <section className="py-20 border-y border-chalk/10 bg-pitch-black">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] mb-10 text-chalk/40">Backed By</p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
          {partners.map(p => (
            <span key={p} className="font-display text-2xl md:text-3xl uppercase text-chalk/40 hover:text-chalk transition-colors">{p}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
