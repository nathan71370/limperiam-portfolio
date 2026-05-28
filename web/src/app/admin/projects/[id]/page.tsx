import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import { ApiError } from "@/lib/api";
import { ProjectEditForm } from "./project-edit-form";
import { ImageUpload } from "@/components/admin/image-upload";
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
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute mb-2">
              Image actuelle
            </p>
            {project.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={project.image_url}
                alt={project.title}
                className="rounded-xl border border-line max-h-72 object-cover"
              />
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-stage-2 px-6 py-12 text-center text-[13px] text-ink-mute">
                Aucune image
              </div>
            )}
          </div>
          <ImageUpload projectId={project.id} />
        </section>

        <ProjectEditForm project={project} />
      </main>
    </>
  );
}
