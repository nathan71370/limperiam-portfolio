import { notFound } from "next/navigation";
import Link from "next/link";
import { marked } from "marked";
import { fetchProjectBySlug } from "@/lib/server-fetch";
import { getLang } from "@/lib/prefs";
import { getDict } from "@/content/i18n";
import { TopBar } from "@/components/topbar";
import { Footer } from "@/components/sections/footer";

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params) {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);
  if (!project) return { title: "Projet introuvable" };
  const lang = await getLang();
  const title =
    lang === "en" ? (project.title_en ?? project.title) : project.title;
  const description =
    lang === "en"
      ? (project.description_en ?? project.description)
      : project.description;
  return {
    title: `${title} — limperiam`,
    description,
  };
}

export default async function ProjectPage({ params }: Params) {
  const { slug } = await params;
  const project = await fetchProjectBySlug(slug);
  if (!project) notFound();

  const lang = await getLang();
  const t = getDict(lang);
  const isEn = lang === "en";

  const title = isEn ? (project.title_en ?? project.title) : project.title;
  const description = isEn
    ? (project.description_en ?? project.description)
    : project.description;
  const content = isEn
    ? (project.content_en ?? project.content)
    : project.content;

  const html = content
    ? await marked.parse(content, { breaks: true, gfm: true })
    : null;
  const tech: string[] = Array.isArray(project.tech_stack)
    ? project.tech_stack
    : [];

  const backLabel = isEn ? "← Back to work" : "← Retour aux travaux";
  const viewLiveLabel = isEn ? "View live →" : "Voir le projet →";
  const repoLabel = isEn ? "Source code" : "Code source";

  return (
    <>
      <TopBar />
      <main className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)] py-16 md:py-24">
        <Link
          href="/#work"
          className="text-[13px] text-ink-mute hover:text-ink"
        >
          {backLabel}
        </Link>

        <header className="mt-8 border-b border-line pb-8">
          <h1
            className="font-serif text-ink leading-[1.05] tracking-[-0.01em]"
            style={{ fontSize: "clamp(40px, 6vw, 72px)" }}
          >
            {title}
          </h1>
          <p className="mt-6 text-[17px] text-ink-soft max-w-2xl leading-[1.5]">
            {description}
          </p>
          {tech.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {tech.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-cream-deep px-3 py-1 text-[12px] text-ink-soft"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </header>

        {project.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={project.image_url}
            alt={title}
            className="mt-12 rounded-xl border border-line w-full max-w-3xl object-cover"
          />
        )}

        {html && (
          <article
            className="max-w-2xl mt-12 text-[16px] leading-[1.7] prose-content"
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
                {viewLiveLabel}
              </a>
            )}
            {project.repo_url && (
              <a
                href={project.repo_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-card px-6 py-3 text-[14px] text-ink hover:border-ink"
              >
                {repoLabel}
              </a>
            )}
          </div>
        )}

        {/* hint for admin / curious visitors that ContactForm is bilingual */}
        {!html && !project.image_url && (
          <p className="mt-12 max-w-2xl text-[14px] text-ink-mute italic">
            {isEn
              ? "No long-form content for this project yet."
              : "Pas de contenu détaillé pour ce projet pour l'instant."}
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
