"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";

export function Legal() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const l = t.legal;

  return (
    <section className="section" id="legal">
      <div className="shell">
        <Reveal>
          <span className="kicker">{l.kicker}</span>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="h2">
            {l.headline_pre}
            <span className="it">{l.headline_em}</span>
          </h2>
        </Reveal>
        <Reveal delay={220}>
          <p className="sub">{l.sub}</p>
        </Reveal>
        <div className="legal-grid">
          <Reveal delay={280}>
            <a
              className="legal-link"
              href={l.link.h}
              target="_blank"
              rel="noopener noreferrer"
            >
              {l.link.l}
              <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
          <div className="legal-table">
            {l.rows.map((r, i) => (
              <Reveal key={r.l} delay={120 + i * 60}>
                <div className="legal-row">
                  <span className="l">{r.l}</span>
                  <span className="v">{r.v}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
