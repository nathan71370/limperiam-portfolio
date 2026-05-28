"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { apiAdminDelete, apiAdminPost, apiAdminPut } from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Experience = components["schemas"]["ExperienceOut"];

const ExperienceInput = z.object({
  company: z.string().min(1, "Entreprise requise").max(200),
  role: z.string().min(1, "Rôle requis").max(200),
  description: z.string().optional().nullable(),
  start_date: z.string().min(1, "Date de début requise"),
  end_date: z.string().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  display_order: z.coerce.number().int(),
});

function fromForm(formData: FormData) {
  const endDate = (formData.get("end_date") as string) || "";
  return {
    company: String(formData.get("company") || ""),
    role: String(formData.get("role") || ""),
    description: (formData.get("description") as string) || null,
    start_date: String(formData.get("start_date") || ""),
    end_date: endDate.length > 0 ? endDate : null,
    location: (formData.get("location") as string) || null,
    display_order: Number(formData.get("display_order") || 0),
  };
}

export type ExperienceFormState = {
  status: "idle" | "ok" | "error";
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createExperienceAction(
  _prev: ExperienceFormState,
  formData: FormData,
): Promise<ExperienceFormState> {
  const parsed = ExperienceInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const exp = await apiAdminPost<Experience>(
      "/admin/experiences",
      parsed.data,
    );
    revalidateTag("experiences", {});
    revalidatePath("/admin/experiences");
    redirect(`/admin/experiences/${exp.id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function updateExperienceAction(
  id: number,
  _prev: ExperienceFormState,
  formData: FormData,
): Promise<ExperienceFormState> {
  const parsed = ExperienceInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiAdminPut<Experience>(`/admin/experiences/${id}`, parsed.data);
    revalidateTag("experiences", {});
    revalidatePath("/admin/experiences");
    revalidatePath(`/admin/experiences/${id}`);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function deleteExperienceAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await apiAdminDelete(`/admin/experiences/${id}`);
    revalidateTag("experiences", {});
    revalidatePath("/admin/experiences");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}
