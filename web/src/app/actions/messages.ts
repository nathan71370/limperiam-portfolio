"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { apiAdminDelete, apiAdminPatch } from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Message = components["schemas"]["ContactMessageOut"];

export async function toggleReadAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const isRead = formData.get("is_read") === "true";
  if (!id) return;
  try {
    await apiAdminPatch<Message>(`/admin/messages/${id}`, { is_read: !isRead });
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function deleteMessageAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await apiAdminDelete(`/admin/messages/${id}`);
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}
