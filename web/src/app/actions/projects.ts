"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import {
  apiAdminDelete,
  apiAdminPost,
  apiAdminPut,
  apiAdminUpload,
} from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

const ProjectInput = z.object({
  slug: z
    .string()
    .min(1, "Slug requis")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "minuscules, chiffres et tirets uniquement"),
  title: z.string().min(1, "Titre requis").max(200),
  description: z.string().min(1, "Description requise"),
  content: z.string().optional().nullable(),
  tech_stack: z.array(z.string()),
  repo_url: z.string().url().optional().or(z.literal("")).nullable(),
  live_url: z.string().url().optional().or(z.literal("")).nullable(),
  display_order: z.coerce.number().int(),
  is_published: z.boolean(),
});

function fromForm(formData: FormData) {
  const techRaw = String(formData.get("tech_stack") || "");
  return {
    slug: String(formData.get("slug") || ""),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    content: (formData.get("content") as string) || null,
    tech_stack: techRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    repo_url: (formData.get("repo_url") as string) || null,
    live_url: (formData.get("live_url") as string) || null,
    display_order: Number(formData.get("display_order") || 0),
    is_published: formData.get("is_published") === "on",
  };
}

export type ProjectFormState = {
  status: "idle" | "ok" | "error";
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = ProjectInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const project = await apiAdminPost<Project>("/admin/projects", parsed.data);
    revalidateTag("projects", {});
    revalidatePath("/admin/projects");
    redirect(`/admin/projects/${project.id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { status: "error", error: "Ce slug existe déjà." };
    }
    if (err instanceof ApiError && err.status === 401) {
      redirect("/admin/login");
    }
    throw err;
  }
}

export async function updateProjectAction(
  id: number,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = ProjectInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await apiAdminPut<Project>(`/admin/projects/${id}`, parsed.data);
    revalidateTag("projects", {});
    revalidateTag(`project:${parsed.data.slug}`, {});
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${id}`);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { status: "error", error: "Ce slug existe déjà." };
    }
    if (err instanceof ApiError && err.status === 401) {
      redirect("/admin/login");
    }
    throw err;
  }
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await apiAdminDelete(`/admin/projects/${id}`);
    revalidateTag("projects", {});
    revalidatePath("/admin/projects");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/admin/login");
    }
    throw err;
  }
}

export async function uploadProjectImageAction(
  id: number,
  formData: FormData,
): Promise<{ status: "ok" | "error"; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", error: "Aucun fichier" };
  }
  try {
    await apiAdminUpload<Project>(`/admin/projects/${id}/image`, file);
    revalidateTag("projects", {});
    revalidatePath(`/admin/projects/${id}`);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) redirect("/admin/login");
      if (err.status === 413)
        return { status: "error", error: "Fichier trop volumineux (max 2 Mo)" };
      if (err.status === 400)
        return { status: "error", error: "Format d'image invalide" };
    }
    return { status: "error", error: "Échec de l'upload" };
  }
}
