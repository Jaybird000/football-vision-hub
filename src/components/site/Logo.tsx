import logoUrl from "@/assets/ikf-logo.png";

export function Logo({ className = "", size = "md" }: { className?: string; size?: "md" | "lg" }) {
  const sizing = size === "lg" ? "h-14 md:h-16" : "h-11 md:h-12";
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoUrl}
        alt="India Khelo Football"
        width={1620}
        height={886}
        className={`${sizing} w-auto select-none`}
        draggable={false}
      />
    </div>
  );
}
