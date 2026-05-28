"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";

export function Hero() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const hero = t.hero;

  return (
    <section className="hero section" id="top">
      <div className="hero-mark" aria-hidden="true">
        L
      </div>
      <div className="shell">
        <Reveal>
          <span className="kicker kicker--accent">{hero.kicker}</span>
        </Reveal>
        <h1 className="display">
          <WordReveal text={hero.headline_pre} />
          <span className="it">
            <WordReveal text={hero.headline_em} baseDelay={3} />
          </span>
          <WordReveal text={hero.headline_post} baseDelay={5} />
          <br />
          <span className="it">
            <WordReveal text={hero.headline_post2} baseDelay={7} />
          </span>
        </h1>
        <Reveal delay={500} className="hero-sub">
          <p style={{ margin: 0 }}>{hero.sub}</p>
        </Reveal>
        <Reveal delay={650} className="hero-actions">
          <a href="#work" className="btn btn--primary" data-magnetic>
            {hero.cta_primary}
            <span className="arrow">→</span>
          </a>
          <a href="#contact" className="btn btn--ghost" data-magnetic>
            {hero.cta_secondary}
          </a>
        </Reveal>
      </div>
      <div className="hero-foot">
        <span className="hero-status">
          <span className="pip" />
          {hero.meta_left}
        </span>
        <span>{hero.meta_right}</span>
      </div>
    </section>
  );
}
