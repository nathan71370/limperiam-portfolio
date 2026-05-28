"use server";

import { z } from "zod";
import { apiPost, ApiError } from "@/lib/api";

const ContactSchema = z.object({
  name: z.string().min(2, "Nom requis").max(100),
  email: z.string().email("Email invalide"),
  subject: z.string().max(200).optional(),
  message: z
    .string()
    .min(10, "Message trop court")
    .max(5000, "Message trop long"),
  website: z.string().default(""), // honeypot
  elapsed_ms: z.coerce.number().int().min(0),
});

export type ContactState = {
  status: "idle" | "ok" | "error";
  fieldErrors?: Record<string, string[]>;
  error?: string;
};

export async function submitContact(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const raw = {
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject") || undefined,
    message: formData.get("message"),
    website: formData.get("website") || "",
    elapsed_ms: formData.get("elapsed_ms"),
  };

  const parsed = ContactSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await apiPost("/contact", parsed.data);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof ApiError && err.status === 429) {
      return {
        status: "error",
        error: "Trop de tentatives. Réessaie dans une minute.",
      };
    }
    return {
      status: "error",
      error: "Une erreur est survenue. Réessaie plus tard.",
    };
  }
}
