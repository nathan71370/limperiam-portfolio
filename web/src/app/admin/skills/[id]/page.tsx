import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import { ApiError } from "@/lib/api";
import { SkillEditForm } from "./skill-edit-form";
import type { components } from "@/lib/api-types";

type Skill = components["schemas"]["SkillOut"];

type Params = { params: Promise<{ id: string }> };

export default async function EditSkillPage({ params }: Params) {
  const { id } = await params;
  let skill: Skill;
  try {
    const list = await apiAdminGet<Skill[]>("/admin/skills");
    const found = list.find((s) => s.id === Number(id));
    if (!found) {
      notFound();
    }
    skill = found;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Topbar title={`Édition · ${skill.name}`} />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <SkillEditForm skill={skill} />
      </main>
    </>
  );
}
