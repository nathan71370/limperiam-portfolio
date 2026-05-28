"use client";

import { useReveal } from "./reveal";

type Props = {
  text: string;
  className?: string;
  baseDelay?: number;
};

export function WordReveal({ text, className = "", baseDelay = 0 }: Props) {
  const [ref, seen] = useReveal({ threshold: 0.4 });
  const words = text.split(/(\s+)/);
  return (
    <span
      ref={ref as React.RefObject<HTMLElement>}
      className={`word-reveal ${className} ${seen ? "is-in" : ""}`}
    >
      {words.map((w, i) =>
        /\s/.test(w) ? (
          <span key={i} className="ws">
            {w}
          </span>
        ) : (
          <span
            key={i}
            className="w"
            style={{ transitionDelay: `${(baseDelay + i) * 40}ms` }}
          >
            {w}
          </span>
        ),
      )}
    </span>
  );
}
