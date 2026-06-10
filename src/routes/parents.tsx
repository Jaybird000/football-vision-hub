import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import img from "@/assets/persona-parent.jpg";
import { PageHero, Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/parents")({
  head: () => ({ meta: [
    { title: "For Parents — India Khelo Football" },
    { name: "description", content: "Education, safety, and a structured football career path for your child — fully funded by IKF." },
  ]}),
  component: Parents,
});

function Parents() {
  const faqs = [
    { q: "Will my child's education continue?", a: "Yes. Every IKF academy partner provides full-time CBSE schooling alongside training. Football and education are equal commitments." },
    { q: "Is there any cost involved?", a: "No. From trials to placement to academy lodging — everything is fully funded by IKF and our partners. We charge zero rupees to families." },
    { q: "How safe are the camps?", a: "Residential camps follow AIFF Safeguarding Standards — female chaperones for girls, certified medical staff, and child-protection trained coaches." },
    { q: "What if my child doesn't make it pro?", a: "Every IKF graduate leaves with school qualifications, a Level-1 coaching certificate, and pathways into university sports scholarships." },
  ];
  return (
    <>
      <PageHero eyebrow="For Parents"
        title={<>Their <span className="text-gold-ink not-italic mx-[0.1em]">future</span><br />is in safe hands.</>}
        sub="Sending a child into competitive sport is a leap of faith. IKF makes it a structured, safe, and education-first journey — built for parents who care."
        image={img}
        quote={{ text: "We were terrified the day she left for camp. A year on, she's stronger, sharper at school, and chasing something real.", author: "Sunita Devi", role: "Mother of an IKF scholar, Patna" }} />
      <Section className="!pb-0">
        <div className="bg-pitch-green/10 border border-neon-strike/30 p-8 md:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em]">IKF Pathway 360</span>
            <h2 className="font-display text-3xl md:text-4xl uppercase mt-3">New here? Start with our parent guide.</h2>
            <p className="mt-3 text-chalk/86 leading-relaxed">Understand exactly what IKF Pathway 360 is, the journey your child goes through, and what you can expect — before you sign up.</p>
          </div>
          <Link to="/parents/pathway" className="inline-flex items-center justify-center gap-2 bg-neon-strike text-ink px-7 py-3.5 rounded-full font-bold text-sm uppercase tracking-wider hover:brightness-95 transition-all shrink-0">
            Read the guide <ArrowRight size={16} />
          </Link>
        </div>
      </Section>
      <Section>
        <h2 className="font-display text-4xl md:text-5xl uppercase mb-10 md:mb-12">Questions, answered.</h2>
        <div className="space-y-1">
          {faqs.map((f, i) => (
            <details key={i} className="group bg-pitch-green/10 border border-chalk/10 p-6 open:bg-pitch-green/20">
              <summary className="cursor-pointer flex justify-between items-center font-display text-2xl uppercase">
                {f.q}
                <span className="text-gold-ink text-3xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-chalk/86 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
