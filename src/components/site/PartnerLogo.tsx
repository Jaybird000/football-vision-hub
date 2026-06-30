import { useState } from "react";

/**
 * Renders a partner logo image, falling back to a clean text wordmark if the
 * image file is missing (e.g. the MFK logo before the asset is dropped into
 * /public). The moment the real file exists at `src`, the image renders.
 */
export function PartnerLogo({
  src,
  alt,
  className,
  fallbackClassName,
}: {
  src: string;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={
          fallbackClassName ??
          "font-display text-2xl font-bold uppercase tracking-tight text-[#1A2229]"
        }
      >
        {alt}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      draggable={false}
      onError={() => setFailed(true)}
    />
  );
}
