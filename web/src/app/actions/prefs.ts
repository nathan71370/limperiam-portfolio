"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANG_COOKIE, THEME_COOKIE, type Theme } from "@/lib/prefs";
import type { Lang } from "@/content/i18n";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLangAction(lang: Lang): Promise<void> {
  const c = await cookies();
  c.set(LANG_COOKIE, lang, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  revalidatePath("/");
}

export async function setThemeAction(theme: Theme): Promise<void> {
  const c = await cookies();
  c.set(THEME_COOKIE, theme, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_YEAR,
  });
  revalidatePath("/");
}
