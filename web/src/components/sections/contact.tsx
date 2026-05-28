import { CONTACT } from "@/content/static";
import { Reveal } from "@/components/reveal";
import { Kicker } from "@/components/kicker";
import { ContactForm } from "@/components/contact-form";

const CALCOM_LINK = process.env.NEXT_PUBLIC_CALCOM_LINK;

export function Contact() {
  return (
    <section
      id="contact"
      className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)] py-24 md:py-32"
    >
      <Reveal>
        <Kicker>{CONTACT.kicker}</Kicker>
      </Reveal>

      <Reveal delay={80} className="mt-4 max-w-3xl">
        <h2
          className="font-serif text-ink leading-[1.1] tracking-[-0.01em]"
          style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
        >
          {CONTACT.headlinePre}
          <em className="text-accent not-italic font-serif italic">
            {CONTACT.headlineEm}
          </em>
        </h2>
      </Reveal>

      <Reveal delay={160} className="mt-6 max-w-3xl">
        <p className="text-[16px] text-ink-soft leading-[1.6]">{CONTACT.sub}</p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12">
        <Reveal>
          <ContactForm />
        </Reveal>

        <Reveal delay={120} className="space-y-6">
          <div>
            <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
              Email
            </span>
            <a
              href={`mailto:${CONTACT.email}`}
              className="mt-2 block text-[16px] text-ink hover:text-accent"
            >
              {CONTACT.email}
            </a>
          </div>
          <div>
            <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
              Ailleurs
            </span>
            <ul className="mt-2 flex flex-col gap-2">
              {CONTACT.links.map((l) => (
                <li key={l.h}>
                  <a
                    href={l.h}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[15px] text-ink-soft hover:text-ink underline-offset-4 hover:underline"
                  >
                    {l.l} →
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {CALCOM_LINK && (
            <div>
              <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
                Rendez-vous
              </span>
              <a
                href={`https://cal.com/${CALCOM_LINK}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-[13px] font-medium hover:bg-accent-deep transition-colors"
              >
                Réserver un créneau →
              </a>
              <p className="mt-2 text-[11px] text-ink-mute">
                Via Cal.com — choix d&apos;un créneau de 30 min
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
