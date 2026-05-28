import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import { ApiError } from "@/lib/api";
import { ExperienceEditForm } from "./experience-edit-form";
import type { components } from "@/lib/api-types";

type Experience = components["schemas"]["ExperienceOut"];

type Params = { params: Promise<{ id: string }> };

export default async function EditExperiencePage({ params }: Params) {
  const { id } = await params;
  let experience: Experience;
  try {
    const list = await apiAdminGet<Experience[]>("/admin/experiences");
    const found = list.find((e) => e.id === Number(id));
    if (!found) {
      notFound();
    }
    experience = found;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Topbar title={`Édition · ${experience.company}`} />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <ExperienceEditForm experience={experience} />
      </main>
    </>
  );
}
