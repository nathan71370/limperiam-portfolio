# Limperiam Portfolio

Personal portfolio site by Nathan Mercier — fullstack rebuild.

## Stack
- Frontend: Next.js 15 (App Router, TypeScript)
- Backend: FastAPI (Python 3.12)
- DB: SQLite
- Containerization: Docker + docker-compose
- Tunnel: Cloudflared (home server)

## Development

```bash
# Backend only (this plan)
cd api
uv sync
docker compose up api
# Open http://localhost:8000/docs
```

## Architecture
See [docs/superpowers/specs/](docs/superpowers/specs/) for design specs.
