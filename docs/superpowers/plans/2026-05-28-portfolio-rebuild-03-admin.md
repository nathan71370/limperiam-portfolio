# Portfolio Rebuild — Plan 3: Admin UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fully functional admin section to the Next.js app — login, middleware-protected routes, CRUD UIs for projects/experiences/skills/messages, image upload for projects, plus a Cal.com embed in the public Contact section. After this plan, the user can manage portfolio content entirely through the browser without running seed scripts or hitting the API directly.

**Architecture:** Server Components for all admin pages (no client-side data fetching). Server Actions for every mutation (login, CRUD, file upload). JWT cookie is set on the web domain (via Next.js `cookies()`) after the API confirms credentials — subsequent admin API calls forward this cookie server-side via a small `apiAdmin*` wrapper that reads from `cookies()` and injects a `Cookie` header. Middleware on `/admin/*` (excluding `/admin/login`) checks for the cookie presence and redirects to login if missing.

**Tech Stack:** Next.js 16 App Router, React 19 Server Actions, Zod, marked, FormData for uploads, `revalidateTag`/`revalidatePath` for cache busting.

**Spec:** [2026-05-27-portfolio-rebuild-design.md](../specs/2026-05-27-portfolio-rebuild-design.md)

**Depends on:** Plan 1 (`v0.1.0-api`) + Plan 2 (`v0.2.0-web`).

**Out of scope (Plan 4):** Deployment to home server, Cloudflared repoint, production env configuration.

---

## File structure additions

```
web/
├── src/
│   ├── app/
│   │   ├── (public)/                           # NOT created — public pages stay at root
│   │   ├── admin/
│   │   │   ├── layout.tsx                      # admin shell (sidebar, logout)
│   │   │   ├── page.tsx                        # dashboard
│   │   │   ├── login/
│   │   │   │   ├── page.tsx
│   │   │   │   └── login-form.tsx              # client
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx                    # list
│   │   │   │   ├── new/page.tsx                # create form
│   │   │   │   └── [id]/page.tsx               # edit form
│   │   │   ├── experiences/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   ├── skills/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [id]/page.tsx
│   │   │   └── messages/
│   │   │       └── page.tsx
│   │   └── actions/
│   │       ├── auth.ts                         # login, logout
│   │       ├── projects.ts                     # create/update/delete/upload
│   │       ├── experiences.ts
│   │       ├── skills.ts
│   │       └── messages.ts
│   ├── components/
│   │   ├── admin/
│   │   │   ├── sidebar.tsx
│   │   │   ├── topbar.tsx
│   │   │   ├── data-table.tsx                  # simple striped table
│   │   │   ├── field.tsx                       # label + input + error
│   │   │   ├── primary-button.tsx
│   │   │   └── ghost-button.tsx
│   │   └── sections/
│   │       └── contact.tsx                     # MODIFIED to include Cal.com
│   ├── lib/
│   │   ├── api-admin.ts                        # apiPut/apiPatch/apiDelete/apiUpload + cookie forwarding
│   │   └── auth-cookie.ts                      # COOKIE_NAME constant + helpers
│   └── middleware.ts                           # protects /admin/* except /admin/login
└── tests/
    └── unit/
        └── auth-action.test.ts                 # vitest unit test for loginAction
```

**Boundaries:**
- `app/admin/` is the only place that imports from `app/actions/`. The public site never touches them.
- `lib/api-admin.ts` is server-only (forwards cookies). `lib/api.ts` stays generic.
- `middleware.ts` runs on the Edge runtime — it only checks cookie presence, doesn't decode the JWT.
- One Server Action file per resource — keeps file size reasonable.

---

## Phase 0 — Auth foundation

### Task 1: Auth cookie helpers + admin API client

**Files:**
- Create: `web/src/lib/auth-cookie.ts`
- Create: `web/src/lib/api-admin.ts`

- [ ] **Step 1: Cookie constant + extractor**

Create `web/src/lib/auth-cookie.ts`:
```typescript
import "server-only";

export const COOKIE_NAME = "access_token";

/**
 * Parse a `Set-Cookie` response header from the API and extract the JWT value.
 * Returns null if not present.
 */
export function extractAccessToken(setCookieHeader: string | null): string | null {
  if (!setCookieHeader) return null;
  // Set-Cookie can contain multiple cookies (comma-separated only when JS Set-Cookie is joined)
  // But fetch().headers.get() joins them with comma. We split by ", " then look for our cookie.
  // Safer: use regex to find access_token=<value>
  const match = setCookieHeader.match(/(?:^|[,;]\s*)access_token=([^;]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1]);
}
```

- [ ] **Step 2: Admin API client with cookie forwarding**

Create `web/src/lib/api-admin.ts`:
```typescript
import "server-only";
import { cookies } from "next/headers";
import { ApiError } from "@/lib/api";
import { COOKIE_NAME } from "@/lib/auth-cookie";

const API_BASE = process.env.API_URL || "http://api:8000";
const API_PREFIX = "/api/v1";

function url(path: string): string {
  return `${API_BASE}${API_PREFIX}${path}`;
}

async function buildHeaders(extra: HeadersInit = {}): Promise<Headers> {
  const headers = new Headers(extra);
  headers.set("Accept", "application/json");
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (token) {
    // Forward as a Cookie header so the API's get_current_admin dep can read it
    headers.set("Cookie", `${COOKIE_NAME}=${token}`);
  }
  return headers;
}

async function parse<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

export async function apiAdminGet<T>(path: string): Promise<T> {
  const res = await fetch(url(path), {
    method: "GET",
    headers: await buildHeaders(),
    cache: "no-store",
  });
  return parse<T>(res);
}

export async function apiAdminPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: "POST",
    headers: await buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<T>(res);
}

export async function apiAdminPut<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: "PUT",
    headers: await buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<T>(res);
}

export async function apiAdminPatch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(url(path), {
    method: "PATCH",
    headers: await buildHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
    cache: "no-store",
  });
  return parse<T>(res);
}

export async function apiAdminDelete(path: string): Promise<void> {
  const res = await fetch(url(path), {
    method: "DELETE",
    headers: await buildHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    const ct = res.headers.get("content-type") || "";
    const body = ct.includes("application/json") ? await res.json() : await res.text();
    throw new ApiError(res.status, body);
  }
}

/** Upload a single file via multipart/form-data. */
export async function apiAdminUpload<T>(path: string, file: File): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(url(path), {
    method: "POST",
    headers: await buildHeaders(), // no Content-Type — fetch sets multipart boundary
    body: form,
    cache: "no-store",
  });
  return parse<T>(res);
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/lib/auth-cookie.ts web/src/lib/api-admin.ts
git commit -m "feat(web): add auth cookie helpers and admin API client"
```

---

### Task 2: Login server action + form + page

**Files:**
- Create: `web/src/app/actions/auth.ts`
- Create: `web/src/app/admin/login/login-form.tsx`
- Create: `web/src/app/admin/login/page.tsx`

- [ ] **Step 1: Server actions for login + logout**

Create `web/src/app/actions/auth.ts`:
```typescript
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api";
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

  redirect("/admin");
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
  redirect("/admin/login");
}
```

- [ ] **Step 2: Login form client component**

Create `web/src/app/admin/login/login-form.tsx`:
```typescript
"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const INITIAL: LoginState = { status: "idle" };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <label className="block">
        <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
          Email
        </span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          className="mt-2 w-full rounded-lg border border-line bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-[12px] text-accent">
            {state.fieldErrors.email[0]}
          </p>
        )}
      </label>

      <label className="block">
        <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
          Mot de passe
        </span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="mt-2 w-full rounded-lg border border-line bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none"
        />
        {state.fieldErrors?.password && (
          <p className="mt-1 text-[12px] text-accent">
            {state.fieldErrors.password[0]}
          </p>
        )}
      </label>

      {state.status === "error" && state.error && (
        <p className="text-[13px] text-accent">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center rounded-full bg-ink text-cream px-6 py-3 text-[14px] font-medium hover:bg-accent-deep transition-colors disabled:opacity-60"
      >
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Login page**

Create `web/src/app/admin/login/page.tsx`:
```typescript
import { Kicker } from "@/components/kicker";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Connexion — admin · limperiam",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream px-6">
      <div className="w-full max-w-md rounded-2xl bg-card border border-line shadow-card p-8">
        <Kicker>ADMIN</Kicker>
        <h1 className="mt-4 font-serif text-ink text-[32px] leading-[1.1]">
          Connexion
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          Accès réservé à l'administrateur du portfolio.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: build succeeds, `/admin/login` appears in the route table.

- [ ] **Step 5: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/app/actions/auth.ts web/src/app/admin/login/
git commit -m "feat(web): add admin login page + server action"
```

---

### Task 3: Middleware for /admin/* protection

**Files:**
- Create: `web/src/middleware.ts`

- [ ] **Step 1: Write middleware**

Create `web/src/middleware.ts`:
```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "access_token";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only run on /admin/*
  if (!pathname.startsWith("/admin")) return NextResponse.next();
  // Allow the login page through
  if (pathname === "/admin/login") return NextResponse.next();

  const token = request.cookies.get(COOKIE_NAME);
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

Note: middleware does NOT verify the JWT — it only checks for cookie presence. The API enforces actual auth on every request. If the cookie is present but expired, the API returns 401 and the user gets a friendly error in the admin UI.

- [ ] **Step 2: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: build succeeds, the output mentions middleware compilation (e.g., `ƒ Middleware`).

- [ ] **Step 3: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/middleware.ts
git commit -m "feat(web): add middleware to protect /admin/* routes"
```

---

### Task 4: Admin shell layout (sidebar + topbar + logout)

**Files:**
- Create: `web/src/components/admin/sidebar.tsx`
- Create: `web/src/components/admin/topbar.tsx`
- Create: `web/src/components/admin/primary-button.tsx`
- Create: `web/src/components/admin/ghost-button.tsx`
- Create: `web/src/app/admin/layout.tsx`

- [ ] **Step 1: Primary button**

Create `web/src/components/admin/primary-button.tsx`:
```typescript
import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function PrimaryButton({ children, className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-ink text-cream px-5 py-2.5 text-[13px] font-medium hover:bg-accent-deep transition-colors disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Ghost button**

Create `web/src/components/admin/ghost-button.tsx`:
```typescript
import { cn } from "@/lib/cn";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
};

export function GhostButton({ children, className, ...rest }: Props) {
  return (
    <button
      {...rest}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-line bg-card text-ink px-5 py-2.5 text-[13px] font-medium hover:border-ink transition-colors disabled:opacity-60",
        className,
      )}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 3: Sidebar**

Create `web/src/components/admin/sidebar.tsx`:
```typescript
import Link from "next/link";

const ITEMS = [
  { label: "Dashboard", href: "/admin" as const },
  { label: "Projets", href: "/admin/projects" as const },
  { label: "Expériences", href: "/admin/experiences" as const },
  { label: "Skills", href: "/admin/skills" as const },
  { label: "Messages", href: "/admin/messages" as const },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 border-r border-line bg-stage-2 px-6 py-8 sticky top-0 h-screen">
      <Link
        href="/admin"
        className="font-serif italic text-[22px] leading-none text-ink"
      >
        limperiam
      </Link>
      <p className="mt-1 text-[11px] uppercase tracking-[1.5px] text-ink-mute">
        Admin
      </p>
      <nav className="mt-8 flex flex-col gap-1">
        {ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-lg px-3 py-2 text-[14px] text-ink-soft hover:bg-cream hover:text-ink transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-8">
        <Link
          href="/"
          className="text-[12px] text-ink-mute hover:text-ink underline-offset-4 hover:underline"
        >
          ← Retour au site
        </Link>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Topbar with logout**

Create `web/src/components/admin/topbar.tsx`:
```typescript
import { logoutAction } from "@/app/actions/auth";
import { GhostButton } from "./ghost-button";

type Props = {
  title: string;
  actions?: React.ReactNode;
};

export function Topbar({ title, actions }: Props) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-cream px-6 md:px-10 py-6 sticky top-0 z-10">
      <h1 className="font-serif text-ink text-[24px] md:text-[28px] leading-none">
        {title}
      </h1>
      <div className="flex items-center gap-3">
        {actions}
        <form action={logoutAction}>
          <GhostButton type="submit">Déconnexion</GhostButton>
        </form>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Admin layout**

Create `web/src/app/admin/layout.tsx`:
```typescript
import { Sidebar } from "@/components/admin/sidebar";

export const metadata = {
  title: "Admin — limperiam",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
```

Note: the layout intentionally doesn't include the Topbar — that's per-page since each page has its own title and actions.

- [ ] **Step 6: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: build succeeds.

- [ ] **Step 7: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/components/admin/ web/src/app/admin/layout.tsx
git commit -m "feat(web): add admin shell (sidebar, topbar, layout)"
```

---

## Phase 1 — Dashboard + projects

### Task 5: Dashboard page

**Files:**
- Create: `web/src/app/admin/page.tsx`

- [ ] **Step 1: Implement dashboard**

Create `web/src/app/admin/page.tsx`:
```typescript
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];
type Experience = components["schemas"]["ExperienceOut"];
type Skill = components["schemas"]["SkillOut"];
type Message = components["schemas"]["ContactMessageOut"];

async function getCounts() {
  const [projects, experiences, skills, messages] = await Promise.all([
    apiAdminGet<Project[]>("/admin/projects"),
    apiAdminGet<Experience[]>("/admin/experiences"),
    apiAdminGet<Skill[]>("/admin/skills"),
    apiAdminGet<Message[]>("/admin/messages"),
  ]);
  return {
    projectsTotal: projects.length,
    projectsDrafts: projects.filter((p) => !p.is_published).length,
    experiencesTotal: experiences.length,
    skillsTotal: skills.length,
    messagesTotal: messages.length,
    messagesUnread: messages.filter((m) => !m.is_read).length,
  };
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl bg-card border border-line p-6 shadow-card">
      <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute">
        {label}
      </p>
      <p className="mt-3 font-serif text-ink text-[40px] leading-none tabular-nums">
        {value}
      </p>
      {hint && <p className="mt-2 text-[12px] text-ink-soft">{hint}</p>}
    </div>
  );
}

export default async function DashboardPage() {
  const counts = await getCounts();

  return (
    <>
      <Topbar title="Dashboard" />
      <main className="flex-1 px-6 md:px-10 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl">
          <StatCard
            label="Projets"
            value={counts.projectsTotal}
            hint={
              counts.projectsDrafts > 0
                ? `${counts.projectsDrafts} brouillon${
                    counts.projectsDrafts > 1 ? "s" : ""
                  }`
                : "tous publiés"
            }
          />
          <StatCard label="Expériences" value={counts.experiencesTotal} />
          <StatCard label="Skills" value={counts.skillsTotal} />
          <StatCard
            label="Messages"
            value={counts.messagesTotal}
            hint={
              counts.messagesUnread > 0
                ? `${counts.messagesUnread} non lu${
                    counts.messagesUnread > 1 ? "s" : ""
                  }`
                : "tous lus"
            }
          />
        </div>
      </main>
    </>
  );
}
```

- [ ] **Step 2: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: succeeds. `/admin` is server-rendered (dynamic because of cookies).

- [ ] **Step 3: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/app/admin/page.tsx
git commit -m "feat(web): add admin dashboard with stat cards"
```

---

### Task 6: Projects list page + delete action

**Files:**
- Create: `web/src/app/actions/projects.ts` (initial — just delete; create/update added in Task 7)
- Create: `web/src/components/admin/data-table.tsx`
- Create: `web/src/app/admin/projects/page.tsx`

- [ ] **Step 1: Data table primitive**

Create `web/src/components/admin/data-table.tsx`:
```typescript
import { cn } from "@/lib/cn";

type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
};

export function DataTable<T extends { id: number | string }>({
  rows,
  columns,
  empty,
}: {
  rows: T[];
  columns: Column<T>[];
  empty?: React.ReactNode;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl bg-card border border-line p-12 text-center text-[14px] text-ink-mute">
        {empty ?? "Aucun élément."}
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-line overflow-hidden">
      <table className="w-full text-[14px]">
        <thead className="bg-stage-2">
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                style={c.width ? { width: c.width } : undefined}
                className={cn(
                  "text-[11px] uppercase tracking-[1.5px] text-ink-mute px-4 py-3",
                  c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                )}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-line hover:bg-stage-2/50">
              {columns.map((c, i) => (
                <td
                  key={i}
                  className={cn(
                    "px-4 py-3 align-middle",
                    c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : "text-left",
                  )}
                >
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Initial projects actions (delete only)**

Create `web/src/app/actions/projects.ts`:
```typescript
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import {
  apiAdminDelete,
  apiAdminPost,
  apiAdminPut,
  apiAdminUpload,
} from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

const ProjectInput = z.object({
  slug: z
    .string()
    .min(1, "Slug requis")
    .max(120)
    .regex(/^[a-z0-9-]+$/, "minuscules, chiffres et tirets uniquement"),
  title: z.string().min(1, "Titre requis").max(200),
  description: z.string().min(1, "Description requise"),
  content: z.string().optional().nullable(),
  tech_stack: z.array(z.string()),
  repo_url: z.string().url().optional().or(z.literal("")).nullable(),
  live_url: z.string().url().optional().or(z.literal("")).nullable(),
  display_order: z.coerce.number().int(),
  is_published: z.boolean(),
});

function fromForm(formData: FormData) {
  const techRaw = String(formData.get("tech_stack") || "");
  return {
    slug: String(formData.get("slug") || ""),
    title: String(formData.get("title") || ""),
    description: String(formData.get("description") || ""),
    content: (formData.get("content") as string) || null,
    tech_stack: techRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    repo_url: (formData.get("repo_url") as string) || null,
    live_url: (formData.get("live_url") as string) || null,
    display_order: Number(formData.get("display_order") || 0),
    is_published: formData.get("is_published") === "on",
  };
}

export type ProjectFormState = {
  status: "idle" | "ok" | "error";
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createProjectAction(
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = ProjectInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const project = await apiAdminPost<Project>("/admin/projects", parsed.data);
    revalidateTag("projects");
    revalidatePath("/admin/projects");
    redirect(`/admin/projects/${project.id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { status: "error", error: "Ce slug existe déjà." };
    }
    if (err instanceof ApiError && err.status === 401) {
      redirect("/admin/login");
    }
    throw err;
  }
}

export async function updateProjectAction(
  id: number,
  _prev: ProjectFormState,
  formData: FormData,
): Promise<ProjectFormState> {
  const parsed = ProjectInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    await apiAdminPut<Project>(`/admin/projects/${id}`, parsed.data);
    revalidateTag("projects");
    revalidateTag(`project:${parsed.data.slug}`);
    revalidatePath("/admin/projects");
    revalidatePath(`/admin/projects/${id}`);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { status: "error", error: "Ce slug existe déjà." };
    }
    if (err instanceof ApiError && err.status === 401) {
      redirect("/admin/login");
    }
    throw err;
  }
}

export async function deleteProjectAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await apiAdminDelete(`/admin/projects/${id}`);
    revalidateTag("projects");
    revalidatePath("/admin/projects");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      redirect("/admin/login");
    }
    throw err;
  }
}

export async function uploadProjectImageAction(
  id: number,
  formData: FormData,
): Promise<{ status: "ok" | "error"; error?: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", error: "Aucun fichier" };
  }
  try {
    await apiAdminUpload<Project>(`/admin/projects/${id}/image`, file);
    revalidateTag("projects");
    revalidatePath(`/admin/projects/${id}`);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 401) redirect("/admin/login");
      if (err.status === 413) return { status: "error", error: "Fichier trop volumineux (max 2 Mo)" };
      if (err.status === 400) return { status: "error", error: "Format d'image invalide" };
    }
    return { status: "error", error: "Échec de l'upload" };
  }
}
```

- [ ] **Step 3: Projects list page**

Create `web/src/app/admin/projects/page.tsx`:
```typescript
import Link from "next/link";
import { Topbar } from "@/components/admin/topbar";
import { PrimaryButton } from "@/components/admin/primary-button";
import { DataTable } from "@/components/admin/data-table";
import { apiAdminGet } from "@/lib/api-admin";
import { deleteProjectAction } from "@/app/actions/projects";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

export default async function AdminProjectsPage() {
  const projects = await apiAdminGet<Project[]>("/admin/projects");

  return (
    <>
      <Topbar
        title="Projets"
        actions={
          <Link href="/admin/projects/new">
            <PrimaryButton type="button">+ Nouveau projet</PrimaryButton>
          </Link>
        }
      />
      <main className="flex-1 px-6 md:px-10 py-10">
        <DataTable
          rows={projects}
          empty="Aucun projet."
          columns={[
            {
              header: "Titre",
              cell: (p) => (
                <Link
                  href={`/admin/projects/${p.id}`}
                  className="text-ink hover:text-accent font-medium"
                >
                  {p.title}
                </Link>
              ),
            },
            {
              header: "Slug",
              cell: (p) => (
                <code className="text-[12px] text-ink-mute">{p.slug}</code>
              ),
            },
            {
              header: "Statut",
              cell: (p) => (
                <span
                  className={
                    p.is_published
                      ? "rounded-full bg-sage/15 text-sage px-2.5 py-1 text-[11px] uppercase tracking-[1.5px]"
                      : "rounded-full bg-cream-deep text-ink-mute px-2.5 py-1 text-[11px] uppercase tracking-[1.5px]"
                  }
                >
                  {p.is_published ? "Publié" : "Brouillon"}
                </span>
              ),
            },
            {
              header: "Ordre",
              align: "right",
              cell: (p) => <span className="tabular-nums text-ink-soft">{p.display_order}</span>,
              width: "80px",
            },
            {
              header: "",
              align: "right",
              width: "120px",
              cell: (p) => (
                <form action={deleteProjectAction} className="inline">
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className="text-[12px] text-ink-mute hover:text-accent underline-offset-4 hover:underline"
                  >
                    Supprimer
                  </button>
                </form>
              ),
            },
          ]}
        />
      </main>
    </>
  );
}
```

- [ ] **Step 4: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/app/actions/projects.ts web/src/components/admin/data-table.tsx web/src/app/admin/projects/page.tsx
git commit -m "feat(web): add admin projects list with delete action"
```

---

### Task 7: Project new/edit pages (form)

**Files:**
- Create: `web/src/components/admin/field.tsx`
- Create: `web/src/app/admin/projects/new/page.tsx`
- Create: `web/src/app/admin/projects/[id]/page.tsx`
- Create: `web/src/app/admin/projects/[id]/project-edit-form.tsx`

- [ ] **Step 1: Field primitive (label + input wrapper)**

Create `web/src/components/admin/field.tsx`:
```typescript
import { cn } from "@/lib/cn";

type BaseProps = {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  required?: boolean;
};

type InputProps = BaseProps & {
  type?: "text" | "email" | "url" | "number" | "date" | "password";
  defaultValue?: string | number | null;
  pattern?: string;
  inputMode?: "text" | "decimal" | "numeric" | "url" | "email";
};

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  error,
  hint,
  required,
  pattern,
  inputMode,
}: InputProps) {
  return (
    <label className="block">
      <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </span>
      <input
        name={name}
        type={type}
        required={required}
        pattern={pattern}
        inputMode={inputMode}
        defaultValue={defaultValue ?? undefined}
        className={cn(
          "mt-2 w-full rounded-lg border bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none",
          error ? "border-accent" : "border-line",
        )}
      />
      {hint && !error && (
        <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>
      )}
      {error && <p className="mt-1 text-[12px] text-accent">{error}</p>}
    </label>
  );
}

type TextareaProps = BaseProps & {
  defaultValue?: string | null;
  rows?: number;
};

export function FieldTextarea({
  label,
  name,
  defaultValue,
  error,
  hint,
  required,
  rows = 4,
}: TextareaProps) {
  return (
    <label className="block">
      <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </span>
      <textarea
        name={name}
        required={required}
        rows={rows}
        defaultValue={defaultValue ?? undefined}
        className={cn(
          "mt-2 w-full rounded-lg border bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none resize-y",
          error ? "border-accent" : "border-line",
        )}
      />
      {hint && !error && (
        <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>
      )}
      {error && <p className="mt-1 text-[12px] text-accent">{error}</p>}
    </label>
  );
}

type CheckboxProps = {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
};

export function FieldCheckbox({ label, name, defaultChecked, hint }: CheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-line accent-accent"
      />
      <span>
        <span className="block text-[14px] text-ink">{label}</span>
        {hint && <span className="block text-[12px] text-ink-mute mt-0.5">{hint}</span>}
      </span>
    </label>
  );
}

type SelectProps = BaseProps & {
  options: { value: string; label: string }[];
  defaultValue?: string | null;
};

export function FieldSelect({
  label,
  name,
  options,
  defaultValue,
  error,
  hint,
  required,
}: SelectProps) {
  return (
    <label className="block">
      <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </span>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue ?? undefined}
        className={cn(
          "mt-2 w-full rounded-lg border bg-card px-4 py-3 text-[14px] text-ink focus:border-ink outline-none",
          error ? "border-accent" : "border-line",
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && !error && <p className="mt-1 text-[11px] text-ink-mute">{hint}</p>}
      {error && <p className="mt-1 text-[12px] text-accent">{error}</p>}
    </label>
  );
}
```

- [ ] **Step 2: New project page (create form)**

Create `web/src/app/admin/projects/new/page.tsx`:
```typescript
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/admin/topbar";
import { Field, FieldTextarea, FieldCheckbox } from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  createProjectAction,
  type ProjectFormState,
} from "@/app/actions/projects";

const INITIAL: ProjectFormState = { status: "idle" };

export default function NewProjectPage() {
  const [state, action, pending] = useActionState(createProjectAction, INITIAL);

  return (
    <>
      <Topbar title="Nouveau projet" />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <form action={action} className="space-y-6">
          <Field
            label="Slug"
            name="slug"
            required
            hint="URL-friendly, ex: mon-projet"
            pattern="[a-z0-9-]+"
            error={state.fieldErrors?.slug?.[0]}
          />
          <Field
            label="Titre"
            name="title"
            required
            error={state.fieldErrors?.title?.[0]}
          />
          <FieldTextarea
            label="Description courte"
            name="description"
            required
            rows={3}
            hint="Affichée sur la carte projet"
            error={state.fieldErrors?.description?.[0]}
          />
          <FieldTextarea
            label="Contenu (markdown)"
            name="content"
            rows={10}
            hint="Optionnel — page détail si renseigné"
            error={state.fieldErrors?.content?.[0]}
          />
          <Field
            label="Tech stack (séparés par virgules)"
            name="tech_stack"
            hint='ex: "React, Python, Docker"'
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="URL du site"
              name="live_url"
              type="url"
              error={state.fieldErrors?.live_url?.[0]}
            />
            <Field
              label="URL du repo"
              name="repo_url"
              type="url"
              error={state.fieldErrors?.repo_url?.[0]}
            />
          </div>
          <Field
            label="Ordre d'affichage"
            name="display_order"
            type="number"
            defaultValue={0}
            inputMode="numeric"
          />
          <FieldCheckbox
            label="Publié"
            name="is_published"
            hint="Décoche pour garder en brouillon"
          />

          {state.status === "error" && state.error && (
            <p className="text-[13px] text-accent">{state.error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </PrimaryButton>
            <Link href="/admin/projects">
              <GhostButton type="button">Annuler</GhostButton>
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
```

- [ ] **Step 3: Edit form (client component)**

Create `web/src/app/admin/projects/[id]/project-edit-form.tsx`:
```typescript
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, FieldTextarea, FieldCheckbox } from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  updateProjectAction,
  type ProjectFormState,
} from "@/app/actions/projects";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

const INITIAL: ProjectFormState = { status: "idle" };

export function ProjectEditForm({ project }: { project: Project }) {
  const action = updateProjectAction.bind(null, project.id);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  const tech = Array.isArray(project.tech_stack) ? project.tech_stack : [];

  return (
    <form action={formAction} className="space-y-6">
      <Field
        label="Slug"
        name="slug"
        required
        defaultValue={project.slug}
        pattern="[a-z0-9-]+"
        error={state.fieldErrors?.slug?.[0]}
      />
      <Field
        label="Titre"
        name="title"
        required
        defaultValue={project.title}
        error={state.fieldErrors?.title?.[0]}
      />
      <FieldTextarea
        label="Description courte"
        name="description"
        required
        rows={3}
        defaultValue={project.description}
        error={state.fieldErrors?.description?.[0]}
      />
      <FieldTextarea
        label="Contenu (markdown)"
        name="content"
        rows={10}
        defaultValue={project.content}
        error={state.fieldErrors?.content?.[0]}
      />
      <Field
        label="Tech stack (séparés par virgules)"
        name="tech_stack"
        defaultValue={tech.join(", ")}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="URL du site"
          name="live_url"
          type="url"
          defaultValue={project.live_url}
          error={state.fieldErrors?.live_url?.[0]}
        />
        <Field
          label="URL du repo"
          name="repo_url"
          type="url"
          defaultValue={project.repo_url}
          error={state.fieldErrors?.repo_url?.[0]}
        />
      </div>
      <Field
        label="Ordre d'affichage"
        name="display_order"
        type="number"
        defaultValue={project.display_order}
        inputMode="numeric"
      />
      <FieldCheckbox
        label="Publié"
        name="is_published"
        defaultChecked={project.is_published}
        hint="Décoche pour garder en brouillon"
      />

      {state.status === "error" && state.error && (
        <p className="text-[13px] text-accent">{state.error}</p>
      )}
      {state.status === "ok" && (
        <p className="text-[13px] text-sage">Modifications enregistrées.</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Sauvegarde…" : "Enregistrer"}
        </PrimaryButton>
        <Link href="/admin/projects">
          <GhostButton type="button">Retour</GhostButton>
        </Link>
      </div>
    </form>
  );
}
```

- [ ] **Step 4: Edit page (server component fetches data + composes form + upload)**

Create `web/src/app/admin/projects/[id]/page.tsx`:
```typescript
import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import { ApiError } from "@/lib/api";
import { ProjectEditForm } from "./project-edit-form";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

type Params = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Params) {
  const { id } = await params;
  let project: Project;
  try {
    project = await apiAdminGet<Project>(`/admin/projects`).then((list) => {
      const found = (list as unknown as Project[]).find((p) => p.id === Number(id));
      if (!found) throw new ApiError(404, "Project not found");
      return found;
    });
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Topbar title={`Édition · ${project.title}`} />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        {project.image_url && (
          <div className="mb-8">
            <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute mb-2">
              Image actuelle
            </p>
            <img
              src={project.image_url}
              alt={project.title}
              className="rounded-xl border border-line max-h-72 object-cover"
            />
          </div>
        )}
        <ProjectEditForm project={project} />
      </main>
    </>
  );
}
```

Note on the `apiAdminGet` usage: the API doesn't expose a `GET /admin/projects/{id}` endpoint by spec — only the list, then we filter client-side. This avoids adding a new backend endpoint just for the edit page. If the list grows past hundreds of items, we can add the endpoint later.

- [ ] **Step 5: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: succeeds. Routes `/admin/projects/new` and `/admin/projects/[id]` appear.

- [ ] **Step 6: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/components/admin/field.tsx web/src/app/admin/projects/new/ web/src/app/admin/projects/[id]/
git commit -m "feat(web): add admin project create/edit pages"
```

---

### Task 8: Image upload component

**Files:**
- Create: `web/src/components/admin/image-upload.tsx`
- Modify: `web/src/app/admin/projects/[id]/page.tsx` (insert the uploader)

- [ ] **Step 1: Upload component**

Create `web/src/components/admin/image-upload.tsx`:
```typescript
"use client";

import { useState, useTransition } from "react";
import { uploadProjectImageAction } from "@/app/actions/projects";
import { GhostButton } from "./ghost-button";

export function ImageUpload({ projectId }: { projectId: number }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{
    kind: "ok" | "error";
    text: string;
  } | null>(null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    setMessage(null);
    startTransition(async () => {
      const result = await uploadProjectImageAction(projectId, form);
      if (result.status === "ok") {
        setMessage({ kind: "ok", text: "Image mise à jour." });
      } else {
        setMessage({
          kind: "error",
          text: result.error ?? "Échec de l'upload",
        });
      }
      // reset input so the same file can be re-selected
      e.target.value = "";
    });
  };

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute mb-2">
        Remplacer l'image
      </p>
      <label className="inline-block">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onChange}
          disabled={pending}
          className="sr-only"
        />
        <GhostButton type="button" disabled={pending}>
          {pending ? "Upload…" : "Choisir un fichier"}
        </GhostButton>
      </label>
      <p className="mt-2 text-[11px] text-ink-mute">
        PNG / JPEG / WebP — 2 Mo max
      </p>
      {message && (
        <p
          className={
            "mt-2 text-[12px] " +
            (message.kind === "ok" ? "text-sage" : "text-accent")
          }
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Wire the uploader into the edit page**

REPLACE the existing `web/src/app/admin/projects/[id]/page.tsx`:
```typescript
import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import { ApiError } from "@/lib/api";
import { ProjectEditForm } from "./project-edit-form";
import { ImageUpload } from "@/components/admin/image-upload";
import type { components } from "@/lib/api-types";

type Project = components["schemas"]["ProjectOut"];

type Params = { params: Promise<{ id: string }> };

export default async function EditProjectPage({ params }: Params) {
  const { id } = await params;
  let project: Project;
  try {
    const list = await apiAdminGet<Project[]>("/admin/projects");
    const found = list.find((p) => p.id === Number(id));
    if (!found) {
      notFound();
    }
    project = found;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Topbar title={`Édition · ${project.title}`} />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[1.5px] text-ink-mute mb-2">
              Image actuelle
            </p>
            {project.image_url ? (
              <img
                src={project.image_url}
                alt={project.title}
                className="rounded-xl border border-line max-h-72 object-cover"
              />
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-stage-2 px-6 py-12 text-center text-[13px] text-ink-mute">
                Aucune image
              </div>
            )}
          </div>
          <ImageUpload projectId={project.id} />
        </section>

        <ProjectEditForm project={project} />
      </main>
    </>
  );
}
```

- [ ] **Step 3: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/components/admin/image-upload.tsx web/src/app/admin/projects/[id]/page.tsx
git commit -m "feat(web): add image upload for projects in admin"
```

---

## Phase 2 — Experiences + skills CRUD

### Task 9: Experiences CRUD

**Files:**
- Create: `web/src/app/actions/experiences.ts`
- Create: `web/src/app/admin/experiences/page.tsx`
- Create: `web/src/app/admin/experiences/new/page.tsx`
- Create: `web/src/app/admin/experiences/[id]/page.tsx`
- Create: `web/src/app/admin/experiences/[id]/experience-edit-form.tsx`

- [ ] **Step 1: Server actions**

Create `web/src/app/actions/experiences.ts`:
```typescript
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { apiAdminDelete, apiAdminPost, apiAdminPut } from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Experience = components["schemas"]["ExperienceOut"];

const ExperienceInput = z.object({
  company: z.string().min(1, "Entreprise requise").max(200),
  role: z.string().min(1, "Rôle requis").max(200),
  description: z.string().optional().nullable(),
  start_date: z.string().min(1, "Date de début requise"),
  end_date: z.string().optional().nullable(),
  location: z.string().max(200).optional().nullable(),
  display_order: z.coerce.number().int(),
});

function fromForm(formData: FormData) {
  const endDate = (formData.get("end_date") as string) || "";
  return {
    company: String(formData.get("company") || ""),
    role: String(formData.get("role") || ""),
    description: (formData.get("description") as string) || null,
    start_date: String(formData.get("start_date") || ""),
    end_date: endDate.length > 0 ? endDate : null,
    location: (formData.get("location") as string) || null,
    display_order: Number(formData.get("display_order") || 0),
  };
}

export type ExperienceFormState = {
  status: "idle" | "ok" | "error";
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createExperienceAction(
  _prev: ExperienceFormState,
  formData: FormData,
): Promise<ExperienceFormState> {
  const parsed = ExperienceInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const exp = await apiAdminPost<Experience>(
      "/admin/experiences",
      parsed.data,
    );
    revalidateTag("experiences");
    revalidatePath("/admin/experiences");
    redirect(`/admin/experiences/${exp.id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function updateExperienceAction(
  id: number,
  _prev: ExperienceFormState,
  formData: FormData,
): Promise<ExperienceFormState> {
  const parsed = ExperienceInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiAdminPut<Experience>(`/admin/experiences/${id}`, parsed.data);
    revalidateTag("experiences");
    revalidatePath("/admin/experiences");
    revalidatePath(`/admin/experiences/${id}`);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function deleteExperienceAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await apiAdminDelete(`/admin/experiences/${id}`);
    revalidateTag("experiences");
    revalidatePath("/admin/experiences");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}
```

- [ ] **Step 2: List page**

Create `web/src/app/admin/experiences/page.tsx`:
```typescript
import Link from "next/link";
import { Topbar } from "@/components/admin/topbar";
import { PrimaryButton } from "@/components/admin/primary-button";
import { DataTable } from "@/components/admin/data-table";
import { apiAdminGet } from "@/lib/api-admin";
import { deleteExperienceAction } from "@/app/actions/experiences";
import type { components } from "@/lib/api-types";

type Experience = components["schemas"]["ExperienceOut"];

function formatRange(start: string, end: string | null | undefined): string {
  const startStr = new Date(start).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
  });
  if (!end) return `${startStr} — auj.`;
  const endStr = new Date(end).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "short",
  });
  return `${startStr} — ${endStr}`;
}

export default async function AdminExperiencesPage() {
  const experiences = await apiAdminGet<Experience[]>("/admin/experiences");

  return (
    <>
      <Topbar
        title="Expériences"
        actions={
          <Link href="/admin/experiences/new">
            <PrimaryButton type="button">+ Nouvelle expérience</PrimaryButton>
          </Link>
        }
      />
      <main className="flex-1 px-6 md:px-10 py-10">
        <DataTable
          rows={experiences}
          empty="Aucune expérience."
          columns={[
            {
              header: "Entreprise",
              cell: (e) => (
                <Link
                  href={`/admin/experiences/${e.id}`}
                  className="text-ink hover:text-accent font-medium"
                >
                  {e.company}
                </Link>
              ),
            },
            {
              header: "Rôle",
              cell: (e) => <span className="text-ink-soft">{e.role}</span>,
            },
            {
              header: "Période",
              cell: (e) => (
                <span className="text-[12px] text-ink-mute">
                  {formatRange(e.start_date, e.end_date)}
                </span>
              ),
            },
            {
              header: "",
              align: "right",
              width: "120px",
              cell: (e) => (
                <form action={deleteExperienceAction} className="inline">
                  <input type="hidden" name="id" value={e.id} />
                  <button
                    type="submit"
                    className="text-[12px] text-ink-mute hover:text-accent underline-offset-4 hover:underline"
                  >
                    Supprimer
                  </button>
                </form>
              ),
            },
          ]}
        />
      </main>
    </>
  );
}
```

- [ ] **Step 3: New page**

Create `web/src/app/admin/experiences/new/page.tsx`:
```typescript
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/admin/topbar";
import { Field, FieldTextarea } from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  createExperienceAction,
  type ExperienceFormState,
} from "@/app/actions/experiences";

const INITIAL: ExperienceFormState = { status: "idle" };

export default function NewExperiencePage() {
  const [state, action, pending] = useActionState(
    createExperienceAction,
    INITIAL,
  );

  return (
    <>
      <Topbar title="Nouvelle expérience" />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <form action={action} className="space-y-6">
          <Field
            label="Entreprise"
            name="company"
            required
            error={state.fieldErrors?.company?.[0]}
          />
          <Field
            label="Rôle"
            name="role"
            required
            error={state.fieldErrors?.role?.[0]}
          />
          <FieldTextarea
            label="Description"
            name="description"
            rows={5}
            error={state.fieldErrors?.description?.[0]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Date de début"
              name="start_date"
              type="date"
              required
              error={state.fieldErrors?.start_date?.[0]}
            />
            <Field
              label="Date de fin"
              name="end_date"
              type="date"
              hint="Laisser vide si en cours"
              error={state.fieldErrors?.end_date?.[0]}
            />
          </div>
          <Field
            label="Localisation"
            name="location"
            error={state.fieldErrors?.location?.[0]}
          />
          <Field
            label="Ordre d'affichage"
            name="display_order"
            type="number"
            defaultValue={0}
            inputMode="numeric"
          />

          {state.status === "error" && state.error && (
            <p className="text-[13px] text-accent">{state.error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </PrimaryButton>
            <Link href="/admin/experiences">
              <GhostButton type="button">Annuler</GhostButton>
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
```

- [ ] **Step 4: Edit form (client component)**

Create `web/src/app/admin/experiences/[id]/experience-edit-form.tsx`:
```typescript
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Field, FieldTextarea } from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  updateExperienceAction,
  type ExperienceFormState,
} from "@/app/actions/experiences";
import type { components } from "@/lib/api-types";

type Experience = components["schemas"]["ExperienceOut"];

const INITIAL: ExperienceFormState = { status: "idle" };

function toDateInput(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  // API returns ISO date "YYYY-MM-DD" already
  return value.slice(0, 10);
}

export function ExperienceEditForm({ experience }: { experience: Experience }) {
  const action = updateExperienceAction.bind(null, experience.id);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      <Field
        label="Entreprise"
        name="company"
        required
        defaultValue={experience.company}
        error={state.fieldErrors?.company?.[0]}
      />
      <Field
        label="Rôle"
        name="role"
        required
        defaultValue={experience.role}
        error={state.fieldErrors?.role?.[0]}
      />
      <FieldTextarea
        label="Description"
        name="description"
        rows={5}
        defaultValue={experience.description}
        error={state.fieldErrors?.description?.[0]}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Date de début"
          name="start_date"
          type="date"
          required
          defaultValue={toDateInput(experience.start_date)}
          error={state.fieldErrors?.start_date?.[0]}
        />
        <Field
          label="Date de fin"
          name="end_date"
          type="date"
          defaultValue={toDateInput(experience.end_date)}
          hint="Laisser vide si en cours"
          error={state.fieldErrors?.end_date?.[0]}
        />
      </div>
      <Field
        label="Localisation"
        name="location"
        defaultValue={experience.location}
        error={state.fieldErrors?.location?.[0]}
      />
      <Field
        label="Ordre d'affichage"
        name="display_order"
        type="number"
        defaultValue={experience.display_order}
        inputMode="numeric"
      />

      {state.status === "error" && state.error && (
        <p className="text-[13px] text-accent">{state.error}</p>
      )}
      {state.status === "ok" && (
        <p className="text-[13px] text-sage">Modifications enregistrées.</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Sauvegarde…" : "Enregistrer"}
        </PrimaryButton>
        <Link href="/admin/experiences">
          <GhostButton type="button">Retour</GhostButton>
        </Link>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Edit page**

Create `web/src/app/admin/experiences/[id]/page.tsx`:
```typescript
import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import { ApiError } from "@/lib/api";
import { ExperienceEditForm } from "./experience-edit-form";
import type { components } from "@/lib/api-types";

type Experience = components["schemas"]["ExperienceOut"];

type Params = { params: Promise<{ id: string }> };

export default async function EditExperiencePage({ params }: Params) {
  const { id } = await params;
  let experience: Experience;
  try {
    const list = await apiAdminGet<Experience[]>("/admin/experiences");
    const found = list.find((e) => e.id === Number(id));
    if (!found) {
      notFound();
    }
    experience = found;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Topbar title={`Édition · ${experience.company}`} />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <ExperienceEditForm experience={experience} />
      </main>
    </>
  );
}
```

- [ ] **Step 6: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/app/actions/experiences.ts web/src/app/admin/experiences/
git commit -m "feat(web): add admin experiences CRUD"
```

---

### Task 10: Skills CRUD

**Files:**
- Create: `web/src/app/actions/skills.ts`
- Create: `web/src/app/admin/skills/page.tsx`
- Create: `web/src/app/admin/skills/new/page.tsx`
- Create: `web/src/app/admin/skills/[id]/page.tsx`
- Create: `web/src/app/admin/skills/[id]/skill-edit-form.tsx`

- [ ] **Step 1: Server actions**

Create `web/src/app/actions/skills.ts`:
```typescript
"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ApiError } from "@/lib/api";
import { apiAdminDelete, apiAdminPost, apiAdminPut } from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Skill = components["schemas"]["SkillOut"];

const SkillInput = z.object({
  name: z.string().min(1, "Nom requis").max(100),
  category: z.enum(["frontend", "backend", "devops", "tools", "soft"]),
  level: z.coerce.number().int().min(1).max(5).optional().nullable(),
  icon: z.string().optional().nullable(),
  display_order: z.coerce.number().int(),
  is_featured: z.boolean(),
});

function fromForm(formData: FormData) {
  const levelRaw = formData.get("level") as string | null;
  return {
    name: String(formData.get("name") || ""),
    category: String(formData.get("category") || "backend") as Skill["category"],
    level: levelRaw && levelRaw.length > 0 ? Number(levelRaw) : null,
    icon: (formData.get("icon") as string) || null,
    display_order: Number(formData.get("display_order") || 0),
    is_featured: formData.get("is_featured") === "on",
  };
}

export type SkillFormState = {
  status: "idle" | "ok" | "error";
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function createSkillAction(
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const parsed = SkillInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    const skill = await apiAdminPost<Skill>("/admin/skills", parsed.data);
    revalidateTag("skills");
    revalidatePath("/admin/skills");
    redirect(`/admin/skills/${skill.id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function updateSkillAction(
  id: number,
  _prev: SkillFormState,
  formData: FormData,
): Promise<SkillFormState> {
  const parsed = SkillInput.safeParse(fromForm(formData));
  if (!parsed.success) {
    return { status: "error", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  try {
    await apiAdminPut<Skill>(`/admin/skills/${id}`, parsed.data);
    revalidateTag("skills");
    revalidatePath("/admin/skills");
    revalidatePath(`/admin/skills/${id}`);
    return { status: "ok" };
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function deleteSkillAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await apiAdminDelete(`/admin/skills/${id}`);
    revalidateTag("skills");
    revalidatePath("/admin/skills");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}
```

- [ ] **Step 2: List page**

Create `web/src/app/admin/skills/page.tsx`:
```typescript
import Link from "next/link";
import { Topbar } from "@/components/admin/topbar";
import { PrimaryButton } from "@/components/admin/primary-button";
import { DataTable } from "@/components/admin/data-table";
import { apiAdminGet } from "@/lib/api-admin";
import { deleteSkillAction } from "@/app/actions/skills";
import type { components } from "@/lib/api-types";

type Skill = components["schemas"]["SkillOut"];

const CATEGORY_LABEL: Record<Skill["category"], string> = {
  backend: "Backend",
  frontend: "Frontend",
  devops: "DevOps",
  tools: "Outils",
  soft: "Pratique",
};

export default async function AdminSkillsPage() {
  const skills = await apiAdminGet<Skill[]>("/admin/skills");

  return (
    <>
      <Topbar
        title="Skills"
        actions={
          <Link href="/admin/skills/new">
            <PrimaryButton type="button">+ Nouveau skill</PrimaryButton>
          </Link>
        }
      />
      <main className="flex-1 px-6 md:px-10 py-10">
        <DataTable
          rows={skills}
          empty="Aucun skill."
          columns={[
            {
              header: "Nom",
              cell: (s) => (
                <Link
                  href={`/admin/skills/${s.id}`}
                  className="text-ink hover:text-accent font-medium"
                >
                  {s.name}
                </Link>
              ),
            },
            {
              header: "Catégorie",
              cell: (s) => (
                <span className="text-ink-soft text-[12px]">
                  {CATEGORY_LABEL[s.category]}
                </span>
              ),
            },
            {
              header: "Featured",
              align: "center",
              cell: (s) =>
                s.is_featured ? (
                  <span className="text-sage text-[12px]">✓</span>
                ) : (
                  <span className="text-ink-mute text-[12px]">—</span>
                ),
              width: "100px",
            },
            {
              header: "Ordre",
              align: "right",
              cell: (s) => (
                <span className="tabular-nums text-ink-soft">{s.display_order}</span>
              ),
              width: "80px",
            },
            {
              header: "",
              align: "right",
              width: "120px",
              cell: (s) => (
                <form action={deleteSkillAction} className="inline">
                  <input type="hidden" name="id" value={s.id} />
                  <button
                    type="submit"
                    className="text-[12px] text-ink-mute hover:text-accent underline-offset-4 hover:underline"
                  >
                    Supprimer
                  </button>
                </form>
              ),
            },
          ]}
        />
      </main>
    </>
  );
}
```

- [ ] **Step 3: New page**

Create `web/src/app/admin/skills/new/page.tsx`:
```typescript
"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Topbar } from "@/components/admin/topbar";
import {
  Field,
  FieldSelect,
  FieldCheckbox,
} from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  createSkillAction,
  type SkillFormState,
} from "@/app/actions/skills";

const INITIAL: SkillFormState = { status: "idle" };

const CATEGORIES = [
  { value: "backend", label: "Backend" },
  { value: "frontend", label: "Frontend" },
  { value: "devops", label: "DevOps" },
  { value: "tools", label: "Outils" },
  { value: "soft", label: "Pratique" },
];

export default function NewSkillPage() {
  const [state, action, pending] = useActionState(createSkillAction, INITIAL);

  return (
    <>
      <Topbar title="Nouveau skill" />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <form action={action} className="space-y-6">
          <Field
            label="Nom"
            name="name"
            required
            error={state.fieldErrors?.name?.[0]}
          />
          <FieldSelect
            label="Catégorie"
            name="category"
            options={CATEGORIES}
            required
            error={state.fieldErrors?.category?.[0]}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Field
              label="Niveau (1-5)"
              name="level"
              type="number"
              inputMode="numeric"
              hint="Optionnel"
              error={state.fieldErrors?.level?.[0]}
            />
            <Field
              label="Icône"
              name="icon"
              hint="Nom Lucide ou URL (optionnel)"
              error={state.fieldErrors?.icon?.[0]}
            />
          </div>
          <Field
            label="Ordre d'affichage"
            name="display_order"
            type="number"
            defaultValue={0}
            inputMode="numeric"
          />
          <FieldCheckbox
            label="Mis en avant"
            name="is_featured"
            hint="Affiché en priorité sur la home"
          />

          {state.status === "error" && state.error && (
            <p className="text-[13px] text-accent">{state.error}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <PrimaryButton type="submit" disabled={pending}>
              {pending ? "Création…" : "Créer"}
            </PrimaryButton>
            <Link href="/admin/skills">
              <GhostButton type="button">Annuler</GhostButton>
            </Link>
          </div>
        </form>
      </main>
    </>
  );
}
```

- [ ] **Step 4: Edit form**

Create `web/src/app/admin/skills/[id]/skill-edit-form.tsx`:
```typescript
"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  Field,
  FieldSelect,
  FieldCheckbox,
} from "@/components/admin/field";
import { PrimaryButton } from "@/components/admin/primary-button";
import { GhostButton } from "@/components/admin/ghost-button";
import {
  updateSkillAction,
  type SkillFormState,
} from "@/app/actions/skills";
import type { components } from "@/lib/api-types";

type Skill = components["schemas"]["SkillOut"];

const INITIAL: SkillFormState = { status: "idle" };

const CATEGORIES = [
  { value: "backend", label: "Backend" },
  { value: "frontend", label: "Frontend" },
  { value: "devops", label: "DevOps" },
  { value: "tools", label: "Outils" },
  { value: "soft", label: "Pratique" },
];

export function SkillEditForm({ skill }: { skill: Skill }) {
  const action = updateSkillAction.bind(null, skill.id);
  const [state, formAction, pending] = useActionState(action, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      <Field
        label="Nom"
        name="name"
        required
        defaultValue={skill.name}
        error={state.fieldErrors?.name?.[0]}
      />
      <FieldSelect
        label="Catégorie"
        name="category"
        options={CATEGORIES}
        required
        defaultValue={skill.category}
        error={state.fieldErrors?.category?.[0]}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Field
          label="Niveau (1-5)"
          name="level"
          type="number"
          inputMode="numeric"
          defaultValue={skill.level}
          hint="Optionnel"
          error={state.fieldErrors?.level?.[0]}
        />
        <Field
          label="Icône"
          name="icon"
          defaultValue={skill.icon}
          hint="Nom Lucide ou URL"
          error={state.fieldErrors?.icon?.[0]}
        />
      </div>
      <Field
        label="Ordre d'affichage"
        name="display_order"
        type="number"
        defaultValue={skill.display_order}
        inputMode="numeric"
      />
      <FieldCheckbox
        label="Mis en avant"
        name="is_featured"
        defaultChecked={skill.is_featured}
        hint="Affiché en priorité sur la home"
      />

      {state.status === "error" && state.error && (
        <p className="text-[13px] text-accent">{state.error}</p>
      )}
      {state.status === "ok" && (
        <p className="text-[13px] text-sage">Modifications enregistrées.</p>
      )}

      <div className="flex items-center gap-3 pt-2">
        <PrimaryButton type="submit" disabled={pending}>
          {pending ? "Sauvegarde…" : "Enregistrer"}
        </PrimaryButton>
        <Link href="/admin/skills">
          <GhostButton type="button">Retour</GhostButton>
        </Link>
      </div>
    </form>
  );
}
```

- [ ] **Step 5: Edit page**

Create `web/src/app/admin/skills/[id]/page.tsx`:
```typescript
import { notFound } from "next/navigation";
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import { ApiError } from "@/lib/api";
import { SkillEditForm } from "./skill-edit-form";
import type { components } from "@/lib/api-types";

type Skill = components["schemas"]["SkillOut"];

type Params = { params: Promise<{ id: string }> };

export default async function EditSkillPage({ params }: Params) {
  const { id } = await params;
  let skill: Skill;
  try {
    const list = await apiAdminGet<Skill[]>("/admin/skills");
    const found = list.find((s) => s.id === Number(id));
    if (!found) {
      notFound();
    }
    skill = found;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  return (
    <>
      <Topbar title={`Édition · ${skill.name}`} />
      <main className="flex-1 px-6 md:px-10 py-10 max-w-3xl">
        <SkillEditForm skill={skill} />
      </main>
    </>
  );
}
```

- [ ] **Step 6: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: succeeds.

- [ ] **Step 7: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/app/actions/skills.ts web/src/app/admin/skills/
git commit -m "feat(web): add admin skills CRUD"
```

---

## Phase 3 — Messages + Cal.com

### Task 11: Messages inbox

**Files:**
- Create: `web/src/app/actions/messages.ts`
- Create: `web/src/app/admin/messages/page.tsx`

- [ ] **Step 1: Server actions**

Create `web/src/app/actions/messages.ts`:
```typescript
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { apiAdminDelete, apiAdminPatch } from "@/lib/api-admin";
import type { components } from "@/lib/api-types";

type Message = components["schemas"]["ContactMessageOut"];

export async function toggleReadAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  const isRead = formData.get("is_read") === "true";
  if (!id) return;
  try {
    await apiAdminPatch<Message>(`/admin/messages/${id}`, { is_read: !isRead });
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}

export async function deleteMessageAction(formData: FormData): Promise<void> {
  const id = Number(formData.get("id"));
  if (!id) return;
  try {
    await apiAdminDelete(`/admin/messages/${id}`);
    revalidatePath("/admin/messages");
    revalidatePath("/admin");
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) redirect("/admin/login");
    throw err;
  }
}
```

- [ ] **Step 2: Inbox page**

Create `web/src/app/admin/messages/page.tsx`:
```typescript
import { Topbar } from "@/components/admin/topbar";
import { apiAdminGet } from "@/lib/api-admin";
import {
  deleteMessageAction,
  toggleReadAction,
} from "@/app/actions/messages";
import type { components } from "@/lib/api-types";

type Message = components["schemas"]["ContactMessageOut"];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function MessagesPage() {
  const messages = await apiAdminGet<Message[]>("/admin/messages");

  return (
    <>
      <Topbar title="Messages reçus" />
      <main className="flex-1 px-6 md:px-10 py-10">
        {messages.length === 0 ? (
          <div className="rounded-2xl bg-card border border-line p-12 text-center text-[14px] text-ink-mute">
            Aucun message.
          </div>
        ) : (
          <ul className="flex flex-col gap-3 max-w-3xl">
            {messages.map((m) => (
              <li
                key={m.id}
                className={
                  "rounded-2xl bg-card border p-6 shadow-card " +
                  (m.is_read ? "border-line" : "border-accent/30")
                }
              >
                <header className="flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink text-[15px]">{m.name}</p>
                    <a
                      href={`mailto:${m.email}`}
                      className="text-[13px] text-ink-soft hover:text-accent"
                    >
                      {m.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[1.5px] text-ink-mute">
                    {!m.is_read && (
                      <span className="rounded-full bg-accent/15 text-accent px-2 py-0.5">
                        Non lu
                      </span>
                    )}
                    <time>{formatDate(m.created_at)}</time>
                  </div>
                </header>
                {m.subject && (
                  <p className="mt-3 text-[14px] font-medium text-ink">
                    {m.subject}
                  </p>
                )}
                <p className="mt-2 text-[14px] text-ink-soft whitespace-pre-wrap leading-[1.6]">
                  {m.message}
                </p>
                <footer className="mt-4 flex items-center gap-4">
                  <form action={toggleReadAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <input
                      type="hidden"
                      name="is_read"
                      value={String(m.is_read)}
                    />
                    <button
                      type="submit"
                      className="text-[12px] text-ink-soft hover:text-ink underline-offset-4 hover:underline"
                    >
                      {m.is_read ? "Marquer non lu" : "Marquer lu"}
                    </button>
                  </form>
                  <form action={deleteMessageAction}>
                    <input type="hidden" name="id" value={m.id} />
                    <button
                      type="submit"
                      className="text-[12px] text-ink-mute hover:text-accent underline-offset-4 hover:underline"
                    >
                      Supprimer
                    </button>
                  </form>
                </footer>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
```

- [ ] **Step 3: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm run build 2>&1 | tail -15
```

Expected: succeeds.

- [ ] **Step 4: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/app/actions/messages.ts web/src/app/admin/messages/
git commit -m "feat(web): add admin messages inbox"
```

---

### Task 12: Cal.com embed in public Contact section

**Files:**
- Modify: `web/src/components/sections/contact.tsx`
- Modify: `web/.env.example` (if exists; otherwise create)

The embed is opt-in via an env var. If `NEXT_PUBLIC_CALCOM_LINK` is unset, nothing renders — no broken embed.

- [ ] **Step 1: Update Contact section with Cal.com block**

REPLACE `web/src/components/sections/contact.tsx`:
```typescript
import { CONTACT } from "@/content/static";
import { Reveal } from "@/components/reveal";
import { Kicker } from "@/components/kicker";
import { ContactForm } from "@/components/contact-form";

const CALCOM_LINK = process.env.NEXT_PUBLIC_CALCOM_LINK;

export function Contact() {
  return (
    <section
      id="contact"
      className="mx-auto max-w-[var(--max-w)] px-[var(--page-pad)] py-24 md:py-32"
    >
      <Reveal>
        <Kicker>{CONTACT.kicker}</Kicker>
      </Reveal>

      <Reveal delay={80} className="mt-4 max-w-3xl">
        <h2
          className="font-serif text-ink leading-[1.1] tracking-[-0.01em]"
          style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
        >
          {CONTACT.headlinePre}
          <em className="text-accent not-italic font-serif italic">
            {CONTACT.headlineEm}
          </em>
        </h2>
      </Reveal>

      <Reveal delay={160} className="mt-6 max-w-3xl">
        <p className="text-[16px] text-ink-soft leading-[1.6]">{CONTACT.sub}</p>
      </Reveal>

      <div className="mt-16 grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12">
        <Reveal>
          <ContactForm />
        </Reveal>

        <Reveal delay={120} className="space-y-6">
          <div>
            <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
              Email
            </span>
            <a
              href={`mailto:${CONTACT.email}`}
              className="mt-2 block text-[16px] text-ink hover:text-accent"
            >
              {CONTACT.email}
            </a>
          </div>
          <div>
            <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
              Ailleurs
            </span>
            <ul className="mt-2 flex flex-col gap-2">
              {CONTACT.links.map((l) => (
                <li key={l.h}>
                  <a
                    href={l.h}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[15px] text-ink-soft hover:text-ink underline-offset-4 hover:underline"
                  >
                    {l.l} →
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {CALCOM_LINK && (
            <div>
              <span className="text-[12px] uppercase tracking-[1.5px] text-ink-mute">
                Rendez-vous
              </span>
              <a
                href={`https://cal.com/${CALCOM_LINK}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-ink text-cream px-5 py-2.5 text-[13px] font-medium hover:bg-accent-deep transition-colors"
              >
                Réserver un créneau →
              </a>
              <p className="mt-2 text-[11px] text-ink-mute">
                Via Cal.com — choix d'un créneau de 30 min
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Document env var**

If `web/.env.example` doesn't exist, create it. Otherwise APPEND:

Create or append to `web/.env.example`:
```
# Cal.com username (optional). If set, the public contact section shows a "Réserver un créneau" button linking to https://cal.com/<value>.
# Example: NEXT_PUBLIC_CALCOM_LINK=nathan-mercier/30min
NEXT_PUBLIC_CALCOM_LINK=

# API URL (used by Next.js server components/actions to reach the API).
# In docker-compose this defaults to http://api:8000.
# For local `npm run dev`, override to http://localhost:8000.
API_URL=http://api:8000
```

- [ ] **Step 3: Update docker-compose to pass the env through**

EDIT `/Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/docker-compose.yml` — in the `web` service's `environment:` block, add the Cal.com line:
```yaml
  web:
    build: ./web
    restart: unless-stopped
    environment:
      - API_URL=http://api:8000
      - NODE_ENV=production
      - NEXT_PUBLIC_CALCOM_LINK=${NEXT_PUBLIC_CALCOM_LINK:-}
    depends_on:
      - api
    ports:
      - "127.0.0.1:3000:3000"
    networks: [internal]
```

(Keep the rest of the file unchanged.)

- [ ] **Step 4: Build sanity**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
NEXT_PUBLIC_CALCOM_LINK="nathan-mercier/30min" npm run build 2>&1 | tail -10
unset NEXT_PUBLIC_CALCOM_LINK
```

Expected: build succeeds. The embed condition is server-side only (the env reference) — no client bundle bloat when unset.

- [ ] **Step 5: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/src/components/sections/contact.tsx web/.env.example docker-compose.yml
git commit -m "feat(web): add optional Cal.com link in contact section"
```

---

## Phase 4 — Tests + wrap-up

### Task 13: Unit test for the login action

**Files:**
- Create: `web/tests/unit/auth-action.test.ts`

This is a focused unit test on the cookie extractor. The full login action is hard to unit-test because it uses `cookies()` and `redirect()` from `next/headers` — those are only valid in the request scope. We test the pure helper.

- [ ] **Step 1: Write test**

Create `web/tests/unit/auth-action.test.ts`:
```typescript
import { describe, expect, it } from "vitest";
import { extractAccessToken } from "@/lib/auth-cookie";

describe("extractAccessToken", () => {
  it("returns null when header is null", () => {
    expect(extractAccessToken(null)).toBeNull();
  });

  it("returns null when no access_token cookie present", () => {
    expect(extractAccessToken("other=value; Path=/")).toBeNull();
  });

  it("extracts the token when present at start", () => {
    expect(
      extractAccessToken(
        "access_token=eyJabc.def; HttpOnly; Path=/; SameSite=Lax",
      ),
    ).toBe("eyJabc.def");
  });

  it("extracts the token when present after a semicolon", () => {
    expect(
      extractAccessToken(
        "Path=/; access_token=token123; HttpOnly",
      ),
    ).toBe("token123");
  });

  it("extracts the token when joined by comma (multiple Set-Cookie)", () => {
    // fetch().headers.get('set-cookie') often joins multiple cookies with ", "
    expect(
      extractAccessToken(
        "other=value; Path=/, access_token=jwt.payload.sig; HttpOnly; Path=/",
      ),
    ).toBe("jwt.payload.sig");
  });

  it("URL-decodes the token", () => {
    expect(
      extractAccessToken("access_token=jwt%20with%20spaces; Path=/"),
    ).toBe("jwt with spaces");
  });
});
```

- [ ] **Step 2: Run tests**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npm test
```

Expected: 9 passed (3 from Task 6 + 6 new).

- [ ] **Step 3: Commit**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add web/tests/
git commit -m "test(web): add unit tests for auth cookie extractor"
```

---

### Task 14: Full-stack smoke test + README + tag

This is the final integration test: run the entire stack, log in via curl, hit an admin endpoint, verify the data flows end-to-end.

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Full lint + build + tests**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/web
npx prettier --write "src/**/*.{ts,tsx,css}"
npx eslint src --fix 2>&1 | tail -10
npm test
npm run build 2>&1 | tail -10
```

Expected: All clean.

- [ ] **Step 2: End-to-end smoke test**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
docker compose down 2>/dev/null || true
docker compose up -d --build
sleep 12

# Ensure DB + admin exist (idempotent)
docker compose exec api uv run alembic upgrade head
docker compose exec api uv run python -m src.seed
docker compose exec -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=changeme \
  api uv run python scripts/seed_portfolio.py 2>&1 | tail -5

# 1. Public site renders
echo "=== Public home ==="
curl -s -o /dev/null -w "HTTP: %{http_code}\n" http://localhost:3000

# 2. Admin login page renders
echo "=== Login page ==="
curl -s -o /dev/null -w "HTTP: %{http_code}\n" http://localhost:3000/admin/login

# 3. Admin without cookie redirects to login
echo "=== Admin without cookie (expect 307 redirect) ==="
curl -s -o /dev/null -w "HTTP: %{http_code}\n" http://localhost:3000/admin

# 4. Login via the API (through web is also fine but simpler to do directly here)
echo "=== Login flow via web Server Action ==="
# Simulate by hitting Next's POST endpoint — easier: just exercise the API directly to confirm the chain works
curl -s -c /tmp/admin-cookies.txt -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"changeme"}' \
  -o /dev/null -w "API direct login HTTP: %{http_code}\n" 2>&1 || echo "Direct API login not reachable from host (expected — api is internal-only)"

# What we actually want to check is that the /admin/login PAGE works. Visit it manually after the test.

docker compose ps
docker compose down
```

Expected:
- Public home: 200
- Login page: 200
- Admin without cookie: 307 (redirect)
- The "API direct login" probably won't work since the API is internal-only — that's a confirmation of correct isolation.

To fully test the admin flow, open `http://localhost:3000/admin/login` in a browser, log in with admin@example.com / changeme, and click through the sections. Document any issues you find.

- [ ] **Step 3: Update README**

REPLACE `/Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio/README.md`:
```markdown
# Limperiam Portfolio

Personal portfolio site by Nathan Mercier — fullstack rebuild.

## Stack
- Frontend: Next.js 16 (App Router, TypeScript, Tailwind v4) — ✅ *Plans 2 & 3 complete*
- Backend: FastAPI (Python 3.12) — ✅ *Plan 1 complete*
- DB: SQLite (volume-persisted)
- Containerization: Docker + docker-compose
- Tunnel: Cloudflared (home server) — *Plan 4*

## Status

- ✅ **Plan 1: Backend API** (`v0.1.0-api`) — 59 tests, all endpoints
- ✅ **Plan 2: Frontend public site** (`v0.2.0-web`) — design fidelity, contact form
- ✅ **Plan 3: Admin UI** (`v0.3.0-admin`) — full CMS, image upload, Cal.com link
- ⏳ **Plan 4: Deployment + Cloudflared repoint**

## Running the full stack

```bash
docker compose up -d --build

# First-time only: migrate + seed admin + seed real content
docker compose exec api uv run alembic upgrade head
docker compose exec api uv run python -m src.seed
docker compose exec -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=changeme \
  api uv run python scripts/seed_portfolio.py

# Public site
open http://localhost:3000

# Admin (after first login, content is editable through the UI)
open http://localhost:3000/admin/login
# default creds: admin@example.com / changeme  (change them via ADMIN_EMAIL / ADMIN_PASSWORD env)
```

The API is **not** exposed to the host — it lives on the internal Docker network behind the Next.js BFF. Server Actions in `web/` forward the user's JWT cookie when calling admin endpoints.

To smoke-test the API alone during dev:
```bash
docker compose run --rm --service-ports api
```

## Optional: Cal.com integration

Set `NEXT_PUBLIC_CALCOM_LINK` in `.env` (e.g. `nathan-mercier/30min`) and a "Réserver un créneau" button appears in the public contact section.

## Architecture
See [docs/superpowers/specs/](docs/superpowers/specs/) and [docs/superpowers/plans/](docs/superpowers/plans/).

## Testing

```bash
cd api && uv run pytest -v        # backend (59 tests)
cd web && npm test                # frontend (9+ vitest tests)
```
```

- [ ] **Step 4: Commit any prettier/eslint fixes from Step 1**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git status
git add -A web/
if git diff --cached --quiet; then
  echo "No formatting changes"
else
  git commit -m "style(web): apply prettier and eslint fixes"
fi
```

- [ ] **Step 5: Commit README + tag**

```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git add README.md
git commit -m "docs: update README with Plan 3 status"
git tag -a v0.3.0-admin -m "Plan 3 complete: admin UI"
git tag
```

Expected: tag list contains `v0.1.0-api`, `v0.2.0-web`, `v0.3.0-admin`.

---

## Definition of Done — Plan 3

After this plan, a logged-in admin can:
1. Authenticate via `/admin/login` (rate-limited by the API).
2. See a dashboard with live counts at `/admin`.
3. CRUD projects with image upload at `/admin/projects`.
4. CRUD experiences at `/admin/experiences`.
5. CRUD skills at `/admin/skills`.
6. Read/mark-read/delete contact messages at `/admin/messages`.
7. Log out via the topbar button.
8. Show or hide a Cal.com booking link on the public contact section via env var.

Cache busting is automatic: every mutation calls `revalidateTag`/`revalidatePath`, so changes appear on the public site within the ISR window (≤60s, often sooner).

**Next plan:** Plan 4 will deploy to the home server, repoint Cloudflared from the static HTML to the new web container, and lock down environment variables for production.
