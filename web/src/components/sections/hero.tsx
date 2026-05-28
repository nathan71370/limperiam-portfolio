import { HERO } from "@/content/static";
import { Reveal } from "@/components/reveal";
import { StatusDot } from "@/components/status-dot";
import { Kicker } from "@/components/kicker";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative mx-auto max-w-[var(--max-w)] px-[var(--page-pad)] pt-16 pb-24 md:pt-24 md:pb-32"
    >
      <Reveal>
        <Kicker>{HERO.kicker}</Kicker>
      </Reveal>

      <Reveal delay={80} className="mt-6">
        <h1
          className="font-serif text-ink leading-[1.05] tracking-[-0.01em]"
          style={{ fontSize: "clamp(44px, 8vw, 96px)" }}
        >
          {HERO.headlinePre}
          <em className="text-accent not-italic font-serif italic">
            {HERO.headlineEm}
          </em>
          {HERO.headlinePost}
          <br />
          {HERO.headlinePost2}
        </h1>
      </Reveal>

      <Reveal delay={160} className="mt-8 max-w-2xl">
        <p className="text-[17px] text-ink-soft leading-[1.5]">{HERO.sub}</p>
      </Reveal>

      <Reveal delay={240} className="mt-10 flex flex-wrap items-center gap-4">
        <a
          href={HERO.ctaPrimary.href}
          className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-6 py-3 text-[14px] font-medium hover:bg-accent-deep transition-colors"
        >
          {HERO.ctaPrimary.label}
        </a>
        <a
          href={HERO.ctaSecondary.href}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3 text-[14px] text-ink hover:border-ink transition-colors"
        >
          {HERO.ctaSecondary.label}
        </a>
      </Reveal>

      <Reveal
        delay={320}
        className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-[11px] uppercase tracking-[1.5px] text-ink-mute"
      >
        <span>{HERO.metaLeft}</span>
        <StatusDot label={HERO.statusLabel} />
        <span>{HERO.metaRight}</span>
      </Reveal>
    </section>
  );
}
