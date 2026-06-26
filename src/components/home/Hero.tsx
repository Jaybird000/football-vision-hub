import { Link } from "@tanstack/react-router";
import parentImg from "@/assets/persona-parent.jpg";
import { Reveal } from "./Reveal";

/**
 * Section 1 — The Hero.
 * One job: make the parent feel seen before they feel sold to.
 * No trophies, no stadiums, no professional footballers. A parent watching a
 * child train — invested, attentive, slightly uncertain. That uncertainty is
 * the product.
 */
export function Hero() {
  return (
    <section className="relative bg-[#FFFFFF] text-[#144A6C]">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-28 md:pb-28 md:pt-36 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 animate-fade-up">
            <span className="h-px w-8 bg-[#0A5A94]/40" aria-hidden="true" />
            <span className="font-sans text-[15px] sm:text-[18px] font-bold uppercase tracking-[0.22em] text-[#0A5A94]">
              IKF Pathway&nbsp;360
            </span>
          </span>
          <h1
            className="mt-6 font-serif text-[clamp(2.25rem,5.2vw,4rem)] font-medium leading-[1.06] tracking-[-0.015em] animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            Your child has football in them.
            <span className="mt-2 block text-[#0A5A94]">
              Do you know where it leads?
            </span>
          </h1>
          <p
            className="mt-7 max-w-xl font-sans text-lg leading-relaxed text-[#3A4754] animate-fade-up"
            style={{ animationDelay: "0.25s" }}
          >
            Most parents spend nine years funding a football journey with no
            honest picture of where their child stands, what it means, or what
            comes next. IKF Pathway 360 changes that.
          </p>
          <div className="mt-10 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#FDFE00] px-8 py-4 font-sans text-base font-semibold text-[#1A2229] transition-colors duration-300 hover:bg-[#E0C800]"
            >
              Start your child's profile — it's free
            </Link>
          </div>
        </div>

        <Reveal className="relative">
          <div className="relative overflow-hidden rounded-2xl">
            <img
              src={parentImg}
              alt="A parent watching their child train"
              width={800}
              height={1000}
              className="h-[clamp(22rem,46vw,34rem)] w-full object-cover"
              style={{ filter: "saturate(0.82) contrast(1.02)" }}
            />
            {/* Warm, quiet overlay — keeps the moment human, never glossy. */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#144A6C]/25 via-transparent to-transparent" />
            <div className="pointer-events-none absolute inset-0 mix-blend-multiply bg-[#1A2229]/8" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
