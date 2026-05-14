import { createFileRoute } from "@tanstack/react-router";
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
        title={<>Their <span className="text-neon-strike not-italic">future</span><br />is in safe hands.</>}
        sub="Sending a child into competitive sport is a leap of faith. IKF makes it a structured, safe, and education-first journey — built for parents who care."
        image={img} />
      <Section>
        <h2 className="font-display text-5xl uppercase mb-12">Questions, answered.</h2>
        <div className="space-y-1">
          {faqs.map((f, i) => (
            <details key={i} className="group bg-pitch-green/10 border border-chalk/10 p-6 open:bg-pitch-green/20">
              <summary className="cursor-pointer flex justify-between items-center font-display text-2xl uppercase">
                {f.q}
                <span className="text-neon-strike text-3xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-chalk/70 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </Section>
    </>
  );
}
