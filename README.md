# Limperiam Portfolio

Personal portfolio site by Nathan Mercier — fullstack rebuild.

## Stack
- Frontend: Next.js 15 (App Router, TypeScript) — *Plan 2*
- Backend: FastAPI (Python 3.12) — ✅ *Plan 1 complete*
- DB: SQLite
- Containerization: Docker + docker-compose
- Tunnel: Cloudflared (home server)

## Status

- ✅ **Plan 1: Backend API** — complete (`v0.1.0-api`)
- ⏳ **Plan 2: Frontend (Next.js)** — pending
- ⏳ **Plan 3: Deployment & migration** — pending

## Running the API

```bash
# Build and start
docker compose up -d

# Apply migrations (first run only)
docker compose exec api uv run alembic upgrade head

# Create the initial admin user
docker compose exec api uv run python -m src.seed

# Open the API docs
# http://localhost:8000/docs
```

## Architecture
See [docs/superpowers/specs/](docs/superpowers/specs/) for design specs.
See [docs/superpowers/plans/](docs/superpowers/plans/) for implementation plans.

## Testing

```bash
cd api
uv run pytest -v
```

59 tests covering: public endpoints, contact form (anti-bot + rate limit), auth (JWT cookies), admin CRUD (projects/experiences/skills/messages), image upload with magic-number validation.
