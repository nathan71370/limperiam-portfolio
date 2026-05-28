"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";
import { CopyEmail } from "@/components/copy-email";
import { ContactForm } from "@/components/contact-form";

const CALCOM_LINK = process.env.NEXT_PUBLIC_CALCOM_LINK;

export function Contact() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const c = t.contact;

  return (
    <section className="section contact" id="contact">
      <div className="shell">
        <Reveal>
          <span className="kicker">{c.kicker}</span>
        </Reveal>
        <h2 className="h2">
          <WordReveal text={c.headline_pre} />
          <span className="it">
            <WordReveal text={c.headline_em} baseDelay={3} />
          </span>
        </h2>
        <Reveal delay={200}>
          <p className="sub" style={{ margin: "16px 0 0" }}>
            {c.sub}
          </p>
        </Reveal>

        <div className="contact-grid">
          <Reveal delay={300} className="email-row">
            <a href={`mailto:${c.email}`} className="email-mega">
              {c.email}
            </a>
            <CopyEmail
              email={c.email}
              copyLabel={c.copy_label}
              copiedLabel={c.copied_label}
            />
          </Reveal>
          <Reveal delay={420}>
            <ul className="elsewhere">
              {c.links.map((lk) => (
                <li key={lk.l}>
                  <a href={lk.h} target="_blank" rel="noreferrer noopener">
                    {lk.l}
                    <span className="arrow">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
          {CALCOM_LINK && (
            <Reveal delay={500}>
              <a
                href={`https://cal.com/${CALCOM_LINK}`}
                target="_blank"
                rel="noreferrer"
                className="btn primary"
                style={{ marginTop: 12 }}
                data-magnetic
              >
                {lang === "fr" ? "Réserver un créneau →" : "Book a slot →"}
              </a>
            </Reveal>
          )}
        </div>

        {/* Contact form (kept from Plan 2 — Tailwind-styled, separate from the editorial section) */}
        <Reveal delay={600} as="div" className="contact-form-wrap">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
