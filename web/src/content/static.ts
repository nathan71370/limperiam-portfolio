// Lifted verbatim from the original artifact (FR locale).
// See docs/superpowers/portfolio_content.js for the source.

export const HERO = {
  kicker: "DÉVELOPPEUR FULLSTACK — ANGLEFORT / ANNECY",
  headlinePre: "Du code ",
  headlineEm: "propre,",
  headlinePost: " orienté",
  headlinePost2: "backend.",
  sub: "Nathan Mercier — freelance derrière Limperiam. Java, Spring, Python, SvelteKit, iOS. Banque, conformité, produits grand public.",
  ctaPrimary: { label: "Voir les travaux", href: "#work" },
  ctaSecondary: {
    label: "Écrire un mail",
    href: "mailto:nathanmercier@limperiam.com",
  },
  metaLeft: "DISPONIBLE — IMMÉDIATEMENT",
  metaRight: "BASÉ À ANGLEFORT · TÉLÉTRAVAIL",
  statusLabel: "Disponible pour de nouvelles missions",
} as const;

export const ABOUT = {
  kicker: "APPROCHE",
  headlinePre: "Backend ",
  headlineEm: "d'abord,",
  headlinePost: " interface ensuite.",
  lede: "Sept ans à écrire des règles métier dans des environnements denses — banque, déclaratif environnemental, prestation sociale. Quand un domaine est complexe, le code doit être lisible, le test doit raconter la règle, et l'automatisation doit rendre l'humain au métier.",
  pillars: [
    {
      k: "01",
      tPre: "Java, Spring, ",
      tEm: "TDD.",
      d: "Sept ans en production, dont trois en banque. À l'aise avec la régulation, le débit, et la dette technique qu'on ne réécrit pas du jour au lendemain.",
    },
    {
      k: "02",
      tPre: "Frontends ",
      tEm: "calmes.",
      d: "Vue, SvelteKit, React. Design systems suivis à la lettre. Pas de gras — la clarté est une feature.",
    },
    {
      k: "03",
      tPre: "Mobile ",
      tEm: "natif.",
      d: "iOS natif avec Firebase, déjà publiées sur l'App Store. Backend Python pour les pipelines maison.",
    },
  ],
} as const;

export const WORK_INTRO = {
  kicker: "TRAVAUX SÉLECTIONNÉS",
  headlinePre: "Cinq ans de ",
  headlineEm: "missions",
  headlinePost: " en production.",
  sub: "Du Crédit Agricole à un app store grand public — voici les terrains.",
} as const;

export const STACK_INTRO = {
  kicker: "STACK",
  headlinePre: "Outils ",
  headlineEm: "courants.",
  sub: "Sept ans à les utiliser en production, pas seulement à les essayer.",
} as const;

export const CONTACT = {
  kicker: "CONTACT",
  headlinePre: "Une mission, ",
  headlineEm: "une question ?",
  sub: "Je réponds en moins de 24 h les jours ouvrés.",
  email: "nathanmercier@limperiam.com",
  links: [
    {
      l: "LinkedIn",
      h: "https://www.linkedin.com/in/nathan-mercier-47280713a/",
    },
    { l: "GitHub", h: "https://github.com/nathan71370" },
    {
      l: "Walky Doggy",
      h: "https://apps.apple.com/fr/app/walky-doggy/id6759481327?l=en-GB",
    },
  ],
  copyLabel: "Copier",
  copiedLabel: "Copié",
} as const;

export const LEGAL = {
  kicker: "MENTIONS LÉGALES",
  headlinePre: "L'entreprise, ",
  headlineEm: "en clair.",
  sub: "Les informations publiques sont consultables sur l'Annuaire des Entreprises.",
  rows: [
    { l: "Raison sociale", v: "Limperiam" },
    { l: "SIREN", v: "980 716 781" },
    { l: "Dirigeant", v: "Nathan Mercier" },
    { l: "Siège social", v: "14 rue Bausset, 75015 Paris" },
    { l: "Activité", v: "Programmation informatique (62.01Z)" },
    { l: "Hébergement du site", v: "Auto-hébergé" },
  ],
  link: {
    l: "Voir sur annuaire-entreprises.data.gouv.fr",
    h: "https://annuaire-entreprises.data.gouv.fr/entreprise/limperiam-980716781",
  },
} as const;

export const FOOTER = {
  brand: "limperiam",
  tagline: "freelance fullstack — Anglefort",
  colophon: "Direction éditoriale & code · Nathan Mercier · 2026",
} as const;

export const NAV = {
  brand: "limperiam",
  items: [
    { l: "Approche", h: "#about" },
    { l: "Travaux", h: "#work" },
    { l: "Stack", h: "#stack" },
    { l: "Contact", h: "#contact" },
  ],
} as const;
