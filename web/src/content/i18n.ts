export type Lang = "fr" | "en";

export type I18nDict = {
  locale: Lang;
  brand: string;
  nav: { about: string; work: string; stack: string; contact: string };
  hero: {
    kicker: string;
    headline_pre: string;
    headline_em: string;
    headline_post: string;
    headline_post2: string;
    sub: string;
    cta_primary: string;
    cta_secondary: string;
    meta_left: string;
    meta_right: string;
    status_label: string;
  };
  about: {
    kicker: string;
    headline_pre: string;
    headline_em: string;
    headline_post: string;
    lede: string;
    pillars: Array<{ k: string; t_pre: string; t_em: string; d: string }>;
  };
  work: {
    kicker: string;
    headline_pre: string;
    headline_em: string;
    headline_post: string;
    sub: string;
  };
  stack: {
    kicker: string;
    headline_pre: string;
    headline_em: string;
    sub: string;
  };
  contact: {
    kicker: string;
    headline_pre: string;
    headline_em: string;
    sub: string;
    email: string;
    links: Array<{ l: string; h: string }>;
    copy_label: string;
    copied_label: string;
  };
  legal: {
    kicker: string;
    headline_pre: string;
    headline_em: string;
    sub: string;
    rows: Array<{ l: string; v: string }>;
    link: { l: string; h: string };
  };
  footer: { brand: string; tagline: string; colophon: string };
};

export const FR: I18nDict = {
  locale: "fr",
  brand: "limperiam",
  nav: {
    about: "Approche",
    work: "Travaux",
    stack: "Stack",
    contact: "Contact",
  },
  hero: {
    kicker: "DÉVELOPPEUR FULLSTACK — ANGLEFORT / ANNECY",
    headline_pre: "Du code ",
    headline_em: "propre,",
    headline_post: " orienté",
    headline_post2: "backend.",
    sub: "Nathan Mercier — freelance derrière Limperiam. Java, Spring, Python, SvelteKit, iOS. Banque, conformité, produits grand public.",
    cta_primary: "Voir les travaux",
    cta_secondary: "Écrire un mail",
    meta_left: "DISPONIBLE — IMMÉDIATEMENT",
    meta_right: "BASÉ À ANGLEFORT · TÉLÉTRAVAIL",
    status_label: "Disponible pour de nouvelles missions",
  },
  about: {
    kicker: "APPROCHE",
    headline_pre: "Backend ",
    headline_em: "d'abord,",
    headline_post: " interface ensuite.",
    lede: "Sept ans à écrire des règles métier dans des environnements denses — banque, déclaratif environnemental, prestation sociale. Quand un domaine est complexe, le code doit être lisible, le test doit raconter la règle, et l'automatisation doit rendre l'humain au métier.",
    pillars: [
      {
        k: "01",
        t_pre: "Java, Spring, ",
        t_em: "TDD.",
        d: "Sept années de production, dont trois en banque. À l'aise avec les contraintes réglementaires, les volumes, et la dette technique qu'on ne peut pas réécrire.",
      },
      {
        k: "02",
        t_pre: "Frontends ",
        t_em: "sobres.",
        d: "Vue, SvelteKit, React. Un design system suivi à la lettre. Pas de fioritures — la clarté est une fonctionnalité.",
      },
      {
        k: "03",
        t_pre: "Apps ",
        t_em: "mobiles.",
        d: "iOS natif avec Firebase, déjà publiées sur l'App Store. Backend Python pour les pipelines maison.",
      },
    ],
  },
  work: {
    kicker: "TRAVAUX SÉLECTIONNÉS",
    headline_pre: "Cinq ans de ",
    headline_em: "missions",
    headline_post: " en production.",
    sub: "Du Crédit Agricole à un app store grand public — voici les terrains.",
  },
  stack: {
    kicker: "STACK",
    headline_pre: "Outils ",
    headline_em: "courants.",
    sub: "Sept ans à les utiliser en production, pas seulement à les essayer.",
  },
  contact: {
    kicker: "CONTACT",
    headline_pre: "Une mission, ",
    headline_em: "une question ?",
    sub: "Je réponds en moins de 24 h les jours ouvrés.",
    email: "nathanmercier@limperiam.com",
    links: [
      { l: "LinkedIn", h: "https://www.linkedin.com/in/nathan-mercier-47280713a/" },
      { l: "GitHub", h: "https://github.com/nathan71370" },
      { l: "Walky Doggy", h: "https://apps.apple.com/fr/app/walky-doggy/id6759481327?l=en-GB" },
    ],
    copy_label: "Copier",
    copied_label: "Copié",
  },
  legal: {
    kicker: "MENTIONS LÉGALES",
    headline_pre: "L'entreprise, ",
    headline_em: "en clair.",
    sub: "Les informations publiques sont consultables sur l'Annuaire des Entreprises.",
    rows: [
      { l: "Raison sociale", v: "Limperiam" },
      { l: "SIREN", v: "980 716 781" },
      { l: "Dirigeant", v: "Nathan Mercier" },
      { l: "Siège social", v: "14 rue Bausset, 75015 Paris" },
      { l: "Activité", v: "Programmation informatique (62.01Z)" },
      { l: "Hébergement du site", v: "Statique — fichier autonome" },
    ],
    link: { l: "Voir sur annuaire-entreprises.data.gouv.fr", h: "https://annuaire-entreprises.data.gouv.fr/entreprise/limperiam-980716781" },
  },
  footer: {
    brand: "limperiam",
    tagline: "freelance fullstack — Anglefort",
    colophon: "Direction éditoriale & code · Nathan Mercier · 2026",
  },
};

export const EN: I18nDict = {
  locale: "en",
  brand: "limperiam",
  nav: {
    about: "Approach",
    work: "Work",
    stack: "Stack",
    contact: "Contact",
  },
  hero: {
    kicker: "FULLSTACK DEVELOPER — ANGLEFORT / ANNECY AREA",
    headline_pre: "Clean ",
    headline_em: "code,",
    headline_post: " backend",
    headline_post2: "first.",
    sub: "Nathan Mercier — freelance under Limperiam. Java, Spring, Python, SvelteKit, iOS. Banking, compliance, consumer apps.",
    cta_primary: "See work",
    cta_secondary: "Write an email",
    meta_left: "AVAILABLE — IMMEDIATELY",
    meta_right: "BASED IN ANGLEFORT · REMOTE",
    status_label: "Available for new engagements",
  },
  about: {
    kicker: "APPROACH",
    headline_pre: "Backend ",
    headline_em: "first,",
    headline_post: " interface next.",
    lede: "Seven years writing business rules in dense domains — banking, environmental reporting, social benefits. When a domain is complex, the code must read, the test must tell the rule, and automation must hand work back to the people who own it.",
    pillars: [
      {
        k: "01",
        t_pre: "Java, Spring, ",
        t_em: "TDD.",
        d: "Seven years in production, three of them in banking. Comfortable with regulation, throughput, and the technical debt you can't just rewrite.",
      },
      {
        k: "02",
        t_pre: "Quiet ",
        t_em: "frontends.",
        d: "Vue, SvelteKit, React. Design systems followed to the letter. No fluff — clarity is a feature.",
      },
      {
        k: "03",
        t_pre: "Mobile ",
        t_em: "apps.",
        d: "Native iOS with Firebase, already on the App Store. Python on the backend for the in-house pipelines.",
      },
    ],
  },
  work: {
    kicker: "SELECTED WORK",
    headline_pre: "Five years of ",
    headline_em: "engagements",
    headline_post: " in production.",
    sub: "From Crédit Agricole to a consumer app store — here's the ground.",
  },
  stack: {
    kicker: "STACK",
    headline_pre: "Daily ",
    headline_em: "tools.",
    sub: "Seven years using them in production, not just trying them out.",
  },
  contact: {
    kicker: "CONTACT",
    headline_pre: "A mission, ",
    headline_em: "a question?",
    sub: "I reply within 24 h on business days.",
    email: "nathanmercier@limperiam.com",
    links: [
      { l: "LinkedIn", h: "https://www.linkedin.com/in/nathan-mercier-47280713a/" },
      { l: "GitHub", h: "https://github.com/nathan71370" },
      { l: "Walky Doggy", h: "https://apps.apple.com/fr/app/walky-doggy/id6759481327?l=en-GB" },
    ],
    copy_label: "Copy",
    copied_label: "Copied",
  },
  legal: {
    kicker: "LEGAL",
    headline_pre: "The company, ",
    headline_em: "on record.",
    sub: "Public records are available on the French business directory.",
    rows: [
      { l: "Legal name", v: "Limperiam" },
      { l: "SIREN", v: "980 716 781" },
      { l: "Director", v: "Nathan Mercier" },
      { l: "Registered office", v: "14 rue Bausset, 75015 Paris" },
      { l: "Activity", v: "Computer programming (62.01Z)" },
      { l: "Hosting", v: "Static — self-contained file" },
    ],
    link: { l: "View on annuaire-entreprises.data.gouv.fr", h: "https://annuaire-entreprises.data.gouv.fr/entreprise/limperiam-980716781" },
  },
  footer: {
    brand: "limperiam",
    tagline: "freelance fullstack — Anglefort",
    colophon: "Editorial direction & code · Nathan Mercier · 2026",
  },
};

export const I18N: Record<Lang, I18nDict> = { fr: FR, en: EN };

export function getDict(lang: Lang): I18nDict {
  return I18N[lang];
}
