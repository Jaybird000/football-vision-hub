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
      { name: "description", content: "India's largest grassroots football scouting platform. Free trials in 50+ cities, direct pathway to ISL academies." },
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
