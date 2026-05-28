import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];
type Experience = components["schemas"]["ExperienceOut"];
type Skill = components["schemas"]["SkillOut"];
type Message = components["schemas"]["ContactMessageOut"];

async function getCounts() {
  const [projects, experiences, skills, messages] = await Promise.all([
    apiAdminGet<Project[]>("/admin/projects"),
    apiAdminGet<Experience[]>("/admin/experiences"),
    apiAdminGet<Skill[]>("/admin/skills"),
    apiAdminGet<Message[]>("/admin/messages"),
  ]);
  return {
    projectsTotal: projects.length,
    projectsDrafts: projects.filter((p) => !p.is_published).length,
    experiencesTotal: experiences.length,
    skillsTotal: skills.length,
    messagesTotal: messages.length,
    messagesUnread: messages.filter((m) => !m.is_read).length,
  };
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-line p-6 shadow-card">
      <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute">
        {label}
      </p>
      <p className="mt-3 font-serif text-ink text-[40px] leading-none tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-2 text-[12px] text-ink-soft">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const counts = await getCounts();

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl">
          <StatCard
            label="Projets"
            value={counts.projectsTotal}
            hint={
              counts.projectsDrafts > 0
                ? `${counts.projectsDrafts} brouillon${
                    counts.projectsDrafts > 1 ? "s" : ""
                  }`
                : "tous publiés"
            }
          />
          <StatCard label="Expériences" value={counts.experiencesTotal} />
          <StatCard label="Skills" value={counts.skillsTotal} />
          <StatCard
            label="Messages"
            value={counts.messagesTotal}
            hint={
              counts.messagesUnread > 0
                ? `${counts.messagesUnread} non lu${
                    counts.messagesUnread > 1 ? "s" : ""
                  }`
                : "tous lus"
            }
          />
        </div>
      </main>
    </>
  );
}
