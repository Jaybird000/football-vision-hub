import { PartnerLogo } from "./PartnerLogo";

/**
 * Equal-visibility partner attribution: "Powered by — Sports Vision" and
 * "Digital Partner — MyFirstKick (MFK)" (client feedback 25 Jun 2026, item 1.c).
 *
 * Both logos render at the SAME height (h-12 / md:h-14) so they read as equal
 * size despite different source proportions. Rendered in the global site footer
 * (src/routes/__root.tsx) so it appears on every page.
 */
// Both source images are trimmed to their ink (no padding), so rendering at the
// same height makes them the same visual size. Their ink ratios are near-equal
// (SV 4.66, MFK 4.20), so widths come out within ~10% — same height and length.
const LOGO_SIZE = "h-11 w-auto object-contain md:h-14";
// Sports Vision rendered 15% smaller than MFK (44→37px, 56→48px) per request.
const SV_SIZE = "h-[37px] w-auto object-contain md:h-[48px]";
const LABEL = "text-[11px] font-bold uppercase tracking-[0.25em] text-[#1A2229]/70";

export function PartnerLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-12 gap-y-6 ${className}`}>
      <div className="flex flex-col items-center gap-2">
        <p className={LABEL}>Powered by</p>
        <a
          href="https://www.sportsvision.ai/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Sports Vision"
          className="inline-block opacity-90 transition-opacity hover:opacity-100"
        >
          <img src="/SV_01_Black.png" alt="Sports Vision" className={SV_SIZE} draggable={false} />
        </a>
      </div>

      <div
        className="hidden h-12 w-px self-center bg-black/10 sm:block md:h-16"
        aria-hidden="true"
      />

      <div className="flex flex-col items-center gap-2">
        <p className={LABEL}>Digital Partner</p>
        <PartnerLogo
          src="/MFK_Logo.png"
          alt="MyFirstKick"
          className={LOGO_SIZE}
          fallbackClassName="font-display text-2xl font-bold uppercase tracking-tight text-[#1A2229]"
        />
      </div>
    </div>
  );
}
