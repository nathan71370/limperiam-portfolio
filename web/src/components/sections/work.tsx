import { fetchProjects } from "@/lib/server-fetch";
import { getLang } from "@/lib/prefs";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";
import { WorkItem } from "@/components/work-item";

export async function Work() {
  const projects = await fetchProjects();
  const lang = await getLang();
  const t = getDict(lang);
  const w = t.work;

  return (
    <section className="section" id="work">
      <div className="shell">
        <div className="work-head">
          <div>
            <Reveal>
              <span className="kicker">{w.kicker}</span>
            </Reveal>
            <h2 className="h2">
              <WordReveal text={w.headline_pre} />
              <span className="it">
                <WordReveal text={w.headline_em} baseDelay={3} />
              </span>
              <WordReveal text={w.headline_post} baseDelay={5} />
            </h2>
          </div>
          <Reveal delay={200}>
            <p className="sub" style={{ margin: 0 }}>
              {w.sub}
            </p>
          </Reveal>
        </div>
        <div className="work-list">
          {projects.map((p, i) => (
            <WorkItem key={p.id} item={p} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
