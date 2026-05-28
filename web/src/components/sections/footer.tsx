"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";

export function Footer() {
  const { lang } = useLangTheme();
  const f = getDict(lang).footer;

  return (
    <footer className="foot">
      <div>
        <span className="b">{f.brand}</span>
        <span style={{ marginLeft: 12 }}>— {f.tagline}</span>
      </div>
      <div>{f.colophon}</div>
    </footer>
  );
}
