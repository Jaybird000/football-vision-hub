import { useEffect, useRef, useState } from "react";

type Props = {
  to: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  className?: string;
};

export function Counter({ to, duration = 1800, prefix = "", suffix = "", format, className = "" }: Props) {
  const ref = useRef<HTMLSpanElement>(null);
  const [val, setVal] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            setVal(Math.round(to * eased));
            if (t < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.4 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);

  const display = format ? format(val) : val.toLocaleString("en-IN");
  return <span ref={ref} className={className}>{prefix}{display}{suffix}</span>;
}
