import { createFileRoute } from "@tanstack/react-router";
import { Section } from "@/components/site/PageHero";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy — IKF Pathway 360" },
    { name: "description", content: "How India Khelo Football collects, uses, and protects information shared by parents on the IKF Pathway 360 platform." },
  ]}),
  component: Privacy,
});

function Privacy() {
  return (
    <Section>
      <div className="max-w-3xl">
        <span className="text-gold-ink font-bold text-xs uppercase tracking-[0.3em]">Privacy</span>
        <h1 className="font-display uppercase italic text-5xl md:text-6xl mt-3 leading-[0.95]">IKF Pathway 360 privacy policy</h1>
        <p className="mt-3 text-sm text-chalk/74 uppercase tracking-widest">Last updated: 26 May 2026</p>

        <div className="mt-8 border-l-4 border-neon-strike bg-pitch-green/10 p-5 text-sm text-chalk/80 leading-relaxed">
          <strong className="text-chalk">Draft pending legal review.</strong> This page is a working version. The structure
          below reflects how IKF intends to handle parent and child data on the IKF Pathway 360 platform; the final wording
          will be issued by IKF's legal team before the platform opens to a wider audience.
        </div>

        <div className="mt-12 space-y-10 text-chalk/80 leading-relaxed">
          <Block title="What we collect">
            <p>When a parent uses IKF Pathway 360 we collect the information you give us directly: your name and contact details, your child's name, age and gender, your answers to the Stage 1 intent questions, and any assessment reports you upload in Stage 2 (scouting, psychometric, physical, academic, personality).</p>
          </Block>

          <Block title="Why we collect it">
            <p>Everything we collect is used to help IKF advisors understand your child and recommend a pathway. We do not use this information for advertising, sell it to third parties, or share it outside the people who need it to do that work.</p>
          </Block>

          <Block title="Who can see it">
            <p>Your assigned IKF advisor and a small set of IKF administrators can view your profile. Third-party assessment providers see only the information you choose to share with them directly when you book their service. Aggregated, de-identified data may be used for internal reporting and to demonstrate impact to partners.</p>
          </Block>

          <Block title="How long we keep it">
            <p>The IKF Pathway 360 platform is built to track a child's development over many years. We hold your profile for as long as you are in the IKF network. You can ask us to close the profile and delete its contents at any time by contacting your advisor.</p>
          </Block>

          <Block title="Your rights">
            <p>You can request a copy of what we hold about you and your child, ask us to correct anything that is wrong, or ask us to delete the profile entirely. Contact your assigned IKF advisor, or write to the email below.</p>
          </Block>

          <Block title="Contact">
            <p>India Khelo Football · <a href="https://indiakhelofootball.com" className="text-gold-ink underline">indiakhelofootball.com</a></p>
            <p className="mt-1 text-chalk/74 text-sm">A dedicated privacy contact address will be added before public launch.</p>
          </Block>
        </div>
      </div>
    </Section>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display uppercase text-2xl md:text-3xl text-chalk">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
