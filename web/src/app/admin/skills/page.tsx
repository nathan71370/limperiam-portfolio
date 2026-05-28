import Link from "next/link";
import { Topbar } from "@/components/admin/topbar";
import { PrimaryButton } from "@/components/admin/primary-button";
import { DataTable } from "@/components/admin/data-table";
import { apiAdminGet } from "@/lib/api-admin";
import { deleteSkillAction } from "@/app/actions/skills";
import type { components } from "@/lib/api-types";

type Skill = components["schemas"]["SkillOut"];

const CATEGORY_LABEL: Record<Skill["category"], string> = {
  backend: "Backend",
  frontend: "Frontend",
  devops: "DevOps",
  tools: "Outils",
  soft: "Pratique",
};

export default async function AdminSkillsPage() {
  const skills = await apiAdminGet<Skill[]>("/admin/skills");

  return (
    <>
      <Topbar
        title="Skills"
        actions={
          <Link href="/admin/skills/new">
            <PrimaryButton type="button">+ Nouveau skill</PrimaryButton>
          </Link>
        }
      />
      <main className="flex-1 px-6 md:px-10 py-10">
        <DataTable
          rows={skills}
          empty="Aucun skill."
          columns={[
            {
              header: "Nom",
              cell: (s) => (
                <Link
                  href={`/admin/skills/${s.id}`}
                  className="text-ink hover:text-accent font-medium"
                >
                  {s.name}
                </Link>
              ),
            },
            {
              header: "Catégorie",
              cell: (s) => (
                <span className="text-ink-soft text-[12px]">
                  {CATEGORY_LABEL[s.category]}
                </span>
              ),
            },
            {
              header: "Featured",
              align: "center",
              cell: (s) =>
                s.is_featured ? (
                  <span className="text-sage text-[12px]">✓</span>
                ) : (
                  <span className="text-ink-mute text-[12px]">—</span>
                ),
              width: "100px",
            },
            {
              header: "Ordre",
              align: "right",
              cell: (s) => (
                <span className="tabular-nums text-ink-soft">
                  {s.display_order}
                </span>
              ),
              width: "80px",
            },
            {
              header: "",
              align: "right",
              width: "120px",
              cell: (s) => (
                <form action={deleteSkillAction} className="inline">
                  <input type="hidden" name="id" value={s.id} />
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
