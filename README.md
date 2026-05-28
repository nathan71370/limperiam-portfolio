# Limperiam Portfolio

Personal portfolio site by Nathan Mercier — fullstack rebuild.

## Stack
- Frontend: Next.js 16 (App Router, TypeScript, Tailwind v4) — ✅ *Plan 2 complete*
- Backend: FastAPI (Python 3.12) — ✅ *Plan 1 complete*
- DB: SQLite
- Containerization: Docker + docker-compose
- Tunnel: Cloudflared (home server) — *Plan 4*

## Status

- ✅ **Plan 1: Backend API** (`v0.1.0-api`)
- ✅ **Plan 2: Frontend public site** (`v0.2.0-web`)
- ⏳ **Plan 3: Admin UI**
- ⏳ **Plan 4: Deployment + Cloudflared repoint**

## Running the full stack

```bash
docker compose up -d --build

# First-time only: migrate and seed
docker compose exec api uv run alembic upgrade head
docker compose exec api uv run python -m src.seed
docker compose exec -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=changeme \
  api uv run python scripts/seed_portfolio.py

# Site
open http://localhost:3000
```

The API is **not** exposed to the host — it lives on the internal Docker network behind the Next.js BFF. To smoke-test it directly during dev:

```bash
docker compose run --rm --service-ports api
```

## Architecture
See [docs/superpowers/specs/](docs/superpowers/specs/) and [docs/superpowers/plans/](docs/superpowers/plans/).

## Testing

```bash
cd api && uv run pytest -v        # backend (59 tests)
cd web && npm test                # frontend (vitest)
```
