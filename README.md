# Limperiam Portfolio

Personal portfolio site by Nathan Mercier — fullstack rebuild.

## Stack
- Frontend: Next.js 16 (App Router, TypeScript, Tailwind v4) — ✅ *Plans 2 + 3 + 4 complete*
- Backend: FastAPI (Python 3.12) — ✅ *Plan 1 complete*
- DB: SQLite (volume-persisted)
- Containerization: Docker + docker-compose
- Tunnel: Cloudflared (home server) — *Plan 4*

## Status

- ✅ **Plan 1: Backend API** (`v0.1.0-api`) — 59 tests, all endpoints
- ✅ **Plan 2: Frontend public site** (`v0.2.0-web`) — design fidelity, contact form
- ✅ **Plan 3: Admin UI** (`v0.3.0-admin`) — full CMS, image upload, Cal.com link
- ✅ **Plan 4: Visual fidelity rebuild** (`v0.4.0-fidelity`) — verbatim port of original CSS + components, FR/EN, dark mode, cursor, scroll progress, marquee

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
