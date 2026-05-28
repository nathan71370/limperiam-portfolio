import "server-only";
import { cookies } from "next/headers";
import type { Lang } from "@/content/i18n";

const LANG_COOKIE = "lang";
const THEME_COOKIE = "theme";
type Theme = "light" | "dark";

export async function getLang(): Promise<Lang> {
  const c = await cookies();
  const v = c.get(LANG_COOKIE)?.value;
  return v === "en" ? "en" : "fr";
}

export async function getTheme(): Promise<Theme> {
  const c = await cookies();
  const v = c.get(THEME_COOKIE)?.value;
  return v === "dark" ? "dark" : "light";
}

export { LANG_COOKIE, THEME_COOKIE };
export type { Theme };
