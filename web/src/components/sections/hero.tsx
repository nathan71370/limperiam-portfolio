"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";

export function Hero() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const hero = t.hero;
  const contactEmail = t.contact.email;

  return (
    <section className="hero shell" id="top">
      <Reveal className="hero-status">
        <span className="pip" />
        {hero.meta_left} · {hero.meta_right}
      </Reveal>
      <h1 className="hero-title">
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
        <p>{hero.sub}</p>
      </Reveal>
      <Reveal delay={650} className="hero-actions">
        <a className="btn primary" href="#work" data-magnetic>
          {hero.cta_primary}
        </a>
        <a className="btn ghost" href={`mailto:${contactEmail}`} data-magnetic>
          {hero.cta_secondary}
        </a>
      </Reveal>
    </section>
  );
}
