"use client";

import { useEffect } from "react";

export function MagneticHandler() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-magnetic]"),
    );
    const onMove =
      (el: HTMLElement) =>
      (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      };
    const onLeave = (el: HTMLElement) => () => {
      el.style.transform = "";
    };
    const handlers = els.map((el) => {
      const m = onMove(el);
      const l = onLeave(el);
      el.addEventListener("mousemove", m);
      el.addEventListener("mouseleave", l);
      el.style.transition = "transform 360ms cubic-bezier(.2,.7,.15,1)";
      return { el, m, l };
    });
    return () => {
      handlers.forEach(({ el, m, l }) => {
        el.removeEventListener("mousemove", m);
        el.removeEventListener("mouseleave", l);
      });
    };
  });

  return null;
}
