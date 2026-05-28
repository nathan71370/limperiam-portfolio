"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { COOKIE_NAME, extractAccessToken } from "@/lib/auth-cookie";

const LoginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

const API_BASE = process.env.API_URL || "http://api:8000";

export type LoginState = {
  status: "idle" | "error";
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return {
      status: "error",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(parsed.data),
      cache: "no-store",
    });
  } catch {
    return { status: "error", error: "Impossible de joindre l'API." };
  }

  if (res.status === 401) {
    return { status: "error", error: "Identifiants invalides." };
  }
  if (res.status === 429) {
    return { status: "error", error: "Trop de tentatives. Réessaie plus tard." };
  }
  if (!res.ok) {
    return { status: "error", error: `Erreur ${res.status}` };
  }

  const token = extractAccessToken(res.headers.get("set-cookie"));
  if (!token) {
    return { status: "error", error: "Cookie introuvable dans la réponse." };
  }

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h (match the API)
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redirect("/admin" as any);
}

export async function logoutAction(): Promise<void> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  // Best-effort: tell the API. If it fails, we still clear our cookie.
  if (token) {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: "POST",
        headers: { Cookie: `${COOKIE_NAME}=${token}` },
        cache: "no-store",
      });
    } catch {
      // ignore — we always clear locally below
    }
  }

  store.delete(COOKIE_NAME);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  redirect("/admin/login" as any);
}
