"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

function useReveal(opts: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      setSeen(true);
      return;
    }
    const r = ref.current.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
      setSeen(true);
    }
  }, []);

  useEffect(() => {
    if (seen || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.05, ...opts },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, opts]);

  return [ref, seen] as const;
}

type RevealProps = {
  children: React.ReactNode;
  as?: "div" | "span" | "section" | "header" | "p" | "li";
  className?: string;
  delay?: number;
};

export function Reveal({
  children,
  as = "div",
  className = "",
  delay = 0,
}: RevealProps) {
  const [ref, seen] = useReveal();
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      className={`r-up ${className} ${seen ? "is-in" : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

export { useReveal };
