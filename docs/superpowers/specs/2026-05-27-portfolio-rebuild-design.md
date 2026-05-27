# Portfolio Rebuild — Design Spec

**Date:** 2026-05-27
**Owner:** Nathan Mercier
**Status:** Approved (pending implementation plan)

## Context

Le portfolio actuel (`Limperiam Portfolio.html`) est un artefact Claude — un bundle React unique de ~1.6 MB compressé en HTML statique, servi via Cloudflare Tunnel depuis un serveur maison. Il fonctionne mais ne permet pas :

- d'ajouter des intégrations tierces facilement (Cal.com, etc.)
- de modifier le contenu sans rebuild manuel
- de recevoir des messages de contact
- de servir d'exercice pédagogique sur une vraie stack moderne

Objectif : reconstruire le projet en stack moderne (Next.js + FastAPI + SQLite + Docker), tout en gardant **une fidélité visuelle 1:1 avec le portfolio HTML existant**.

## Objectifs

1. **Apprentissage** — pratiquer la stack de la prochaine mission (React/Next.js côté front, Python côté back).
2. **Intégrations** — pouvoir brancher facilement Cal.com et autres outils tiers.
3. **Formulaire de contact** — recevoir des messages avec persistance BDD + notification email.
4. **CMS admin** — modifier le contenu visible (projets, expériences, skills) sans toucher au code.
5. **Containerisation** — déploiement reproductible via `docker-compose`, prêt à tourner sur le serveur maison existant.

## Contraintes

### Contrainte forte : fidélité visuelle

**Le design final doit être identique à celui du HTML actuel.** Couleurs (`#f7f5f0` background, `#d85b3d` accent), typographie (Georgia/Times pour les titres, system-font pour le corps), mise en page, animations, espacements — tout doit être conservé. La migration concerne la stack, pas le design.

### Autres contraintes

- L'API FastAPI ne doit **jamais** être exposée publiquement. Seul Next.js l'est, via le tunnel Cloudflare.
- SQLite doit être persisté dans un volume Docker monté (`./data:/data`).
- Pas de captcha sur le formulaire de contact — utiliser honeypot + rate-limiting pour l'UX.
- Pas de tokens en `localStorage` — JWT en cookie `httpOnly` uniquement.

## Stack choisie

| Couche | Choix | Pourquoi |
|--------|-------|----------|
| Frontend | **Next.js 15** (App Router, TypeScript) | SSR pour SEO portfolio, dominant sur le marché 2026, aligné avec la prochaine mission |
| Styling | Tailwind CSS + shadcn/ui | Pour reproduire fidèlement le design existant + composants admin propres |
| Backend | **FastAPI** (Python 3.12) | Moderne, async, OpenAPI auto-généré, très demandé en 2026 |
| ORM | SQLAlchemy 2.0 + Alembic | Standard moderne, migrations versionnées |
| BDD | **SQLite** | Suffisant pour le scope, simple à backuper |
| Auth | JWT (HS256) + bcrypt | Cookie `httpOnly`, pas de localStorage |
| Containerisation | Docker + docker-compose | Cohérent avec le setup serveur existant |
| Tunnel | Cloudflared (déjà en place sur l'hôte) | Pas de changement |

## Architecture

### Topologie réseau

```
Internet → Cloudflare Tunnel → localhost:3000 (web/Next.js) → api:8000 (FastAPI) → /data/sqlite.db
```

- **`web`** (port 3000, bind `127.0.0.1`) — Next.js, seul point d'entrée public via le tunnel.
- **`api`** (port 8000, réseau Docker interne uniquement) — FastAPI.
- **Volume** `./data` — contient `sqlite.db` + `uploads/`.
- **Cloudflared** — reste sur l'hôte, on change juste sa cible (de l'HTML statique vers `localhost:3000`).

### Approche front/back

Front et back **séparés** mais déployés ensemble (Approche A retenue). Communication via API REST sur le réseau Docker interne. Le découplage permet de refaire le front en Angular plus tard sans toucher au back.

Next.js fait office de Backend-For-Frontend (BFF) :
- Server Components / Server Actions appellent FastAPI côté serveur
- Le client n'a jamais l'URL de l'API
- Les cookies JWT sont transmis automatiquement

## Modèle de données

6 tables SQLite, gérées via SQLAlchemy 2.0 + Alembic.

### `projects`
| Champ | Type | Notes |
|-------|------|-------|
| `id` | INTEGER PK | |
| `slug` | TEXT UNIQUE | URL-friendly, ex: `limperiam-portfolio` |
| `title` | TEXT NOT NULL | |
| `description` | TEXT NOT NULL | Markdown court (carte projet) |
| `content` | TEXT | Markdown long (page détail) |
| `tech_stack` | TEXT NOT NULL | JSON array, ex: `["React", "Python"]` |
| `image_url` | TEXT | Chemin relatif `/uploads/xxx.jpg` |
| `repo_url` | TEXT | |
| `live_url` | TEXT | |
| `display_order` | INTEGER DEFAULT 0 | Tri manuel |
| `is_published` | BOOLEAN DEFAULT 0 | Permet brouillons |
| `created_at`, `updated_at` | DATETIME | |

### `experiences`
| Champ | Type | Notes |
|-------|------|-------|
| `id` | INTEGER PK | |
| `company` | TEXT NOT NULL | |
| `role` | TEXT NOT NULL | |
| `description` | TEXT | Markdown |
| `start_date` | DATE NOT NULL | |
| `end_date` | DATE | NULL = en cours |
| `location` | TEXT | |
| `display_order` | INTEGER DEFAULT 0 | |
| `created_at`, `updated_at` | DATETIME | |

### `skills`
| Champ | Type | Notes |
|-------|------|-------|
| `id` | INTEGER PK | |
| `name` | TEXT NOT NULL | ex: `TypeScript` |
| `category` | TEXT NOT NULL | `frontend` / `backend` / `devops` / `tools` / `soft` |
| `level` | INTEGER | 1-5 (optionnel) |
| `icon` | TEXT | nom d'icône Lucide/Simple-Icons ou URL |
| `display_order` | INTEGER DEFAULT 0 | |
| `is_featured` | BOOLEAN DEFAULT 0 | Mise en avant sur la home |
| `created_at`, `updated_at` | DATETIME | |

### `contact_messages`
| Champ | Type | Notes |
|-------|------|-------|
| `id` | INTEGER PK | |
| `name` | TEXT NOT NULL | |
| `email` | TEXT NOT NULL | |
| `subject` | TEXT | |
| `message` | TEXT NOT NULL | |
| `ip_address` | TEXT | Pour détection abus |
| `is_read` | BOOLEAN DEFAULT 0 | |
| `created_at` | DATETIME | |

### `admin_users`
| Champ | Type | Notes |
|-------|------|-------|
| `id` | INTEGER PK | |
| `email` | TEXT UNIQUE NOT NULL | |
| `password_hash` | TEXT NOT NULL | bcrypt |
| `created_at` | DATETIME | |

### `calcom_bookings` (optionnel, MVP+1)
| Champ | Type | Notes |
|-------|------|-------|
| `id` | INTEGER PK | |
| `calcom_uid` | TEXT UNIQUE NOT NULL | |
| `attendee_email` | TEXT NOT NULL | |
| `attendee_name` | TEXT | |
| `start_time` | DATETIME NOT NULL | |
| `end_time` | DATETIME NOT NULL | |
| `status` | TEXT NOT NULL | `confirmed` / `cancelled` |
| `raw_payload` | TEXT | JSON brut du webhook |
| `created_at` | DATETIME | |

### Stockage des images

- Dossier `/data/uploads/` monté en volume.
- Servi en static par FastAPI (`StaticFiles`) ou par Next.js en proxy.
- Upload : limite 2 MB, whitelist `.jpg/.png/.webp`, validation magic number, renommage UUID.

## API (FastAPI)

Préfixe `/api/v1/`, JSON in/out, OpenAPI auto-généré sur `/docs`.

### Public (no auth)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/projects` | Projets publiés (`is_published=1`), triés par `display_order` |
| GET | `/projects/{slug}` | Détail projet |
| GET | `/experiences` | Toutes, triées par `start_date DESC` |
| GET | `/skills` | Toutes, groupées par catégorie |
| POST | `/contact` | Envoi formulaire (rate-limit 5/min/IP, honeypot, timing-check) |
| GET | `/health` | Healthcheck Docker |

### Auth

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/auth/login` | email/password → JWT en cookie `httpOnly` `Secure` `SameSite=Lax` |
| POST | `/auth/logout` | Efface le cookie |
| GET | `/auth/me` | Infos admin courant (requiert JWT) |

### Admin (JWT requis)

Pattern CRUD identique pour `projects`, `experiences`, `skills` :

| Méthode | Endpoint |
|---------|----------|
| GET | `/admin/{resource}` (incluant brouillons) |
| POST | `/admin/{resource}` |
| PUT | `/admin/{resource}/{id}` |
| DELETE | `/admin/{resource}/{id}` |

Spécifiques :
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/admin/projects/{id}/image` | Upload image (multipart/form-data) |
| GET | `/admin/messages` | Liste des messages reçus |
| PATCH | `/admin/messages/{id}` | Marquer lu/non-lu |
| DELETE | `/admin/messages/{id}` | |

### Webhooks

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/webhooks/calcom` | Signature HMAC-SHA256 vérifiée, persiste la booking |

## Frontend (Next.js)

### Routes publiques

| Route | Type | Description |
|-------|------|-------------|
| `/` | Server Component | Home — hero + projets featured + skills featured + CTA contact |
| `/projects` | Server Component | Liste de tous les projets publiés |
| `/projects/[slug]` | Server Component (dynamic) | Détail projet (markdown rendu) |
| `/about` | Server Component | Expériences + skills complets |
| `/contact` | Server Component + form | Formulaire (Server Action) + Cal.com embed |

### Routes admin

| Route | Description |
|-------|-------------|
| `/admin/login` | Formulaire login |
| `/admin` | Dashboard (compteurs : messages non-lus, projets brouillons) |
| `/admin/projects` | Liste + CRUD inline |
| `/admin/projects/[id]` | Édition complète (markdown editor) |
| `/admin/experiences` | Liste + CRUD |
| `/admin/skills` | Liste + CRUD |
| `/admin/messages` | Inbox messages reçus |

### Middleware

`src/middleware.ts` protège `/admin/*` (sauf `/admin/login`) :
- Lit le cookie JWT
- Vérifie signature et expiration
- Redirige vers `/admin/login` si invalide

### Typage de l'API

`openapi-typescript` génère les types TS depuis `http://api:8000/openapi.json` → pas de drift back/front. Script `npm run gen:api`.

### Reproduction du design existant

Stratégie en 3 étapes :
1. Décompresser le bundle Claude actuel pour extraire texte, structure, couleurs, polices, animations.
2. Recréer chaque écran en composants Next.js + Tailwind, **en gardant les mêmes tokens** (couleurs, espacements, typographie).
3. Comparaison visuelle screenshot vs implémentation à chaque écran avant validation.

Le skill `frontend-design` pourra aider à la fidélité.

## Sécurité

| Risque | Mitigation |
|--------|------------|
| XSS sur cookie auth | JWT en `httpOnly` (pas accessible JS), `Secure`, `SameSite=Lax` |
| CSRF | `SameSite=Lax` + Server Actions Next.js (CSRF protection native) |
| Spam contact | Rate-limit `slowapi` 5/min/IP + honeypot field + timing-check (>2s) |
| Upload malveillant | Whitelist extension + magic number + taille 2 MB + renommage UUID |
| Brute force admin | Rate-limit sur `/auth/login` (5 tentatives / 15 min / IP) |
| API exposée | `api` n'a pas de `ports:` dans docker-compose, donc invisible depuis l'hôte |
| Webhook Cal.com spoofé | Signature HMAC-SHA256 vérifiée avec secret partagé |
| Secrets en clair | Tous via `.env` (gitignored), `pydantic-settings` côté API |

## Containerisation

### Structure de repo

```
limperiam-portfolio/
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── .gitignore
├── README.md
├── data/                            # volume (gitignored)
│   ├── sqlite.db
│   └── uploads/
├── api/
│   ├── Dockerfile
│   ├── pyproject.toml               # deps via uv
│   ├── alembic.ini
│   ├── alembic/
│   ├── src/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── auth.py
│   │   └── seed.py
│   └── tests/
└── web/
    ├── Dockerfile
    ├── package.json
    ├── next.config.ts
    ├── src/
    │   ├── app/
    │   │   ├── (public)/
    │   │   ├── admin/
    │   │   └── layout.tsx
    │   ├── components/
    │   ├── lib/
    │   │   ├── api.ts
    │   │   └── auth.ts
    │   └── middleware.ts
    └── tests/
```

### `docker-compose.yml`

```yaml
services:
  api:
    build: ./api
    restart: unless-stopped
    environment:
      - DATABASE_URL=sqlite:////data/sqlite.db
      - JWT_SECRET=${JWT_SECRET}
      - ADMIN_EMAIL=${ADMIN_EMAIL}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      - CALCOM_WEBHOOK_SECRET=${CALCOM_WEBHOOK_SECRET}
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_USER=${SMTP_USER}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - NOTIFICATION_EMAIL=${NOTIFICATION_EMAIL}
    volumes:
      - ./data:/data
    networks: [internal]
    # Pas de "ports:" → invisible depuis l'hôte

  web:
    build: ./web
    restart: unless-stopped
    environment:
      - API_URL=http://api:8000
      - NODE_ENV=production
    depends_on: [api]
    ports:
      - "127.0.0.1:3000:3000"          # bind localhost only
    networks: [internal]

networks:
  internal:
    driver: bridge
```

### `docker-compose.dev.yml` (override)

- Bind-mount du code source (`./api/src:/app/src`, `./web/src:/app/src`)
- Commandes hot-reload : `uvicorn --reload` côté API, `next dev` côté web
- BDD séparée : `./data-dev/sqlite.db`

### Workflow

```bash
# Dev avec hot-reload
docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# Prod
docker compose up -d

# Migrations
docker compose exec api alembic upgrade head
docker compose exec api alembic revision --autogenerate -m "msg"

# Seed
docker compose exec api python -m src.seed
```

## Variables d'environnement

`.env.example` (à recopier en `.env`, gitignoré) :

```
# Auth
JWT_SECRET=change-me-to-a-long-random-string-min-32-chars
ADMIN_EMAIL=nathan@example.com
ADMIN_PASSWORD=change-me-on-first-boot

# Cal.com
CALCOM_WEBHOOK_SECRET=

# SMTP (notifications messages reçus)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
NOTIFICATION_EMAIL=nathan@example.com
```

## Tests

Pas obligatoire pour le MVP, mais on inclut au minimum :

**API (`pytest`)** :
- Auth : login OK/KO, JWT valide/expiré
- Contact : rate-limit, honeypot, validation
- CRUD projects : auth requise, brouillons cachés en public

**Web (`vitest` + `playwright`)** :
- Smoke test : page d'accueil charge, projets affichés
- Form contact : soumission OK, erreurs affichées
- Admin login flow end-to-end

CI : pas dans le MVP. À ajouter via GitHub Actions plus tard.

## Hors scope (MVP+1)

- Multi-langue (i18n)
- Page blog/articles
- Analytics maison
- CDN images (Cloudflare R2)
- Dashboard Cal.com avec gestion notes
- Mode preview (voir un projet en brouillon avant publication)
- CI/CD automatique

## Migration depuis l'HTML actuel

1. Décompresser le bundle Claude (`Limperiam Portfolio.html`) pour extraire :
   - Liste des projets actuels (titre, desc, stack, liens)
   - Liste des expériences
   - Liste des skills
   - Tokens design (couleurs, polices, espacements)
2. Recréer les composants Next.js en respectant la fidélité visuelle.
3. Seed initial de la BDD avec les projets/expériences extraits via `src/seed.py`.
4. Lancer `docker compose up -d` sur le serveur maison.
5. Repointer Cloudflared vers `localhost:3000`.
6. Vérifier le site, désactiver l'ancien service HTML statique.

## Critères de succès

- Le portfolio est visuellement identique à l'HTML actuel (validation par screenshots comparés).
- L'admin peut se connecter, créer/modifier/supprimer projets/expériences/skills, et les voir publiés en temps réel.
- Le formulaire de contact stocke les messages en BDD et envoie une notification email.
- `docker compose up -d` fait tourner le tout sans intervention manuelle.
- L'API n'est jamais accessible depuis l'extérieur (test : `curl https://portfolio.example.com/api/v1/health` doit échouer, mais `docker exec web wget http://api:8000/api/v1/health` doit réussir).
- La doc OpenAPI est accessible en dev sur `http://localhost:8000/docs`.
