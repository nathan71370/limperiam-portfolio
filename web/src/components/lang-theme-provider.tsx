"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { setLangAction, setThemeAction } from "@/app/actions/prefs";
import type { Lang } from "@/content/i18n";

type Theme = "light" | "dark";

type Ctx = {
  lang: Lang;
  theme: Theme;
  setLang: (v: Lang) => void;
  setTheme: (v: Theme) => void;
};

const LangThemeContext = createContext<Ctx | null>(null);

export function LangThemeProvider({
  initialLang,
  initialTheme,
  children,
}: {
  initialLang: Lang;
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setLang = (v: Lang) => {
    setLangState(v);
    void setLangAction(v);
  };
  const setTheme = (v: Theme) => {
    setThemeState(v);
    void setThemeAction(v);
  };

  return (
    <LangThemeContext.Provider value={{ lang, theme, setLang, setTheme }}>
      {children}
    </LangThemeContext.Provider>
  );
}

export function useLangTheme(): Ctx {
  const ctx = useContext(LangThemeContext);
  if (!ctx)
    throw new Error("useLangTheme must be used inside LangThemeProvider");
  return ctx;
}
