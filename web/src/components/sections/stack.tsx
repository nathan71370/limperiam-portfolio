import { fetchSkills, type Skill } from "@/lib/server-fetch";
import { getLang } from "@/lib/prefs";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";

const CATEGORY_LABEL_FR: Record<Skill["category"], string> = {
  backend: "Backend",
  frontend: "Frontend",
  tools: "Mobile",
  devops: "DevOps",
  soft: "Pratique",
};

const CATEGORY_LABEL_EN: Record<Skill["category"], string> = {
  backend: "Backend",
  frontend: "Frontend",
  tools: "Mobile",
  devops: "DevOps",
  soft: "Practice",
};

const CATEGORY_ORDER: Skill["category"][] = [
  "backend",
  "frontend",
  "tools",
  "devops",
  "soft",
];

function groupSkills(
  skills: Skill[],
  labels: Record<Skill["category"], string>,
) {
  const groups = new Map<Skill["category"], Skill[]>();
  for (const cat of CATEGORY_ORDER) groups.set(cat, []);
  for (const s of skills) {
    const arr = groups.get(s.category);
    if (arr) arr.push(s);
  }
  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: labels[cat],
    items: groups.get(cat) ?? [],
  })).filter((g) => g.items.length > 0);
}

export async function Stack() {
  const skills = await fetchSkills();
  const lang = await getLang();
  const t = getDict(lang);
  const s = t.stack;
  const labels = lang === "fr" ? CATEGORY_LABEL_FR : CATEGORY_LABEL_EN;
  const groups = groupSkills(skills, labels);
  const flat = groups.flatMap((g) => g.items.map((it) => it.name));

  const marqueeText = (
    <>
      {flat.map((it, i) => (
        <span key={`m-${i}`} className="marquee-cell">
          {i % 3 === 1 ? (
            <span className="it">{it}</span>
          ) : (
            <span>{it}</span>
          )}
          <span className="dot">·</span>
        </span>
      ))}
    </>
  );

  return (
    <section className="section section--alt" id="stack">
      <div className="shell">
        <div className="work-head">
          <div>
            <Reveal>
              <span className="kicker">{s.kicker}</span>
            </Reveal>
            <h2 className="h2">
              <WordReveal text={s.headline_pre} />
              <span className="it">
                <WordReveal text={s.headline_em} baseDelay={2} />
              </span>
            </h2>
          </div>
          <Reveal delay={200}>
            <p className="sub" style={{ margin: 0 }}>
              {s.sub}
            </p>
          </Reveal>
        </div>
        <div className="stack-grid">
          {groups.map((g, i) => (
            <Reveal key={g.category} delay={i * 100} className="stack-card">
              <h3>{g.label}</h3>
              <ul>
                {g.items.map((it) => (
                  <li key={it.id}>{it.name}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {marqueeText}
          {marqueeText}
        </div>
      </div>
    </section>
  );
}
