"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { apiAdminDelete, apiAdminPost, apiAdminPut } from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Skill = components["schemas"]["SkillOut"];

const SkillInput = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  category: z.enum(["frontend", "backend", "devops", "tools", "soft"]),
  level: z.coerce.number().int().min(1).max(5).optional().nullable(),
  icon: z.string().optional().nullable(),
  display_order: z.coerce.number().int(),
  is_featured: z.boolean(),
});

function fromForm(formData: FormData) {
  const levelRaw = formData.get("level") as string | null;
  return {
    name: String(formData.get("name") || ""),
    category: String(
      formData.get("category") || "backend",
    ) as Skill["category"],
    level: levelRaw && levelRaw.length > 0 ? Number(levelRaw) : null,
    icon: (formData.get("icon") as string) || null,
    display_order: Number(formData.get("display_order") || 0),
    is_featured: formData.get("is_featured") === "on",
  };
}

export type SkillFormState = {
  status: "idle" | "ok" | "error";
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createSkillAction(
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const parsed = SkillInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const skill = await apiAdminPost<Skill>("/admin/skills", parsed.data);
    revalidateTag("skills", {});
    revalidatePath("/admin/skills");
    redirect(`/admin/skills/${skill.id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function updateSkillAction(
  id: number,
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const parsed = SkillInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiAdminPut<Skill>(`/admin/skills/${id}`, parsed.data);
    revalidateTag("skills", {});
    revalidatePath("/admin/skills");
    revalidatePath(`/admin/skills/${id}`);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function deleteSkillAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await apiAdminDelete(`/admin/skills/${id}`);
    revalidateTag("skills", {});
    revalidatePath("/admin/skills");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}
