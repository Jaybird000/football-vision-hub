export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="size-9 rounded-sm bg-ikf-yellow grid place-items-center font-display text-pitch-black text-base tracking-tighter leading-none pt-1">
        IKF
      </div>
      <div className="hidden sm:flex flex-col leading-none">
        <span className="font-display text-base tracking-tight">INDIA KHELO</span>
        <span className="font-display text-base tracking-tight text-neon-strike">FOOTBALL<span className="text-chalk">.</span></span>
      </div>
    </div>
  );
}
