# Portfolio Rebuild — Plan 4: Visual Fidelity Rebuild

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the simplified public-site components from Plan 2 with verbatim ports of the original Claude artifact's CSS and React components — yielding 1:1 visual fidelity (custom cursor, scroll progress bar, status dot tooltip, centered nav, FR/EN toggle, dark mode, hero italics + word reveal, work cards with stats/tags, stack marquee). Keep the data flow (server-fetched from API) and the admin section (Plan 3) intact.

**Architecture:** Port the original CSS file (1316 lines) verbatim into `globals.css` (keeping a small `@theme` block for admin Tailwind utilities). Port each React component from `portfolio_react_app.js` into a TSX equivalent that matches the original DOM/className structure exactly. Add cookie-backed state for `theme` (light/dark) and `lang` (fr/en) with a React Context for client-side instant updates. Bilingual UI strings come from `portfolio_content.js`; dynamic DB content stays FR-only for MVP.

**Tech Stack:** Same as Plan 2 (Next.js 16 App Router, React 19, TypeScript 5) — no new deps.

**Spec:** [2026-05-27-portfolio-rebuild-design.md](../specs/2026-05-27-portfolio-rebuild-design.md). Original artifact references:
- `docs/superpowers/portfolio_template.html` — full HTML with all 1316 lines of CSS in a `<style>` block
- `docs/superpowers/portfolio_react_app.js` — 14 React functions (629 lines)
- `docs/superpowers/portfolio_content.js` — bilingual FR/EN content as JS object

**Depends on:** Plans 1, 2, 3 (tagged `v0.3.0-admin`).

**Out of scope:**
- Translating dynamic DB content (projects/experiences) to EN — these stay FR. The admin can add EN translations in a future plan if needed.
- Adding new features (live preview, comments, etc.).
- The admin section (`/admin/*`) is **untouched** by this plan — it keeps its current design.

---

## Approach: verbatim port, not reimplementation

This plan's tasks are **mechanical copy operations**, not creative reimplementation. Every component's DOM structure, every className, every CSS rule comes from the original artifact. The only changes are:

1. Convert `function Foo({ t })` (where `t` is the locale-resolved content blob) to `function Foo({ t }: { t: I18nDict })` with TS types.
2. Replace `t.work.items.map(...)` with server-fetched data where applicable. Static content (hero kicker, about pillars, legal rows, footer, contact aux) still comes from `t` since it's never been in the DB.
3. Add `"use client"` to components using state/effects (CustomCursor, ScrollProgress, WordReveal, TopBar's scrolled state, LangThemeToggles).
4. The App-level `useTweaks` hook from the original is replaced by simple Context (theme/lang persisted in cookies).

When porting, use the original source as the source of truth. If a class name or attribute differs from the original, you've made a mistake.

---

## File structure

```
web/
├── src/
│   ├── app/
│   │   ├── globals.css                 # REPLACE entirely with verbatim port + small @theme for admin
│   │   ├── layout.tsx                  # MODIFY: read theme/lang cookies, render html with data-theme + lang
│   │   ├── page.tsx                    # MODIFY: compose new sections in new order
│   │   ├── (public)/                   # NOT created — same routing as before
│   │   ├── admin/                      # UNTOUCHED
│   │   └── actions/
│   │       └── prefs.ts                # NEW: setTheme/setLang server actions
│   ├── components/
│   │   ├── topbar.tsx                  # REPLACE nav.tsx — full topbar (brand+status+nav+controls)
│   │   ├── status-dot.tsx              # REPLACE — proper tooltip version
│   │   ├── custom-cursor.tsx           # NEW
│   │   ├── scroll-progress.tsx         # NEW
│   │   ├── magnetic.tsx                # NEW — useMagnetic hook component
│   │   ├── reveal.tsx                  # REPLACE — match original's behavior
│   │   ├── word-reveal.tsx             # NEW
│   │   ├── lang-theme-provider.tsx     # NEW — context for client-side instant switches
│   │   ├── lang-toggle.tsx             # NEW
│   │   ├── theme-toggle.tsx            # NEW
│   │   ├── contact-form.tsx            # KEEP (Plan 2 fix applied)
│   │   └── sections/
│   │       ├── hero.tsx                # REPLACE — verbatim port
│   │       ├── about.tsx               # REPLACE
│   │       ├── work.tsx                # REPLACE — server-fetched data into original card structure
│   │       ├── stack.tsx               # REPLACE — server-fetched data + marquee
│   │       ├── contact.tsx             # REPLACE — original layout but keep ContactForm
│   │       ├── legal.tsx               # REPLACE
│   │       └── footer.tsx              # REPLACE
│   ├── content/
│   │   ├── i18n.ts                     # NEW — bilingual UI strings (lifted from portfolio_content.js)
│   │   └── static.ts                   # DELETE — replaced by i18n.ts
│   └── lib/
│       ├── prefs.ts                    # NEW — read theme/lang cookies on server
│       └── ... (existing files untouched)
```

**Component count:** ~12 new/replaced files + globals.css + layout.tsx + page.tsx.

---

## Phase 0 — Foundations: CSS + i18n + prefs

### Task 1: Port the full CSS verbatim

**Files:**
- Replace: `web/src/app/globals.css`

The original CSS lives in `docs/superpowers/portfolio_template.html` between `<style>` and `</style>` tags. We copy all 1316 lines verbatim, with three adaptations:

- **Drop the `@font-face` blocks** (lines 1-272 of the style block) — they use UUID URLs from the original bundle. We already self-host Instrument Serif via `/public/fonts/` in Task 3 of Plan 2. Keep the `@font-face` declarations we already have at the top of `globals.css`.
- **Prepend `@import "tailwindcss"`** so the admin section keeps its Tailwind utilities.
- **Wrap the original `:root {...}` token block in a `@theme {...}` block** (Tailwind v4 syntax) so utilities like `bg-cream`, `text-ink`, `text-accent` continue to work in the admin. Keep ALSO a plain `:root` with the same tokens so the public-site CSS rules that reference `var(--cream)` etc. still resolve.
- Inside Tailwind's `@theme`, rename token keys to Tailwind's `--color-foo` convention. Outside `@theme`, keep the original `--cream`, `--ink`, etc. names since the ported CSS rules reference those.

- [ ] **Step 1: Extract the original CSS body**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
# Pull just the contents of the <style>...</style> block from the template
awk '/<style>/{flag=1; next} /<\/style>/{flag=0} flag' docs/superpowers/portfolio_template.html > /tmp/original-css-body.css
wc -l /tmp/original-css-body.css
```

Expected: ~1314 lines.

- [ ] **Step 2: Identify the section boundaries**

```bash
grep -nE "^/\*" /tmp/original-css-body.css | head -40
```

You should see comment-section headers like `/* Base */`, `/* ── Top bar ── */`, `/* ── Hero ── */`, etc. The `@font-face` blocks are lines 1-272 (visible as `/* latin */`, `/* latin-ext */`, etc.). Everything from line 273 onwards is the actual design system.

- [ ] **Step 3: Build the new globals.css**

Read the current `web/src/app/globals.css` (Plan 2's version) to extract our existing `@font-face` blocks for Instrument Serif (they point to `/fonts/...`).

Then construct the new `globals.css` with this exact top-of-file structure:

```css
@import "tailwindcss";

/* Self-hosted Instrument Serif (kept from Plan 2 — paths are /fonts/...) */
@font-face {
  font-family: "Instrument Serif";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/InstrumentSerif-Regular.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "Instrument Serif";
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url("/fonts/InstrumentSerif-Italic.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA,
    U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193,
    U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Tailwind theme tokens (kept for admin utilities like bg-cream, text-ink). */
@theme {
  --color-cream: #f7f5f0;
  --color-cream-deep: #efeae0;
  --color-card: #ffffff;
  --color-line: #e5ddd0;
  --color-ink: #1a1614;
  --color-ink-soft: #4a4340;
  --color-ink-mute: #8a8076;
  --color-accent: #d85b3d;
  --color-accent-deep: #b84527;
  --color-sage: #6b8e65;
  --color-stage-2: #f1ece1;

  --font-serif: "Instrument Serif", Georgia, "Times New Roman", serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI",
    sans-serif;

  --radius-sm: 8px;
  --radius: 16px;
  --radius-lg: 22px;
  --radius-pill: 999px;

  --shadow-card: 0 1px 2px rgba(26, 22, 20, 0.04),
    0 4px 16px rgba(26, 22, 20, 0.05);
  --shadow-pop: 0 2px 4px rgba(26, 22, 20, 0.06),
    0 12px 32px rgba(26, 22, 20, 0.1);
}

```

Then **append** the contents of `/tmp/original-css-body.css` from line **273 onwards** (skip the `@font-face` blocks at the top — we already have ours). Use `sed` to extract:

```bash
sed -n '273,$p' /tmp/original-css-body.css > /tmp/css-rules.css
wc -l /tmp/css-rules.css
```

Expected: ~1041 lines of CSS rules.

Concatenate those to the end of the new globals.css. The resulting file should be ~1100 lines.

- [ ] **Step 4: Verify build succeeds**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: build succeeds. There may be Tailwind warnings about unknown CSS classes from the admin code (since Tailwind v4 parses everything) — those should not be errors. If build fails with a CSS syntax error, the most likely cause is the `@theme` braces being malformed or the original CSS having a `:root {...}` that conflicts.

If you see "duplicate `:root` rules" complaints, that's fine — both `:root` blocks are legal CSS. If Tailwind complains, you may need to wrap the design tokens portion of the original CSS (the `:root {...}` block near the top of the ported CSS) in a comment to disable it, because the values are already in `@theme`. The PORTED `:root` block defines variables that the public-site CSS rules consume — keep them as plain CSS variables.

- [ ] **Step 5: Visual smoke check**

Restart docker compose (the web container needs a rebuild):

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
docker compose up -d --build web
sleep 8
curl -s http://localhost:3000 | head -c 800
```

You should see the HTML rendering — but the page will look broken since we haven't ported the component DOM/classes yet (they still match Plan 2's structure). That's expected.

- [ ] **Step 6: Commit**

```bash
git add web/src/app/globals.css
git commit -m "feat(web): port Marathon Design System CSS verbatim from original artifact"
```

---

### Task 2: Bilingual content extraction

**Files:**
- Create: `web/src/content/i18n.ts`
- Delete: `web/src/content/static.ts`

The original `docs/superpowers/portfolio_content.js` exports `window.PORTFOLIO_CONTENT = { fr: {...}, en: {...} }`. We lift this into a typed TS module that components import.

The dynamic content (projects/experiences/skills coming from DB) is NOT in this module — the `t.work.items`-equivalent will be replaced by a server-fetched array in the Work component itself. Everything else (hero/about/contact aux/legal/footer/nav) stays bilingual here.

- [ ] **Step 1: Create i18n module**

Read `docs/superpowers/portfolio_content.js` and convert the FR and EN branches into TypeScript. The keys we need are:

For each lang (`fr` and `en`), expose:
- `locale: "fr" | "en"`
- `brand: string`
- `nav: { about, work, stack, contact }`
- `hero: { kicker, headline_pre, headline_em, headline_post, headline_post2, sub, cta_primary, cta_secondary, meta_left, meta_right, status_label }`
- `about: { kicker, headline_pre, headline_em, headline_post, lede, pillars: Array<{k, t_pre, t_em, d}> }`
- `work: { kicker, headline_pre, headline_em, headline_post, sub }` (just the chrome — items come from API)
- `stack: { kicker, headline_pre, headline_em, sub }`
- `contact: { kicker, headline_pre, headline_em, sub, email, links: Array<{l, h}>, copy_label, copied_label }`
- `legal: { kicker, headline_pre, headline_em, sub, rows: Array<{l, v}>, link: {l, h} }`
- `footer: { brand, tagline, colophon }`

Create `web/src/content/i18n.ts` with this structure. Paste the FR and EN content **verbatim** from `portfolio_content.js`. Add a type:

```typescript
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
  // ... paste entire fr branch from portfolio_content.js
};

export const EN: I18nDict = {
  locale: "en",
  // ... paste entire en branch from portfolio_content.js
};

export const I18N: Record<Lang, I18nDict> = { fr: FR, en: EN };

export function getDict(lang: Lang): I18nDict {
  return I18N[lang];
}
```

The full FR and EN content is in `docs/superpowers/portfolio_content.js` between approximately lines 4–168 (FR) and lines 169–340 (EN). Paste each verbatim into the corresponding object.

- [ ] **Step 2: Type-check**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npx tsc --noEmit 2>&1 | head -10
```

Expected: no errors related to i18n.ts. There WILL be errors elsewhere (components still importing from `static.ts`) — ignore those for now; they're fixed in subsequent tasks.

- [ ] **Step 3: Delete the old static module**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
rm web/src/content/static.ts
```

This will break many components — they'll be rewritten in subsequent tasks. Don't commit yet.

- [ ] **Step 4: Commit**

```bash
git add web/src/content/i18n.ts
git rm web/src/content/static.ts
git commit -m "feat(web): replace static.ts with bilingual i18n.ts (FR + EN)"
```

Note: builds will fail for now since downstream components reference the removed `static.ts`. That's expected — they're replaced in later tasks. The commit captures the i18n module on its own.

---

### Task 3: Cookie-backed prefs (theme + lang)

**Files:**
- Create: `web/src/lib/prefs.ts`
- Create: `web/src/app/actions/prefs.ts`

- [ ] **Step 1: Server-side reader**

Create `web/src/lib/prefs.ts`:
```typescript
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
```

- [ ] **Step 2: Server actions to update**

Create `web/src/app/actions/prefs.ts`:
```typescript
"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { LANG_COOKIE, THEME_COOKIE, type Theme } from "@/lib/prefs";
import type { Lang } from "@/content/i18n";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLangAction(lang: Lang): Promise<void> {
  const c = await cookies();
  c.set(LANG_COOKIE, lang, {
    httpOnly: false, // readable client-side so the provider can sync
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
```

- [ ] **Step 3: Commit**

```bash
git add web/src/lib/prefs.ts web/src/app/actions/prefs.ts
git commit -m "feat(web): cookie-backed theme + lang prefs with server actions"
```

---

### Task 4: Lang/Theme provider (client context for instant UI)

**Files:**
- Create: `web/src/components/lang-theme-provider.tsx`

The cookies are written by Server Actions, which triggers a server revalidation (slower). For instant UI feedback when the user toggles, we also keep a React Context that updates immediately client-side. The Provider reads the initial values from props (set by the server layout from cookies) so SSR matches client.

- [ ] **Step 1: Provider**

Create `web/src/components/lang-theme-provider.tsx`:
```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { setLangAction, setThemeAction } from "@/app/actions/prefs";
import type { Lang } from "@/content/i18n";

type Theme = "light" | "dark";

type Ctx = {
  lang: Lang;
  theme: Theme;
  setLang: (v: Lang) => void;
  setTheme: (v: Theme) => void;
};

const LangThemeContext = createContext<Ctx | null>(null);

export function LangThemeProvider({
  initialLang,
  initialTheme,
  children,
}: {
  initialLang: Lang;
  initialTheme: Theme;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  // Mirror to <html data-theme=... lang=...> for instant CSS updates
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setLang = (v: Lang) => {
    setLangState(v);
    // Fire-and-forget — server action persists to cookie
    void setLangAction(v);
  };
  const setTheme = (v: Theme) => {
    setThemeState(v);
    void setThemeAction(v);
  };

  return (
    <LangThemeContext.Provider value={{ lang, theme, setLang, setTheme }}>
      {children}
    </LangThemeContext.Provider>
  );
}

export function useLangTheme(): Ctx {
  const ctx = useContext(LangThemeContext);
  if (!ctx) throw new Error("useLangTheme must be used inside LangThemeProvider");
  return ctx;
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/lang-theme-provider.tsx
git commit -m "feat(web): add LangThemeProvider with instant client-side updates"
```

---

### Task 5: Update root layout to wire prefs + html attributes

**Files:**
- Modify: `web/src/app/layout.tsx`

- [ ] **Step 1: Replace layout**

REPLACE `web/src/app/layout.tsx`:
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { getLang, getTheme } from "@/lib/prefs";
import { LangThemeProvider } from "@/components/lang-theme-provider";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "limperiam — Nathan Mercier · Fullstack Developer",
  description:
    "Nathan Mercier — freelance fullstack developer (backend-oriented). Java, Spring, Python, SvelteKit, iOS. Lyon.",
  metadataBase: new URL("https://limperiam.com"),
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();
  const theme = await getTheme();
  return (
    <html lang={lang} data-theme={theme} className={inter.variable}>
      <body>
        <LangThemeProvider initialLang={lang} initialTheme={theme}>
          {children}
        </LangThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Build (expect errors)**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -20
```

Expected: build still fails because the section components reference `static.ts` (deleted). That's fine. We'll commit this step and fix downstream in later tasks.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/layout.tsx
git commit -m "feat(web): root layout reads lang/theme cookies and sets html attrs"
```

---

## Phase 1 — Client effects (cursor, scroll progress, magnetic)

### Task 6: CustomCursor component

**Files:**
- Create: `web/src/components/custom-cursor.tsx`

The original implementation is in `docs/superpowers/portfolio_react_app.js` lines 452-498. Port verbatim with `useRef` and `useEffect`. Add `"use client"`.

- [ ] **Step 1: Implement**

Create `web/src/components/custom-cursor.tsx`:
```typescript
"use client";

import { useEffect, useRef } from "react";

export function CustomCursor() {
  const dot = useRef<HTMLDivElement | null>(null);
  const ring = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;
    let dx = rx;
    let dy = ry;
    let raf = 0;

    const onMove = (e: MouseEvent) => {
      dx = e.clientX;
      dy = e.clientY;
      if (dot.current) {
        dot.current.style.transform = `translate(${dx}px, ${dy}px) translate(-50%, -50%)`;
      }
    };

    const tick = () => {
      rx += (dx - rx) * 0.18;
      ry += (dy - ry) * 0.18;
      if (ring.current) {
        ring.current.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove);

    const onOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      const interactive =
        target?.closest?.('a, button, [data-magnetic], [data-cursor="hover"]');
      if (ring.current) {
        ring.current.classList.toggle("is-hover", !!interactive);
      }
    };
    document.addEventListener("mouseover", onOver);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseover", onOver);
    };
  }, []);

  return (
    <>
      <div className="cursor-dot" ref={dot} />
      <div className="cursor-ring" ref={ring} />
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/custom-cursor.tsx
git commit -m "feat(web): add CustomCursor (port from original artifact)"
```

---

### Task 7: ScrollProgress component

**Files:**
- Create: `web/src/components/scroll-progress.tsx`

Original: `portfolio_react_app.js` lines 500-514.

- [ ] **Step 1: Implement**

Create `web/src/components/scroll-progress.tsx`:
```typescript
"use client";

import { useEffect, useRef } from "react";

export function ScrollProgress() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const p = max > 0 ? h.scrollTop / max : 0;
      if (ref.current) {
        ref.current.style.transform = `scaleX(${p})`;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return <div className="progress" ref={ref} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/scroll-progress.tsx
git commit -m "feat(web): add ScrollProgress bar (port from original)"
```

---

### Task 8: useMagnetic hook + Magnetic wrapper

**Files:**
- Create: `web/src/components/magnetic.tsx`

Original: `portfolio_react_app.js` lines 516-540 (the `useMagnetic` hook). The original attaches listeners to all `[data-magnetic]` elements on every render. We do the same as a top-level effect.

- [ ] **Step 1: Implement**

Create `web/src/components/magnetic.tsx`:
```typescript
"use client";

import { useEffect } from "react";

/**
 * Apply magnetic-follow effect to any element with `data-magnetic`.
 * Mount this once near the root (or in TopBar) so the listeners are
 * always present. Re-runs every render to catch newly-added elements.
 */
export function MagneticHandler() {
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>("[data-magnetic]"),
    );
    const onMove =
      (el: HTMLElement) =>
      (e: MouseEvent) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      };
    const onLeave = (el: HTMLElement) => () => {
      el.style.transform = "";
    };
    const handlers = els.map((el) => {
      const m = onMove(el);
      const l = onLeave(el);
      el.addEventListener("mousemove", m);
      el.addEventListener("mouseleave", l);
      el.style.transition = "transform 360ms cubic-bezier(.2,.7,.15,1)";
      return { el, m, l };
    });
    return () => {
      handlers.forEach(({ el, m, l }) => {
        el.removeEventListener("mousemove", m);
        el.removeEventListener("mouseleave", l);
      });
    };
  });

  return null;
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/magnetic.tsx
git commit -m "feat(web): add MagneticHandler for data-magnetic elements"
```

---

## Phase 2 — Reveal primitives (rewrite)

### Task 9: Rewrite Reveal + add WordReveal

**Files:**
- Replace: `web/src/components/reveal.tsx`
- Create: `web/src/components/word-reveal.tsx`

Original `Reveal` is in `portfolio_react_app.js` lines 71-85. Original `WordReveal` is in lines 52-69. Our Plan 2 Reveal works correctly but uses a slightly different prop API — replace it to match the original's shape (`as`, `delay`, `className`).

- [ ] **Step 1: Replace Reveal**

REPLACE `web/src/components/reveal.tsx`:
```typescript
"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

function useReveal(opts: IntersectionObserverInit = {}) {
  const ref = useRef<HTMLElement | null>(null);
  const [seen, setSeen] = useState(false);

  // Initial visibility check (synchronous on mount)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useLayoutEffect(() => {
    if (!ref.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      setSeen(true);
      return;
    }
    const r = ref.current.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.95 && r.bottom > 0) {
      setSeen(true);
    }
  }, []);

  useEffect(() => {
    if (seen || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        });
      },
      { threshold: 0.05, ...opts },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen, opts]);

  return [ref, seen] as const;
}

type RevealProps = {
  children: React.ReactNode;
  as?: "div" | "span" | "section" | "header" | "p" | "li";
  className?: string;
  delay?: number;
};

export function Reveal({
  children,
  as = "div",
  className = "",
  delay = 0,
}: RevealProps) {
  const [ref, seen] = useReveal();
  const Tag = as as React.ElementType;
  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      className={`r-up ${className} ${seen ? "is-in" : ""}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

export { useReveal };
```

Note: the original CSS uses `.r-up` and `.is-in` for the reveal animation (already in the ported `globals.css`). We drop the `.reveal[data-seen]` pattern from Plan 2.

- [ ] **Step 2: Create WordReveal**

Create `web/src/components/word-reveal.tsx`:
```typescript
"use client";

import { useReveal } from "./reveal";

type Props = {
  text: string;
  className?: string;
  baseDelay?: number;
};

export function WordReveal({ text, className = "", baseDelay = 0 }: Props) {
  const [ref, seen] = useReveal({ threshold: 0.4 });
  const words = text.split(/(\s+)/); // keep whitespace tokens
  return (
    <span
      ref={ref as React.RefObject<HTMLElement>}
      className={`word-reveal ${className} ${seen ? "is-in" : ""}`}
    >
      {words.map((w, i) =>
        /\s/.test(w) ? (
          <span key={i} className="ws">
            {w}
          </span>
        ) : (
          <span
            key={i}
            className="w"
            style={{ transitionDelay: `${(baseDelay + i) * 40}ms` }}
          >
            {w}
          </span>
        ),
      )}
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/reveal.tsx web/src/components/word-reveal.tsx
git commit -m "feat(web): rewrite Reveal to match original + add WordReveal"
```

---

## Phase 3 — TopBar (status dot, nav centered, toggles)

### Task 10: StatusDot with tooltip

**Files:**
- Replace: `web/src/components/status-dot.tsx`

Original DOM (from TopBar in portfolio_react_app.js lines 96-102):
```html
<span class="status-wrap" tabIndex="0" aria-label="...">
  <span class="dot" />
  <span class="tip">Disponible pour de nouvelles missions</span>
</span>
```

The dot pulsing + tooltip behavior is fully in the original CSS (.status-wrap, .dot, .tip selectors). We just render the DOM.

- [ ] **Step 1: Replace**

REPLACE `web/src/components/status-dot.tsx`:
```typescript
export function StatusDot({ label }: { label: string }) {
  return (
    <span className="status-wrap" tabIndex={0} aria-label={label}>
      <span className="dot" />
      <span className="tip">{label}</span>
    </span>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/status-dot.tsx
git commit -m "feat(web): port StatusDot with tooltip (status-wrap structure)"
```

---

### Task 11: Lang + Theme toggle components

**Files:**
- Create: `web/src/components/lang-toggle.tsx`
- Create: `web/src/components/theme-toggle.tsx`

Original DOM (lines 110-135 of portfolio_react_app.js):
```html
<div class="lang-switch" role="tablist">
  <button class="is-active">FR</button>
  <button>EN</button>
</div>
<button class="ctl" aria-label="Toggle theme">☼ or ☾</button>
```

- [ ] **Step 1: LangToggle**

Create `web/src/components/lang-toggle.tsx`:
```typescript
"use client";

import { useLangTheme } from "./lang-theme-provider";

export function LangToggle() {
  const { lang, setLang } = useLangTheme();
  return (
    <div className="lang-switch" role="tablist" aria-label="Language">
      <button
        className={lang === "fr" ? "is-active" : ""}
        onClick={() => setLang("fr")}
        aria-pressed={lang === "fr"}
      >
        FR
      </button>
      <button
        className={lang === "en" ? "is-active" : ""}
        onClick={() => setLang("en")}
        aria-pressed={lang === "en"}
      >
        EN
      </button>
    </div>
  );
}
```

- [ ] **Step 2: ThemeToggle**

Create `web/src/components/theme-toggle.tsx`:
```typescript
"use client";

import { useLangTheme } from "./lang-theme-provider";

export function ThemeToggle() {
  const { theme, setTheme } = useLangTheme();
  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      className="ctl"
      onClick={() => setTheme(next)}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {theme === "dark" ? "☼" : "☾"}
    </button>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/lang-toggle.tsx web/src/components/theme-toggle.tsx
git commit -m "feat(web): add Lang + Theme toggle clients"
```

---

### Task 12: TopBar (replace nav.tsx)

**Files:**
- Create: `web/src/components/topbar.tsx`
- Delete: `web/src/components/nav.tsx`

Original DOM (lines 87-138 of portfolio_react_app.js):
- `<header class="topbar [is-scrolled]">`
- `<a class="brand" href="#top">` containing `<StatusDot>` and the brand text
- `<nav>` with 4 anchor links (Approche, Travaux, Stack, Contact)
- `<div class="controls">` with LangToggle + ThemeToggle

- [ ] **Step 1: Create TopBar**

Create `web/src/components/topbar.tsx`:
```typescript
"use client";

import { useEffect, useState } from "react";
import { useLangTheme } from "./lang-theme-provider";
import { getDict } from "@/content/i18n";
import { StatusDot } from "./status-dot";
import { LangToggle } from "./lang-toggle";
import { ThemeToggle } from "./theme-toggle";

export function TopBar() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`topbar ${scrolled ? "is-scrolled" : ""}`}>
      <a href="#top" className="brand">
        <StatusDot label={t.hero.status_label} />
        {t.brand}
      </a>
      <nav>
        <a href="#approach">{t.nav.about}</a>
        <a href="#work">{t.nav.work}</a>
        <a href="#stack">{t.nav.stack}</a>
        <a href="#contact">{t.nav.contact}</a>
      </nav>
      <div className="controls">
        <LangToggle />
        <ThemeToggle />
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Delete old nav**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
rm web/src/components/nav.tsx
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/topbar.tsx
git rm web/src/components/nav.tsx
git commit -m "feat(web): replace Nav with TopBar (status dot + centered nav + toggles)"
```

---

## Phase 4 — Sections

### Task 13: Hero (verbatim port with WordReveal + italics)

**Files:**
- Replace: `web/src/components/sections/hero.tsx`

Original: `portfolio_react_app.js` lines 141-175.

DOM structure:
```html
<section class="hero shell" id="top">
  <Reveal class="hero-status">
    <span class="pip" />{t.hero.meta_left} · {t.hero.meta_right}
  </Reveal>
  <h1 class="hero-title">
    <WordReveal text={hero.headline_pre} />
    <span class="it"><WordReveal text={hero.headline_em} baseDelay={3}/></span>
    <WordReveal text={hero.headline_post} baseDelay={5}/>
    <br/>
    <span class="it"><WordReveal text={hero.headline_post2} baseDelay={7}/></span>
  </h1>
  <Reveal delay={500} class="hero-sub">{t.hero.sub}</Reveal>
  <Reveal delay={650} class="hero-actions">
    <a data-magnetic class="btn primary" href="#work">{t.hero.cta_primary}</a>
    <a data-magnetic class="btn ghost" href={`mailto:${contact.email}`}>{t.hero.cta_secondary}</a>
  </Reveal>
</section>
```

Plus the original has a giant pale "l" watermark — that's in CSS (the `:before` pseudo on the hero section, or a separate decorative element). Check the CSS for `.hero` rules.

- [ ] **Step 1: Implement**

Look at the original CSS for `.hero` (search `/tmp/css-rules.css` or the ported globals.css for `.hero` rules) to see what classes the hero needs. The visible watermark is likely an `:after` or `:before` pseudo on `.hero` or a child element.

REPLACE `web/src/components/sections/hero.tsx`:
```typescript
"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";

export function Hero() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const hero = t.hero;
  const contactEmail = t.contact.email;

  return (
    <section className="hero shell" id="top">
      <Reveal className="hero-status">
        <span className="pip" aria-hidden="true" />
        <span className="hero-status-left">{hero.meta_left}</span>
        <span className="hero-status-mid">·</span>
        <span className="hero-status-right">{hero.meta_right}</span>
      </Reveal>

      <h1 className="hero-title">
        <WordReveal text={hero.headline_pre} />
        <span className="it">
          <WordReveal text={hero.headline_em} baseDelay={3} />
        </span>
        <WordReveal text={hero.headline_post} baseDelay={5} />
        <br />
        <span className="it">
          <WordReveal text={hero.headline_post2} baseDelay={7} />
        </span>
      </h1>

      <Reveal delay={500} className="hero-sub">
        <p>{hero.sub}</p>
      </Reveal>

      <Reveal delay={650} className="hero-actions">
        <a className="btn primary" href="#work" data-magnetic>
          {hero.cta_primary}
        </a>
        <a
          className="btn ghost"
          href={`mailto:${contactEmail}`}
          data-magnetic
        >
          {hero.cta_secondary}
        </a>
      </Reveal>
    </section>
  );
}
```

This is a CLIENT component now because it uses `useLangTheme`. The hero status row matches the original's "DISPONIBLE — IMMÉDIATEMENT · BASÉ À ANGLEFORT · TÉLÉTRAVAIL" layout — the original puts both meta strings together separated by `·`. Inspect the original CSS for `.hero-status` to confirm.

- [ ] **Step 2: Commit**

```bash
git add web/src/components/sections/hero.tsx
git commit -m "feat(web): port Hero verbatim with WordReveal + italics + magnetic CTAs"
```

---

### Task 14: About (3 pillars, verbatim)

**Files:**
- Replace: `web/src/components/sections/about.tsx`

Original: `portfolio_react_app.js` lines 178-211.

```html
<section class="section" id="approach">
  <div class="shell">
    <div class="about-head">
      <Reveal><span class="kicker">{about.kicker}</span></Reveal>
      <h2 class="h2">
        <WordReveal text={about.headline_pre} />
        <span class="it"><WordReveal text={about.headline_em} baseDelay={2}/></span>
        <WordReveal text={about.headline_post} baseDelay={4}/>
      </h2>
      <Reveal delay={200}>
        <p class="lede">{about.lede}</p>
      </Reveal>
    </div>
    <div class="pillars">
      {about.pillars.map(p => (
        <Reveal key delay={i*120} class="pillar">
          <div class="num">{p.k}</div>
          <div class="ttl">{p.t_pre}<span class="it">{p.t_em}</span></div>
          <div class="desc">{p.d}</div>
        </Reveal>
      ))}
    </div>
  </div>
</section>
```

- [ ] **Step 1: Implement**

REPLACE `web/src/components/sections/about.tsx`:
```typescript
"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";

export function About() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const a = t.about;

  return (
    <section className="section" id="approach">
      <div className="shell">
        <div className="about-head">
          <Reveal>
            <span className="kicker">{a.kicker}</span>
          </Reveal>
          <h2 className="h2">
            <WordReveal text={a.headline_pre} />
            <span className="it">
              <WordReveal text={a.headline_em} baseDelay={2} />
            </span>
            <WordReveal text={a.headline_post} baseDelay={4} />
          </h2>
          <Reveal delay={200}>
            <p className="lede">{a.lede}</p>
          </Reveal>
        </div>
        <div className="pillars">
          {a.pillars.map((p, i) => (
            <Reveal key={p.k} delay={i * 120} className="pillar">
              <div className="num">{p.k}</div>
              <div className="ttl">
                {p.t_pre}
                <span className="it">{p.t_em}</span>
              </div>
              <div className="desc">{p.d}</div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/sections/about.tsx
git commit -m "feat(web): port About section verbatim (3 pillars structure)"
```

---

### Task 15: Work + WorkItem (full card structure with stats/tags/arrow)

**Files:**
- Replace: `web/src/components/sections/work.tsx`
- Create: `web/src/components/work-item.tsx`

Original: `portfolio_react_app.js` lines 213-288.

The original Work item has rich content:
- `n` (the "01", "02"... number)
- `year`, `client`, `role` columns
- Headline with italic emphasis
- Summary
- Tags
- Stats grid
- Arrow chip on the right

OUR DB doesn't have year/client/role/stats fields per project. The Plan 2 seed_portfolio.py creates projects with: slug, title, description, tech_stack, display_order, is_published, optional live_url. We need to add or derive year/client/role/stats for full fidelity.

**Decision for this plan:** Extend the seed_portfolio.py and the Project model conceptually by storing the year/client/role/stats in the existing `content` markdown field (formatted as YAML frontmatter), and parse it in WorkItem. This avoids a DB migration. The implementer reads the original portfolio_content.js to know the exact year/client/role/stats per project and adds them to the seed.

Actually simpler: store the structured per-project metadata directly in the seed script's per-project dict, and surface it through a new optional field. But that requires a DB change.

**Practical compromise**: hardcode the per-project metadata (year/client/role/stats) in a `WORK_META` object keyed by slug, in the component. The CMS continues to manage description/tech_stack/etc.; the "additional editorial metadata" is sourced from the artifact. If admin wants to edit year/role later, that's a Plan 5 task to extend the model.

- [ ] **Step 1: Define work metadata module**

Create `web/src/content/work-meta.ts`:
```typescript
// Editorial metadata per project, lifted from the original artifact.
// Keyed by project slug. Years/clients/roles/stats are the same in FR and EN
// (mostly — the FR version uses "auj." vs "now", which we render via the dict).

export type WorkMeta = {
  n: string;
  year_fr: string;
  year_en: string;
  client: string;
  role: string;
  stats: Array<{ v: string; l_fr: string; l_en: string }>;
};

export const WORK_META: Record<string, WorkMeta> = {
  "credit-agricole-ts": {
    n: "01",
    year_fr: "2023 — auj.",
    year_en: "2023 — now",
    client: "Crédit Agricole T&S",
    role: "Java Developer · Freelance",
    stats: [
      { v: "100%", l_fr: "remboursements automatisés", l_en: "automated refunds" },
      { v: "30+", l_fr: "règles métier", l_en: "business rules" },
      { v: "2 ans", l_fr: "en mission", l_en: "yrs on mission" },
    ],
  },
  "walky-doggy": {
    n: "02",
    year_fr: "Janv. 2026 — auj.",
    year_en: "Jan 2026 — now",
    client: "Walky Doggy",
    role: "iOS · Firebase · solo",
    stats: [
      { v: "1.0", l_fr: "en production", l_en: "in production" },
      { v: "iOS", l_fr: "natif", l_en: "native" },
      { v: "FR + EN", l_fr: "App Store", l_en: "App Store" },
    ],
  },
  tennaxia: {
    n: "03",
    year_fr: "2022 — 2023",
    year_en: "2022 — 2023",
    client: "Tennaxia",
    role: "Fullstack Java / Vue.js",
    stats: [
      { v: "15", l_fr: "devs en équipe", l_en: "devs on team" },
      { v: "1 an", l_fr: "en CDI", l_en: "yr full-time" },
    ],
  },
  cnaf: {
    n: "04",
    year_fr: "2021 — 2022",
    year_en: "2021 — 2022",
    client: "CNAF",
    role: "Java Developer",
    stats: [
      { v: "1M+", l_fr: "lignes de code", l_en: "lines of code" },
      { v: "270", l_fr: "tables", l_en: "tables" },
    ],
  },
  "marathon-perso": {
    n: "05",
    year_fr: "Juin 2026 — auj.",
    year_en: "Jun 2026 — now",
    client: "marathon (perso)",
    role: "SvelteKit · TypeScript · PWA",
    stats: [
      { v: "25", l_fr: "semaines de plan", l_en: "weeks of plan" },
      { v: "PWA", l_fr: "iOS installable", l_en: "iOS installable" },
    ],
  },
};
```

- [ ] **Step 2: WorkItem component**

Create `web/src/components/work-item.tsx`:
```typescript
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
  const client = meta?.client ?? item.title;
  const role = meta?.role ?? "";
  const stats = meta?.stats ?? [];
  const tags: string[] = Array.isArray(item.tech_stack) ? item.tech_stack : [];

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
          {item.title}
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
          →
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
```

- [ ] **Step 3: Work section (server component, fetches projects, passes to WorkItem)**

REPLACE `web/src/components/sections/work.tsx`:
```typescript
import { fetchProjects } from "@/lib/server-fetch";
import { getLang } from "@/lib/prefs";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";
import { WorkItem } from "@/components/work-item";

export async function Work() {
  const projects = await fetchProjects();
  const lang = await getLang();
  const t = getDict(lang);
  const w = t.work;

  return (
    <section className="section" id="work">
      <div className="shell">
        <div className="work-head">
          <div>
            <Reveal>
              <span className="kicker">{w.kicker}</span>
            </Reveal>
            <h2 className="h2">
              <WordReveal text={w.headline_pre} />
              <span className="it">
                <WordReveal text={w.headline_em} baseDelay={3} />
              </span>
              <WordReveal text={w.headline_post} baseDelay={5} />
            </h2>
          </div>
          <Reveal delay={200}>
            <p className="sub" style={{ margin: 0 }}>
              {w.sub}
            </p>
          </Reveal>
        </div>
        <div className="work-list">
          {projects.map((p, i) => (
            <WorkItem key={p.id} item={p} idx={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

The Work section is a server component (fetches data). The WorkItem is a client component (has state + reveal hook).

- [ ] **Step 4: Commit**

```bash
git add web/src/content/work-meta.ts web/src/components/work-item.tsx web/src/components/sections/work.tsx
git commit -m "feat(web): port Work section with full WorkItem structure + meta"
```

---

### Task 16: Stack section with auto-scrolling marquee

**Files:**
- Replace: `web/src/components/sections/stack.tsx`

Original: `portfolio_react_app.js` lines 290-334 (Stack and the marquee).

DOM:
```html
<section class="section section--alt" id="stack">
  <div class="shell">
    <div class="work-head">
      <div>
        <Reveal><span class="kicker">{stack.kicker}</span></Reveal>
        <h2 class="h2">
          <WordReveal text={stack.headline_pre} />
          <span class="it"><WordReveal text={stack.headline_em} baseDelay={2}/></span>
        </h2>
      </div>
      <Reveal delay={200}><p class="sub">{stack.sub}</p></Reveal>
    </div>
    <div class="stack-grid">
      {stack.groups.map((g, i) => (
        <Reveal key delay={i*100} class="stack-card">
          <h3>{g.t}</h3>
          <ul>{g.items.map(it => <li key>{it}</li>)}</ul>
        </Reveal>
      ))}
    </div>
  </div>
  <div class="marquee" aria-hidden="true">
    <div class="marquee-track">
      {marqueeText}
      {marqueeText} {/* duplicated for seamless loop */}
    </div>
  </div>
</section>
```

The marquee text alternates italic on every 3rd item (`i % 3 === 1`) and uses `·` separators.

Our DB has skills with category — we need to group them like the original (Backend, Frontend, Mobile, DevOps, Pratique) AND flatten them for the marquee.

In the seed_portfolio.py we mapped "Mobile" to category="tools". For the display label we want "Mobile" though. We adapt the category labels to match the original:
- "backend" → "Backend"
- "frontend" → "Frontend"
- "tools" → "Mobile" (since our tools-category seed contains iOS-related items)
- "devops" → "DevOps"
- "soft" → "Pratique"

This is hacky but matches the original layout. A proper fix later would be to rename the `tools` category to `mobile` in the schema or add a "mobile" enum value to skills.category.

- [ ] **Step 1: Implement**

REPLACE `web/src/components/sections/stack.tsx`:
```typescript
import { fetchSkills, type Skill } from "@/lib/server-fetch";
import { getLang } from "@/lib/prefs";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";

const CATEGORY_LABEL_FR: Record<Skill["category"], string> = {
  backend: "Backend",
  frontend: "Frontend",
  tools: "Mobile",
  devops: "DevOps",
  soft: "Pratique",
};

const CATEGORY_LABEL_EN: Record<Skill["category"], string> = {
  backend: "Backend",
  frontend: "Frontend",
  tools: "Mobile",
  devops: "DevOps",
  soft: "Practice",
};

const CATEGORY_ORDER: Skill["category"][] = [
  "backend",
  "frontend",
  "tools",
  "devops",
  "soft",
];

function groupSkills(skills: Skill[], labels: Record<Skill["category"], string>) {
  const groups = new Map<Skill["category"], Skill[]>();
  for (const cat of CATEGORY_ORDER) groups.set(cat, []);
  for (const s of skills) {
    const arr = groups.get(s.category);
    if (arr) arr.push(s);
  }
  return CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: labels[cat],
    items: groups.get(cat) ?? [],
  })).filter((g) => g.items.length > 0);
}

export async function Stack() {
  const skills = await fetchSkills();
  const lang = await getLang();
  const t = getDict(lang);
  const s = t.stack;
  const labels = lang === "fr" ? CATEGORY_LABEL_FR : CATEGORY_LABEL_EN;
  const groups = groupSkills(skills, labels);
  const flat = groups.flatMap((g) => g.items.map((it) => it.name));

  const marqueeText = (
    <>
      {flat.map((it, i) => (
        <span key={`a-${i}`} className="marquee-cell">
          {i % 3 === 1 ? <span className="it">{it}</span> : <span>{it}</span>}
          <span className="dot">·</span>
        </span>
      ))}
    </>
  );

  return (
    <section className="section section--alt" id="stack">
      <div className="shell">
        <div className="work-head">
          <div>
            <Reveal>
              <span className="kicker">{s.kicker}</span>
            </Reveal>
            <h2 className="h2">
              <WordReveal text={s.headline_pre} />
              <span className="it">
                <WordReveal text={s.headline_em} baseDelay={2} />
              </span>
            </h2>
          </div>
          <Reveal delay={200}>
            <p className="sub" style={{ margin: 0 }}>
              {s.sub}
            </p>
          </Reveal>
        </div>
        <div className="stack-grid">
          {groups.map((g, i) => (
            <Reveal key={g.category} delay={i * 100} className="stack-card">
              <h3>{g.label}</h3>
              <ul>
                {g.items.map((it) => (
                  <li key={it.id}>{it.name}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
      <div className="marquee" aria-hidden="true">
        <div className="marquee-track">
          {marqueeText}
          {marqueeText}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add web/src/components/sections/stack.tsx
git commit -m "feat(web): port Stack with cards + auto-scrolling marquee"
```

---

### Task 17: Contact (port original DOM + keep form below)

**Files:**
- Replace: `web/src/components/sections/contact.tsx`

**Important context:** the original artifact's Contact section does NOT have a form — it shows the email as a huge clickable link, a copy-to-clipboard button, and a list of "elsewhere" links (LinkedIn, GitHub, Walky Doggy). We keep our `ContactForm` (from Plan 2, with the elapsed_ms fix applied) and add it BELOW the original email block. This preserves the visual identity while keeping the form capability.

The original Contact component (verbatim, `portfolio_react_app.js` lines 341-398):
```javascript
function Contact({ t }) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(t.contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (e) { /* noop */ }
  }, [t.contact.email]);
  return (
    <section className="section contact" id="contact">
      <div className="shell">
        <Reveal><span className="kicker">{t.contact.kicker}</span></Reveal>
        <h2 className="h2">
          <WordReveal text={t.contact.headline_pre} />
          <span className="it"><WordReveal text={t.contact.headline_em} baseDelay={3} /></span>
        </h2>
        <Reveal delay={200}>
          <p className="sub" style={{ margin: "16px 0 0" }}>{t.contact.sub}</p>
        </Reveal>
        <div className="contact-grid">
          <Reveal delay={300} className="email-row">
            <a href={`mailto:${t.contact.email}`} className="email-mega">
              {t.contact.email}
            </a>
            <button className={`copy-btn ${copied ? "is-copied" : ""}`} onClick={copy}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                {copied ? (
                  <polyline points="20 6 9 17 4 12" />
                ) : (
                  <>
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </>
                )}
              </svg>
              {copied ? t.contact.copied_label : t.contact.copy_label}
            </button>
          </Reveal>
          <Reveal delay={420}>
            <ul className="elsewhere">
              {t.contact.links.map((lk) => (
                <li key={lk.l}>
                  <a href={lk.h} target="_blank" rel="noreferrer noopener">
                    {lk.l}
                    <span className="arrow">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 1: Split into client copy button + server section**

The `copy` callback uses `navigator.clipboard` (client-only). We extract it into its own client component, then keep the section as a client component (since it also needs `useLangTheme`).

Create `web/src/components/copy-email.tsx`:
```typescript
"use client";

import { useCallback, useState } from "react";

export function CopyEmail({
  email,
  copyLabel,
  copiedLabel,
}: {
  email: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  }, [email]);

  return (
    <button
      type="button"
      className={`copy-btn ${copied ? "is-copied" : ""}`}
      onClick={copy}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {copied ? (
          <polyline points="20 6 9 17 4 12" />
        ) : (
          <>
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </>
        )}
      </svg>
      {copied ? copiedLabel : copyLabel}
    </button>
  );
}
```

- [ ] **Step 2: Section component**

The original `ContactForm` from Plan 2 was styled with Tailwind. The original artifact's CSS doesn't define `.field` etc. — so we either keep the Tailwind classes on the form (which look mismatched), or restyle the form with new CSS. For this plan, the path of least surprise: KEEP the form's existing Tailwind look, but place it within the section. The user can decide later if they want to restyle the form to match the original aesthetic.

REPLACE `web/src/components/sections/contact.tsx`:
```typescript
"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";
import { WordReveal } from "@/components/word-reveal";
import { CopyEmail } from "@/components/copy-email";
import { ContactForm } from "@/components/contact-form";

const CALCOM_LINK = process.env.NEXT_PUBLIC_CALCOM_LINK;

export function Contact() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const c = t.contact;

  return (
    <section className="section contact" id="contact">
      <div className="shell">
        <Reveal>
          <span className="kicker">{c.kicker}</span>
        </Reveal>
        <h2 className="h2">
          <WordReveal text={c.headline_pre} />
          <span className="it">
            <WordReveal text={c.headline_em} baseDelay={3} />
          </span>
        </h2>
        <Reveal delay={200}>
          <p className="sub" style={{ margin: "16px 0 0" }}>
            {c.sub}
          </p>
        </Reveal>

        <div className="contact-grid">
          <Reveal delay={300} className="email-row">
            <a href={`mailto:${c.email}`} className="email-mega">
              {c.email}
            </a>
            <CopyEmail
              email={c.email}
              copyLabel={c.copy_label}
              copiedLabel={c.copied_label}
            />
          </Reveal>
          <Reveal delay={420}>
            <ul className="elsewhere">
              {c.links.map((lk) => (
                <li key={lk.l}>
                  <a href={lk.h} target="_blank" rel="noreferrer noopener">
                    {lk.l}
                    <span className="arrow">↗</span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
          {CALCOM_LINK && (
            <Reveal delay={500}>
              <a
                href={`https://cal.com/${CALCOM_LINK}`}
                target="_blank"
                rel="noreferrer"
                className="btn primary"
                style={{ marginTop: 12 }}
                data-magnetic
              >
                {lang === "fr"
                  ? "Réserver un créneau →"
                  : "Book a slot →"}
              </a>
            </Reveal>
          )}
        </div>

        {/* Contact form (kept from Plan 2 — Tailwind-styled, separate from the editorial section) */}
        <Reveal delay={600} className="contact-form-wrap" as="div">
          <ContactForm />
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/sections/contact.tsx web/src/components/copy-email.tsx
git commit -m "feat(web): port Contact section verbatim (email-mega + copy + elsewhere) + keep form below"
```

---

### Task 18: Legal + Footer (verbatim port)

**Files:**
- Replace: `web/src/components/sections/legal.tsx`
- Replace: `web/src/components/sections/footer.tsx`

Original Legal (verbatim, `portfolio_react_app.js` lines 412-451):
```javascript
function Legal({ t }) {
  if (!t.legal) return null;
  return (
    <section className="section" id="legal">
      <div className="shell">
        <Reveal><span className="kicker">{t.legal.kicker}</span></Reveal>
        <Reveal delay={120}>
          <h2 className="h2">
            {t.legal.headline_pre}
            <span className="it">{t.legal.headline_em}</span>
          </h2>
        </Reveal>
        <Reveal delay={220}>
          <p className="sub">{t.legal.sub}</p>
        </Reveal>
        <div className="legal-grid">
          <Reveal delay={280}>
            <a className="legal-link" href={t.legal.link.h} target="_blank" rel="noopener noreferrer">
              {t.legal.link.l}
              <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
          <div className="legal-table">
            {t.legal.rows.map((r, i) => (
              <Reveal key={r.l} delay={120 + i * 60}>
                <div className="legal-row">
                  <span className="l">{r.l}</span>
                  <span className="v">{r.v}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

Original Footer (verbatim, lines 399-410):
```javascript
function Footer({ t }) {
  return (
    <footer className="foot">
      <div>
        <span className="b">{t.footer.brand}</span>
        <span style={{ marginLeft: 12 }}>— {t.footer.tagline}</span>
      </div>
      <div>{t.footer.colophon}</div>
    </footer>
  );
}
```

- [ ] **Step 1: Port Legal**

REPLACE `web/src/components/sections/legal.tsx`:
```typescript
"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";
import { Reveal } from "@/components/reveal";

export function Legal() {
  const { lang } = useLangTheme();
  const t = getDict(lang);
  const l = t.legal;

  return (
    <section className="section" id="legal">
      <div className="shell">
        <Reveal>
          <span className="kicker">{l.kicker}</span>
        </Reveal>
        <Reveal delay={120}>
          <h2 className="h2">
            {l.headline_pre}
            <span className="it">{l.headline_em}</span>
          </h2>
        </Reveal>
        <Reveal delay={220}>
          <p className="sub">{l.sub}</p>
        </Reveal>
        <div className="legal-grid">
          <Reveal delay={280}>
            <a
              className="legal-link"
              href={l.link.h}
              target="_blank"
              rel="noopener noreferrer"
            >
              {l.link.l}
              <span aria-hidden="true">↗</span>
            </a>
          </Reveal>
          <div className="legal-table">
            {l.rows.map((r, i) => (
              <Reveal key={r.l} delay={120 + i * 60}>
                <div className="legal-row">
                  <span className="l">{r.l}</span>
                  <span className="v">{r.v}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
```

Note: original uses plain text for `headline_pre/em` (no `WordReveal`) — matches the original. Don't add WordReveal here.

- [ ] **Step 2: Port Footer**

REPLACE `web/src/components/sections/footer.tsx`:
```typescript
"use client";

import { useLangTheme } from "@/components/lang-theme-provider";
import { getDict } from "@/content/i18n";

export function Footer() {
  const { lang } = useLangTheme();
  const f = getDict(lang).footer;

  return (
    <footer className="foot">
      <div>
        <span className="b">{f.brand}</span>
        <span style={{ marginLeft: 12 }}>— {f.tagline}</span>
      </div>
      <div>{f.colophon}</div>
    </footer>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add web/src/components/sections/legal.tsx web/src/components/sections/footer.tsx
git commit -m "feat(web): port Legal + Footer to original DOM"
```

---

### Task 19: Compose new page.tsx + wire client effects

**Files:**
- Replace: `web/src/app/page.tsx`

The new page composes the sections and mounts the client-side effects (CustomCursor, ScrollProgress, MagneticHandler) once.

- [ ] **Step 1: Replace**

REPLACE `web/src/app/page.tsx`:
```typescript
import { TopBar } from "@/components/topbar";
import { CustomCursor } from "@/components/custom-cursor";
import { ScrollProgress } from "@/components/scroll-progress";
import { MagneticHandler } from "@/components/magnetic";
import { Hero } from "@/components/sections/hero";
import { About } from "@/components/sections/about";
import { Work } from "@/components/sections/work";
import { Stack } from "@/components/sections/stack";
import { Contact } from "@/components/sections/contact";
import { Legal } from "@/components/sections/legal";
import { Footer } from "@/components/sections/footer";

export default function HomePage() {
  return (
    <>
      <ScrollProgress />
      <CustomCursor />
      <MagneticHandler />
      <TopBar />
      <main>
        <Hero />
        <About />
        <Work />
        <Stack />
        <Contact />
        <Legal />
      </main>
      <Footer />
    </>
  );
}
```

Note: `ScrollProgress`, `CustomCursor`, `MagneticHandler`, `TopBar` are all client components. Putting them inside a server-component page is fine — Next supports the nesting.

- [ ] **Step 2: Build + smoke**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
docker compose up -d --build web
sleep 8
curl -s -o /dev/null -w "Home: %{http_code}\n" http://localhost:3000
```

Expected: 200. The page should now match the original visually. Open `http://localhost:3000` in a browser to inspect.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/page.tsx
git commit -m "feat(web): compose new page with TopBar + client effects + sections"
```

---

## Phase 5 — Verification

### Task 20: Visual QA + final commit

- [ ] **Step 1: Full lint + build + tests**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npx prettier --write "src/**/*.{ts,tsx,css}"
npx eslint src --fix 2>&1 | tail -10
npm test
npm run build 2>&1 | tail -15
```

Expected: all clean, vitest passes (9 tests).

- [ ] **Step 2: Manual visual check**

Open `http://localhost:3000` in a browser and verify each of the following:
- [ ] Custom cursor visible (dot + ring)
- [ ] Orange progress bar at top reflects scroll position
- [ ] TopBar: status dot pulsing to LEFT of "limperiam", nav CENTERED, FR/EN + theme toggle on right
- [ ] Status dot hover/focus shows "Disponible pour de nouvelles missions" tooltip
- [ ] Hero: huge italic "propre," and "backend." emphasis, layout matches original screenshots
- [ ] Theme toggle flips to dark mode and colors swap correctly
- [ ] FR/EN toggle swaps UI strings (hero headline, nav, etc.)
- [ ] Brand "limperiam" click scrolls to top
- [ ] Work cards show year/client/role columns, tags, stats grid, arrow chip
- [ ] Stack: cards grouped (Backend/Frontend/Mobile/DevOps/Pratique) + auto-scrolling marquee below
- [ ] Contact form: submission works (anti-bot fix from Plan 2 testing still functional)
- [ ] Legal section: kicker, italic emphasis, rows, link
- [ ] Footer: brand + tagline + colophon

Note any visual diffs vs the original screenshots and fix in follow-up commits.

- [ ] **Step 3: Commit any prettier/eslint formatting changes**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add -A web/
git diff --cached --quiet || git commit -m "style(web): apply prettier + eslint fixes"
```

- [ ] **Step 4: Update README + tag**

REPLACE `README.md` to update Plan 4 status:

In the Status section, change:
```
- ✅ **Plan 3: Admin UI** (`v0.3.0-admin`) — full CMS, image upload, Cal.com link
```

to:
```
- ✅ **Plan 3: Admin UI** (`v0.3.0-admin`) — full CMS, image upload, Cal.com link
- ✅ **Plan 4: Visual fidelity rebuild** (`v0.4.0-fidelity`) — verbatim port of original CSS + components, FR/EN, dark mode, cursor, scroll progress, marquee
```

```bash
git add README.md
git commit -m "docs: update README with Plan 4 status"
git tag -a v0.4.0-fidelity -m "Plan 4 complete: visual fidelity rebuild"
git tag
```

Expected: 4 tags: `v0.1.0-api`, `v0.2.0-web`, `v0.3.0-admin`, `v0.4.0-fidelity`.

---

## Definition of Done — Plan 4

After this plan, the public site:
1. **Pixel-matches** the original artifact's design (Marathon Design System, 1316-line CSS port verbatim).
2. Renders with custom cursor (dot + ring), orange scroll progress bar, status dot tooltip.
3. Has a sticky TopBar: brand+statusDot left, nav centered, FR/EN + theme toggle right.
4. **Supports FR/EN** via cookie-backed lang state with instant UI updates.
5. **Supports light/dark mode** via cookie-backed theme state.
6. Hero renders the headline with proper italic emphasis on "propre," and "backend.", per-word fade-in via WordReveal.
7. About section shows 3 pillars with the original card structure.
8. Work cards have the rich layout: number, year/client/role, headline, summary, tags, stats grid, arrow chip.
9. Stack shows cards grouped by category PLUS an auto-scrolling marquee with all skills.
10. Contact form submission still works (Plan 2 fix preserved), with the original DOM/CSS.
11. Legal and Footer match the original structure.
12. Admin (Plan 3) is untouched and still works.

**Out of scope, deferred to Plan 5 if needed:**
- Translating dynamic content (projects/experiences descriptions) to EN.
- Storing year/client/role/stats in DB (currently hardcoded in `work-meta.ts`).
- Dark mode for admin pages (admin still uses light-mode design).

The implementer should never invent designs — every class name, every DOM structure, every CSS value comes from the original artifact in `docs/superpowers/portfolio_template.html` and `docs/superpowers/portfolio_react_app.js`. When in doubt, READ THE ORIGINAL.
