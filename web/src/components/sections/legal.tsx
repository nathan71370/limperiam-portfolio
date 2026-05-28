import { LEGAL } from "@/content/static";
import { Reveal } from "@/components/reveal";
import { Kicker } from "@/components/kicker";

export function Legal() {
  return (
    <section id="legal" className="bg-stage-2 border-y border-line py-24">
      <div className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)]">
        <Reveal>
          <Kicker>{LEGAL.kicker}</Kicker>
        </Reveal>

        <Reveal delay={80} className="mt-4 max-w-3xl">
          <h2
            className="font-serif text-ink leading-[1.1] tracking-[-0.01em]"
            style={{ fontSize: "clamp(28px, 4vw, 44px)" }}
          >
            {LEGAL.headlinePre}
            <em className="text-accent not-italic font-serif italic">
              {LEGAL.headlineEm}
            </em>
          </h2>
        </Reveal>

        <Reveal delay={160} className="mt-6 max-w-3xl">
          <p className="text-[15px] text-ink-soft leading-[1.6]">{LEGAL.sub}</p>
        </Reveal>

        <Reveal delay={240} className="mt-12 max-w-2xl">
          <dl className="grid grid-cols-1 md:grid-cols-[max-content_1fr] gap-x-8 gap-y-3 text-[14px]">
            {LEGAL.rows.map((row) => (
              <div key={row.l} className="contents">
                <dt className="text-ink-mute uppercase tracking-[1.5px] text-[11px]">
                  {row.l}
                </dt>
                <dd className="text-ink">{row.v}</dd>
              </div>
            ))}
          </dl>
          <a
            href={LEGAL.link.h}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-block text-[13px] text-accent hover:text-accent-deep underline-offset-4 hover:underline"
          >
            {LEGAL.link.l} →
          </a>
        </Reveal>
      </div>
    </section>
  );
}
