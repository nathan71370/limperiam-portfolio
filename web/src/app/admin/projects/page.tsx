import Link from "next/link";
import { Topbar } from "@/components/admin/topbar";
import { PrimaryButton } from "@/components/admin/primary-button";
import { DataTable } from "@/components/admin/data-table";
import { apiAdminGet } from "@/lib/api-admin";
import { deleteProjectAction } from "@/app/actions/projects";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

export default async function AdminProjectsPage() {
  const projects = await apiAdminGet<Project[]>("/admin/projects");

  return (
    <>
      <Topbar
        title="Projets"
        actions={
          <Link href="/admin/projects/new">
            <PrimaryButton type="button">+ Nouveau projet</PrimaryButton>
          </Link>
        }
      />
      <main className="flex-1 px-6 md:px-10 py-10">
        <DataTable
          rows={projects}
          empty="Aucun projet."
          columns={[
            {
              header: "Titre",
              cell: (p) => (
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="text-ink hover:text-accent font-medium"
                >
                  {p.title}
                </Link>
              ),
            },
            {
              header: "Slug",
              cell: (p) => (
                <code className="text-[12px] text-ink-mute">{p.slug}</code>
              ),
            },
            {
              header: "Statut",
              cell: (p) => (
                <span
                  className={
                    p.is_published
                      ? "rounded-full bg-sage/15 text-sage px-2.5 py-1 text-[11px] uppercase tracking-[1.5px]"
                      : "rounded-full bg-cream-deep text-ink-mute px-2.5 py-1 text-[11px] uppercase tracking-[1.5px]"
                  }
                >
                  {p.is_published ? "Publié" : "Brouillon"}
                </span>
              ),
            },
            {
              header: "Ordre",
              align: "right",
              cell: (p) => (
                <span className="tabular-nums text-ink-soft">
                  {p.display_order}
                </span>
              ),
              width: "80px",
            },
            {
              header: "",
              align: "right",
              width: "120px",
              cell: (p) => (
                <form action={deleteProjectAction} className="inline">
                  <input type="hidden" name="id" value={p.id} />
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
