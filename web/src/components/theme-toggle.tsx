"use client";

import { useLangTheme } from "./lang-theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useLangTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className="ctl"
      onClick={() => setTheme(next)}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "☼" : "☾"}
    </button>
  );
}
