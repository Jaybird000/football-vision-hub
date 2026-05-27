import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/site/Hero";
import { Ticker } from "@/components/site/Ticker";
import { Pathway } from "@/components/site/Pathway";
import { Personas } from "@/components/site/Personas";
import { StatsWall } from "@/components/site/StatsWall";
import { NaariShakti } from "@/components/site/NaariShakti";
import { Partners } from "@/components/site/Partners";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "India Khelo Football — From the Street to the Stadium" },
      { name: "description", content: "India's grassroots football scouting platform. Open city-round trials — free for girls and underprivileged children — feeding zonal camps, national finals and I-League / ISL scouts." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <>
      <Hero />
      <Ticker />
      <Pathway />
      <Personas />
      <StatsWall />
      <NaariShakti />
      <Partners />
    </>
  );
}
