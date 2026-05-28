"use client";

import { useLangTheme } from "./lang-theme-provider";

export function LangToggle() {
  const { lang, setLang } = useLangTheme();
  return (
    <div className="lang-switch" role="tablist" aria-label="Language">
      <button
        className={lang === "fr" ? "is-active" : ""}
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
      >
        FR
      </button>
      <button
        className={lang === "en" ? "is-active" : ""}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}
