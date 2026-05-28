"use client";

import { useState } from "react";
import { useReveal } from "./reveal";
import { useLangTheme } from "./lang-theme-provider";
import { WORK_META } from "@/content/work-meta";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

export function WorkItem({ item, idx }: { item: Project; idx: number }) {
  const { lang } = useLangTheme();
  const [ref, seen] = useReveal();
  const [open, setOpen] = useState(false);

  const meta = WORK_META[item.slug];
  const number = meta?.n ?? String(idx + 1).padStart(2, "0");
  const year = meta ? (lang === "fr" ? meta.year_fr : meta.year_en) : "";
  const client = meta?.client ?? "";
  const role = meta?.role ?? "";
  const stats = meta?.stats ?? [];
  const tags: string[] = Array.isArray(item.tech_stack) ? item.tech_stack : [];

  // Use editorial headline_pre/em/post when available (matches original artifact).
  // Fall back to the DB title (no italic emphasis) for projects not in WORK_META.
  const headlinePre = meta
    ? lang === "fr"
      ? meta.headline_pre_fr
      : meta.headline_pre_en
    : "";
  const headlineEm = meta
    ? lang === "fr"
      ? meta.headline_em_fr
      : meta.headline_em_en
    : "";
  const headlinePost = meta
    ? lang === "fr"
      ? (meta.headline_post_fr ?? "")
      : (meta.headline_post_en ?? "")
    : "";

  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      className={`work-item r-up ${seen ? "is-in" : ""} ${open ? "is-open" : ""}`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="num">{number}</div>
      <div className="meta-col">
        <span className="year">{year}</span>
        <span className="client">{client}</span>
        <span className="role">{role}</span>
      </div>
      <div className="body-col">
        <h3 className="ttl" style={{ margin: 0, fontWeight: 400 }}>
          {meta ? (
            <>
              {headlinePre}
              <span className="it">{headlineEm}</span>
              {headlinePost}
            </>
          ) : (
            item.title
          )}
        </h3>
        <p className="desc" style={{ margin: 0 }}>
          {item.description}
        </p>
        <div className="tags">
          {tags.map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className="arrow-cell">
        <span className="arrow-chip" aria-hidden="true">
          ↗
        </span>
      </div>
      {stats.length > 0 && (
        <div className="stats">
          {stats.map((s, i) => (
            <div className="stat" key={i}>
              <div className="v">{s.v}</div>
              <div className="l">{lang === "fr" ? s.l_fr : s.l_en}</div>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
