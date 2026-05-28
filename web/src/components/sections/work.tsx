import { WORK_INTRO } from "@/content/static";
import { fetchProjects, type Project } from "@/lib/server-fetch";
import { Reveal } from "@/components/reveal";
import { Kicker } from "@/components/kicker";

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const tech: string[] = Array.isArray(project.tech_stack)
    ? project.tech_stack
    : [];
  const number = String(index + 1).padStart(2, "0");

  return (
    <Reveal>
      <article className="rounded-2xl bg-card border border-line p-8 md:p-10 shadow-card">
        <header className="flex items-baseline justify-between gap-4 border-b border-line pb-4">
          <span className="font-serif text-accent text-[14px] tracking-[2px]">
            {number}
          </span>
          <span className="text-[11px] uppercase tracking-[1.5px] text-ink-mute">
            {project.slug}
          </span>
        </header>
        <h3 className="mt-6 font-serif text-[28px] leading-[1.2] text-ink">
          {project.title}
        </h3>
        <p className="mt-4 text-[15px] text-ink-soft leading-[1.6]">
          {project.description}
        </p>
        {tech.length > 0 && (
          <ul className="mt-6 flex flex-wrap gap-2">
            {tech.map((t) => (
              <li
                key={t}
                className="rounded-full bg-cream-deep px-3 py-1 text-[12px] text-ink-soft"
              >
                {t}
              </li>
            ))}
          </ul>
        )}
        <footer className="mt-6 flex flex-wrap gap-4 text-[13px]">
          {project.live_url && (
            <a
              href={project.live_url}
              target="_blank"
              rel="noreferrer"
              className="text-accent hover:text-accent-deep underline-offset-4 hover:underline"
            >
              Voir →
            </a>
          )}
          {project.repo_url && (
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="text-ink-soft hover:text-ink underline-offset-4 hover:underline"
            >
              Code
            </a>
          )}
          {project.content && (
            <a
              href={`/projects/${project.slug}`}
              className="text-ink-soft hover:text-ink underline-offset-4 hover:underline"
            >
              Détail
            </a>
          )}
        </footer>
      </article>
    </Reveal>
  );
}

export async function Work() {
  const projects = await fetchProjects();

  return (
    <section
      id="work"
      className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)] py-24 md:py-32"
    >
      <Reveal>
        <Kicker>{WORK_INTRO.kicker}</Kicker>
      </Reveal>

      <Reveal delay={80} className="mt-4 max-w-3xl">
        <h2
          className="font-serif text-ink leading-[1.1] tracking-[-0.01em]"
          style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
        >
          {WORK_INTRO.headlinePre}
          <em className="text-accent not-italic font-serif italic">
            {WORK_INTRO.headlineEm}
          </em>
          {WORK_INTRO.headlinePost}
        </h2>
      </Reveal>

      <Reveal delay={160} className="mt-6 max-w-3xl">
        <p className="text-[16px] text-ink-soft leading-[1.6]">
          {WORK_INTRO.sub}
        </p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <p className="text-ink-mute text-[14px] col-span-full">
            Aucun projet publié pour le moment.
          </p>
        ) : (
          projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))
        )}
      </div>
    </section>
  );
}
