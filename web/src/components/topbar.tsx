"use client";

import { useEffect, useState } from "react";
import { useLangTheme } from "./lang-theme-provider";
import { getDict } from "@/content/i18n";
import { StatusDot } from "./status-dot";
import { LangToggle } from "./lang-toggle";
import { ThemeToggle } from "./theme-toggle";

export function TopBar() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`topbar ${scrolled ? "is-scrolled" : ""}`}>
      <a href="#top" className="brand">
        <StatusDot label={t.hero.status_label} />
        {t.brand}
      </a>
      <nav>
        <a href="#approach">{t.nav.about}</a>
        <a href="#work">{t.nav.work}</a>
        <a href="#stack">{t.nav.stack}</a>
        <a href="#contact">{t.nav.contact}</a>
      </nav>
      <div className="controls">
        <LangToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
