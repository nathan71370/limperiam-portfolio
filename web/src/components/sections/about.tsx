"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";

export function About() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const a = t.about;

  return (
    <section className="section section--alt" id="approach">
      <div className="shell">
        <div className="about-grid">
          <div>
            <Reveal>
              <span className="kicker">{a.kicker}</span>
            </Reveal>
            <h2 className="h2">
              <WordReveal text={a.headline_pre} />
              <span className="it">
                <WordReveal text={a.headline_em} baseDelay={2} />
              </span>
              <WordReveal text={a.headline_post} baseDelay={4} />
            </h2>
          </div>
          <Reveal delay={200}>
            <p className="lede" style={{ margin: 0 }}>
              {a.lede}
            </p>
          </Reveal>
        </div>
        <div className="pillars">
          {a.pillars.map((p, i) => (
            <Reveal key={p.k} delay={i * 120} className="pillar">
              <div className="num">{p.k}</div>
              <div className="ttl">
                {p.t_pre}
                <span className="it">{p.t_em}</span>
              </div>
              <div className="desc">{p.d}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
