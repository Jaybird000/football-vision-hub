import { type CSSProperties } from "react";

type Props = {
  text: string;
  className?: string;
  delay?: number; // seconds
  stagger?: number; // seconds per char
  as?: "span" | "div";
};

export function SplitReveal({ text, className = "", delay = 0, stagger = 0.025, as = "span" }: Props) {
  const Tag = as as "span";
  const words = text.split(" ");
  let charIndex = 0;
  return (
    <Tag className={`split-reveal ${className}`} aria-label={text}>
      {words.map((word, wi) => (
        <span key={wi} className="inline-block whitespace-nowrap">
          {word.split("").map((ch, ci) => {
            const i = charIndex++;
            const style: CSSProperties = {
              animationDelay: `${delay + i * stagger}s`,
            };
            return (
              <span key={ci} className="split-char inline-block" style={style} aria-hidden>
                {ch}
              </span>
            );
          })}
          {wi < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </Tag>
  );
}
