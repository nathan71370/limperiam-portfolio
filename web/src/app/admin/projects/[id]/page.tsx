import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import { ApiError } from "@/lib/api";
import { ProjectEditForm } from "./project-edit-form";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

type Params = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Params) {
  const { id } = await params;
  let project: Project;
  try {
    const list = await apiAdminGet<Project[]>("/admin/projects");
    const found = list.find((p) => p.id === Number(id));
    if (!found) {
      notFound();
    }
    project = found;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Topbar title={`Édition · ${project.title}`} />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        {project.image_url && (
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute mb-2">
              Image actuelle
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={project.image_url}
              alt={project.title}
              className="rounded-xl border border-line max-h-72 object-cover"
            />
          </div>
        )}
        <ProjectEditForm project={project} />
      </main>
    </>
  );
}
