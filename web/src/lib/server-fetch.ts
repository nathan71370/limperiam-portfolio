import "server-only";
import { apiGet } from "@/lib/api";
import type { components } from "@/lib/api-types";

export type Project = components["schemas"]["ProjectOut"];
export type Experience = components["schemas"]["ExperienceOut"];
export type Skill = components["schemas"]["SkillOut"];

const REVALIDATE_SECONDS = 60; // ISR window

export async function fetchProjects(): Promise<Project[]> {
  return apiGet<Project[]>("/projects", {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["projects"] },
  });
}

export async function fetchProjectBySlug(slug: string): Promise<Project | null> {
  try {
    return await apiGet<Project>(`/projects/${slug}`, {
      next: { revalidate: REVALIDATE_SECONDS, tags: [`project:${slug}`] },
    });
  } catch (err) {
    // 404 → null, anything else re-throws
    if (
      typeof err === "object" &&
      err !== null &&
      "status" in err &&
      (err as { status: number }).status === 404
    ) {
      return null;
    }
    throw err;
  }
}

export async function fetchExperiences(): Promise<Experience[]> {
  return apiGet<Experience[]>("/experiences", {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["experiences"] },
  });
}

export async function fetchSkills(): Promise<Skill[]> {
  return apiGet<Skill[]>("/skills", {
    next: { revalidate: REVALIDATE_SECONDS, tags: ["skills"] },
  });
}
