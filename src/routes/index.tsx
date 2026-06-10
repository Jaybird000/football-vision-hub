import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/home/Hero";
import { Pain } from "@/components/home/Pain";
import { Difference } from "@/components/home/Difference";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Credibility } from "@/components/home/Credibility";
import { WhoFor } from "@/components/home/WhoFor";
import { CtaClose } from "@/components/home/CtaClose";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IKF Pathway 360 — An honest picture of your child's football journey" },
      {
        name: "description",
        content:
          "Most parents fund a nine-year football journey with no honest picture of where their child stands. IKF Pathway 360 assesses the whole family and gives you one clear, honest recommendation. Start free.",
      },
      { property: "og:title", content: "IKF Pathway 360 — An honest picture of your child's football journey" },
      {
        property: "og:description",
        content:
          "We assess the family, not just the player. One profile. One honest picture. One recommendation. Built from five years on the ground across 135 cities and villages.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main>
      <Hero />
      <Pain />
      <Difference />
      <HowItWorks />
      <Credibility />
      <WhoFor />
      <CtaClose />
    </main>
  );
}
