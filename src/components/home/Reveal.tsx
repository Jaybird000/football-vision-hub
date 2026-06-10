import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  /** Stagger in ms — useful when revealing siblings in sequence. */
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
};

/**
 * Gentle scroll-into-view fade for the IKF Pathway 360 homepage.
 * Adds `.is-visible` once the element enters the viewport, then disconnects.
 * Honours prefers-reduced-motion via the .calm-up CSS rules.
 */
export function Reveal({ children, as, delay = 0, className = "", style }: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`calm-up ${visible ? "is-visible" : ""} ${className}`.trim()}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
    >
      {children}
    </Tag>
  );
}
