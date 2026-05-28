"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

type RevealProps = {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  delay?: number;
};

export function Reveal({
  children,
  as = "div",
  className,
  delay = 0,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);

  // Check synchronously before paint: if the element is already in view
  // (e.g. tab is hidden, or element is above the fold), mark it seen immediately.
  // Synchronising React state with DOM visibility is exactly the use-case for
  // this effect; the lint rule does not apply here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.visibilityState === "hidden") {
      setSeen(true);
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.95 && rect.bottom > 0) {
      setSeen(true);
    }
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Set up IntersectionObserver for elements that start off-screen.
  useEffect(() => {
    if (seen) return;
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.05 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);

  const Tag = as as unknown as React.ElementType;
  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      data-seen={seen ? "true" : "false"}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn("reveal", className)}
    >
      {children}
    </Tag>
  );
}
