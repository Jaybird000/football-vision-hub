import logoUrl from "@/assets/ikf-logo.png";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img
        src={logoUrl}
        alt="India Khelo Football"
        width={140}
        height={44}
        className="h-9 md:h-10 w-auto select-none"
        draggable={false}
      />
    </div>
  );
}
