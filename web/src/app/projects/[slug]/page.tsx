import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { fetchProjectBySlug } from "@/lib/server-fetch";
import { TopBar } from "@/components/topbar";
import { Footer } from "@/components/sections/footer";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);
  if (!project) return { title: "Projet introuvable" };
  return {
    title: `${project.title} — limperiam`,
    description: project.description,
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);
  if (!project) notFound();

  const html = project.content
    ? await marked.parse(project.content, { breaks: true, gfm: true })
    : null;
  const tech: string[] = Array.isArray(project.tech_stack)
    ? project.tech_stack
    : [];

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)] py-16 md:py-24">
        <Link
          href="/#work"
          className="text-[13px] text-ink-mute hover:text-ink"
        >
          ← Retour aux travaux
        </Link>

        <header className="mt-8 border-b border-line pb-8">
          <h1
            className="font-serif text-ink leading-[1.05] tracking-[-0.01em]"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            {project.title}
          </h1>
          <p className="mt-6 text-[17px] text-ink-soft max-w-2xl leading-[1.5]">
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
        </header>

        {html && (
          <article
            className="max-w-2xl mt-12 text-[16px] leading-[1.7]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}

        {(project.live_url || project.repo_url) && (
          <div className="mt-12 flex gap-4">
            {project.live_url && (
              <a
                href={project.live_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-ink text-cream px-6 py-3 text-[14px] font-medium hover:bg-accent-deep"
              >
                Voir le projet →
              </a>
            )}
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3 text-[14px] text-ink hover:border-ink"
              >
                Code source
              </a>
            )}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
