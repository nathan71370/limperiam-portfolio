import { STACK_INTRO } from "@/content/static";
import { fetchSkills, type Skill } from "@/lib/server-fetch";
import { Reveal } from "@/components/reveal";
import { Kicker } from "@/components/kicker";

const CATEGORY_LABEL: Record<Skill["category"], string> = {
  backend: "Backend",
  frontend: "Frontend",
  devops: "DevOps",
  tools: "Outils",
  soft: "Pratique",
};

const CATEGORY_ORDER: Skill["category"][] = [
  "backend",
  "frontend",
  "devops",
  "tools",
  "soft",
];

function groupSkills(skills: Skill[]) {
  const groups = new Map<Skill["category"], Skill[]>();
  for (const cat of CATEGORY_ORDER) groups.set(cat, []);
  for (const s of skills) {
    const arr = groups.get(s.category);
    if (arr) arr.push(s);
  }
  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABEL[cat],
    items: groups.get(cat) ?? [],
  })).filter((g) => g.items.length > 0);
}

export async function Stack() {
  const skills = await fetchSkills();
  const groups = groupSkills(skills);

  return (
    <section
      id="stack"
      className="bg-stage-2 border-y border-line py-24 md:py-32"
    >
      <div className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)]">
        <Reveal>
          <Kicker>{STACK_INTRO.kicker}</Kicker>
        </Reveal>

        <Reveal delay={80} className="mt-4 max-w-3xl">
          <h2
            className="font-serif text-ink leading-[1.1] tracking-[-0.01em]"
            style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
          >
            {STACK_INTRO.headlinePre}
            <em className="text-accent not-italic font-serif italic">
              {STACK_INTRO.headlineEm}
            </em>
          </h2>
        </Reveal>

        <Reveal delay={160} className="mt-6 max-w-3xl">
          <p className="text-[16px] text-ink-soft leading-[1.6]">
            {STACK_INTRO.sub}
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length === 0 ? (
            <p className="text-ink-mute text-[14px] col-span-full">
              Stack à venir.
            </p>
          ) : (
            groups.map((group, i) => (
              <Reveal key={group.category} delay={i * 60}>
                <div className="rounded-2xl bg-card border border-line p-6 shadow-card h-full">
                  <h3 className="font-serif text-[20px] text-ink">
                    {group.label}
                  </h3>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {group.items.map((s) => (
                      <li
                        key={s.id}
                        className="rounded-full bg-cream-deep px-3 py-1 text-[13px] text-ink-soft"
                      >
                        {s.name}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
