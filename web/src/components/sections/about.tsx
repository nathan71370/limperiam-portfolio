import { ABOUT } from "@/content/static";
import { Reveal } from "@/components/reveal";
import { Kicker } from "@/components/kicker";

export function About() {
  return (
    <section
      id="about"
      className="bg-stage-2 border-y border-line py-24 md:py-32"
    >
      <div className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)]">
        <Reveal>
          <Kicker>{ABOUT.kicker}</Kicker>
        </Reveal>

        <Reveal delay={80} className="mt-4 max-w-3xl">
          <h2
            className="font-serif text-ink leading-[1.1] tracking-[-0.01em]"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            {ABOUT.headlinePre}
            <em className="text-accent not-italic font-serif italic">
              {ABOUT.headlineEm}
            </em>
            {ABOUT.headlinePost}
          </h2>
        </Reveal>

        <Reveal delay={160} className="mt-6 max-w-3xl">
          <p className="text-[16px] text-ink-soft leading-[1.6]">{ABOUT.lede}</p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {ABOUT.pillars.map((pillar, i) => (
            <Reveal key={pillar.k} delay={i * 80}>
              <article className="rounded-2xl bg-card border border-line p-8 shadow-card h-full">
                <span className="font-serif text-accent text-[14px] tracking-[2px]">
                  {pillar.k}
                </span>
                <h3 className="mt-4 font-serif text-[26px] leading-[1.2] text-ink">
                  {pillar.tPre}
                  <em className="text-accent not-italic font-serif italic">
                    {pillar.tEm}
                  </em>
                </h3>
                <p className="mt-4 text-[14px] text-ink-soft leading-[1.6]">
                  {pillar.d}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
