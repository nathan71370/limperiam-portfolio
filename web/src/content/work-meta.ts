// Editorial chrome per project, lifted verbatim from the original artifact's
// `portfolio_content.js`. Keyed by project slug (must match the seed_portfolio.py
// slugs). The DB owns: slug, tech_stack, image, dates, title (incl. title_en),
// and description (incl. description_en). The chrome here covers fields that
// don't fit cleanly in the DB shape: numbered index, year label, client name,
// role descriptor, italic-emphasis split headline, and stats grid.

export type WorkStat = {
  v_fr: string;
  v_en: string;
  l_fr: string;
  l_en: string;
};

export type WorkMeta = {
  n: string;
  year_fr: string;
  year_en: string;
  client: string;
  role: string;
  headline_pre_fr: string;
  headline_em_fr: string;
  headline_post_fr?: string;
  headline_pre_en: string;
  headline_em_en: string;
  headline_post_en?: string;
  stats: WorkStat[];
};

export const WORK_META: Record<string, WorkMeta> = {
  "credit-agricole-ts": {
    n: "01",
    year_fr: "2023 — auj.",
    year_en: "2023 — now",
    client: "Crédit Agricole T&S",
    role: "Java Developer · Freelance",
    headline_pre_fr: "Fraude bancaire, ",
    headline_em_fr: "automatisée.",
    headline_pre_en: "Card fraud, ",
    headline_em_en: "automated.",
    stats: [
      { v_fr: "100%", v_en: "100%", l_fr: "remboursements automatisés", l_en: "automated refunds" },
      { v_fr: "30+", v_en: "30+", l_fr: "règles métier", l_en: "business rules" },
      { v_fr: "2 ans", v_en: "2 yrs", l_fr: "en mission", l_en: "on mission" },
    ],
  },
  "walky-doggy": {
    n: "02",
    year_fr: "Janv. 2026 — auj.",
    year_en: "Jan 2026 — now",
    client: "Walky Doggy",
    role: "iOS · Firebase · solo",
    headline_pre_fr: "Une app pour ",
    headline_em_fr: "promener,",
    headline_post_fr: " publiée.",
    headline_pre_en: "An app for ",
    headline_em_en: "dog walks,",
    headline_post_en: " shipped.",
    stats: [
      { v_fr: "1.0", v_en: "1.0", l_fr: "en production", l_en: "in production" },
      { v_fr: "iOS", v_en: "iOS", l_fr: "natif", l_en: "native" },
      { v_fr: "FR + EN", v_en: "FR + EN", l_fr: "App Store", l_en: "App Store" },
    ],
  },
  tennaxia: {
    n: "03",
    year_fr: "2022 — 2023",
    year_en: "2022 — 2023",
    client: "Tennaxia",
    role: "Fullstack Java / Vue.js",
    headline_pre_fr: "Suivi déchets, ",
    headline_em_fr: "refactoré.",
    headline_pre_en: "Waste tracking, ",
    headline_em_en: "refactored.",
    stats: [
      { v_fr: "15", v_en: "15", l_fr: "devs en équipe", l_en: "devs in team" },
      { v_fr: "1 an", v_en: "1 yr", l_fr: "en CDI", l_en: "permanent" },
    ],
  },
  cnaf: {
    n: "04",
    year_fr: "2021 — 2022",
    year_en: "2021 — 2022",
    client: "CNAF",
    role: "Java Developer",
    headline_pre_fr: "1M de lignes, ",
    headline_em_fr: "270 tables.",
    headline_pre_en: "1M lines, ",
    headline_em_en: "270 tables.",
    stats: [
      { v_fr: "1M+", v_en: "1M+", l_fr: "lignes de code", l_en: "lines of code" },
      { v_fr: "270", v_en: "270", l_fr: "tables", l_en: "tables" },
    ],
  },
  "marathon-perso": {
    n: "05",
    year_fr: "Juin 2026 — auj.",
    year_en: "Jun 2026 — now",
    client: "marathon (perso)",
    role: "SvelteKit · TypeScript · PWA",
    headline_pre_fr: "Plan d'entraînement, ",
    headline_em_fr: "comme une app.",
    headline_pre_en: "A training plan, ",
    headline_em_en: "as an app.",
    stats: [
      { v_fr: "25", v_en: "25", l_fr: "semaines de plan", l_en: "plan weeks" },
      { v_fr: "PWA", v_en: "PWA", l_fr: "iOS installable", l_en: "iOS installable" },
    ],
  },
};
