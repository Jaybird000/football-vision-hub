const IKF_LOGO_BASE = "https://indiakhelofootball.com/media/ui/supportedby";

export function Partners() {
  const partners = [
    { name: "Government of Maharashtra", src: `${IKF_LOGO_BASE}/Screenshot_2025-12-16_at_4.55.31PM.png` },
    { name: "Tata Steel Foundation", src: `${IKF_LOGO_BASE}/tata1.jpeg` },
    { name: "FDDI", src: `${IKF_LOGO_BASE}/Screenshot_2025-12-16_at_5.00.48PM.png` },
    { name: "PubMatic", src: `${IKF_LOGO_BASE}/Screenshot_2025-12-16_at_5.01.30PM.png` },
    { name: "OYO", src: `${IKF_LOGO_BASE}/Screenshot_2025-12-12_at_12.48.26PM.png` },
    { name: "Aavishkar Foundation", src: `${IKF_LOGO_BASE}/Screenshot_2026-05-12_174022.png` },
  ];
  return (
    <section className="py-20 border-y border-chalk/10 bg-pitch-black">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.3em] mb-10 text-chalk/40">Supported By</p>
        <div className="flex flex-wrap justify-center items-center gap-x-10 md:gap-x-14 gap-y-8">
          {partners.map(p => (
            <img
              key={p.name}
              src={p.src}
              alt={p.name}
              loading="lazy"
              className="h-10 md:h-14 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
