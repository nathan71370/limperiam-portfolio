import { Topbar } from "@/components/admin/topbar";
import { PrimaryButton } from "@/components/admin/primary-button";
import { DataTable } from "@/components/admin/data-table";
import { apiAdminGet } from "@/lib/api-admin";
import { deleteExperienceAction } from "@/app/actions/experiences";
import type { components } from "@/lib/api-types";

type Experience = components["schemas"]["ExperienceOut"];

function formatRange(start: string, end: string | null | undefined): string {
  const startStr = new Date(start).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
  });
  if (!end) return `${startStr} — auj.`;
  const endStr = new Date(end).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
  });
  return `${startStr} — ${endStr}`;
}

export default async function AdminExperiencesPage() {
  const experiences = await apiAdminGet<Experience[]>("/admin/experiences");

  return (
    <>
      <Topbar
        title="Expériences"
        actions={
          <a href="/admin/experiences/new">
            <PrimaryButton type="button">+ Nouvelle expérience</PrimaryButton>
          </a>
        }
      />
      <main className="flex-1 px-6 md:px-10 py-10">
        <DataTable
          rows={experiences}
          empty="Aucune expérience."
          columns={[
            {
              header: "Entreprise",
              cell: (e) => (
                <a
                  href={`/admin/experiences/${e.id}`}
                  className="text-ink hover:text-accent font-medium"
                >
                  {e.company}
                </a>
              ),
            },
            {
              header: "Rôle",
              cell: (e) => <span className="text-ink-soft">{e.role}</span>,
            },
            {
              header: "Période",
              cell: (e) => (
                <span className="text-[12px] text-ink-mute">
                  {formatRange(e.start_date, e.end_date)}
                </span>
              ),
            },
            {
              header: "",
              align: "right",
              width: "120px",
              cell: (e) => (
                <form action={deleteExperienceAction} className="inline">
                  <input type="hidden" name="id" value={e.id} />
                  <button
                    type="submit"
                    className="text-[12px] text-ink-mute hover:text-accent underline-offset-4 hover:underline"
                  >
                    Supprimer
                  </button>
                </form>
              ),
            },
          ]}
        />
      </main>
    </>
  );
}
