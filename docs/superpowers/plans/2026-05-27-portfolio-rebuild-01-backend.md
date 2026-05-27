# Portfolio Rebuild — Plan 1: Backend (API) Implementation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, tested FastAPI backend with SQLite — public endpoints, JWT auth via httpOnly cookies, admin CRUD for projects/experiences/skills/messages, image upload, all containerized.

**Architecture:** FastAPI (async) + SQLAlchemy 2.0 + Alembic + Pydantic v2. SQLite persisted in `/data` Docker volume. JWT in httpOnly cookies. Layered structure (routers → services → models). Tests with pytest + httpx + in-memory SQLite.

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, Pydantic v2, pydantic-settings, passlib[bcrypt], python-jose[cryptography], slowapi, python-multipart, pytest, httpx, uv, Docker.

**Spec:** [2026-05-27-portfolio-rebuild-design.md](../specs/2026-05-27-portfolio-rebuild-design.md)

**Out of scope (later plans):** Frontend (Next.js), full Docker Compose with web service, content migration from HTML, deployment to home server. This plan ends with a working API consumable via `http://localhost:8000/docs`.

---

## Phase 0 — Project initialization

### Task 1: Initialize git repo and monorepo structure

**Files:**
- Create: `.gitignore`
- Create: `README.md`
- Create: `api/.gitkeep`
- Create: `web/.gitkeep`
- Create: `data/.gitkeep`

- [ ] **Step 1: Initialize git**

Run:
```bash
cd /Users/nathanmercier/Documents/Project/FrontEnd/limperiam-portfolio
git init -b main
```

Expected: `Initialized empty Git repository in .git/`

- [ ] **Step 2: Create .gitignore**

Create `.gitignore`:
```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
*.egg-info/
.pytest_cache/
.venv/
venv/

# Node
node_modules/
.next/
out/
dist/
.turbo/

# Env
.env
.env.local
.env.*.local
!.env.example

# Data
data/
data-dev/
*.db
*.db-journal

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp

# Misc
*.log
.coverage
htmlcov/
```

- [ ] **Step 3: Create directories with placeholder files**

Run:
```bash
mkdir -p api web data
touch api/.gitkeep web/.gitkeep data/.gitkeep
```

- [ ] **Step 4: Create README.md skeleton**

Create `README.md`:
```markdown
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
```

- [ ] **Step 5: Initial commit**

Run:
```bash
git add .gitignore README.md api/.gitkeep web/.gitkeep data/.gitkeep docs/
git commit -m "chore: init monorepo structure"
```

Expected: `[main (root-commit) <hash>] chore: init monorepo structure`

---

### Task 2: Set up Python project with uv

**Files:**
- Create: `api/pyproject.toml`
- Create: `api/.python-version`

- [ ] **Step 1: Check uv is installed**

Run: `uv --version`
Expected: `uv 0.x.x` (if not installed: `curl -LsSf https://astral.sh/uv/install.sh | sh`)

- [ ] **Step 2: Create pyproject.toml**

Create `api/pyproject.toml`:
```toml
[project]
name = "limperiam-api"
version = "0.1.0"
description = "Limperiam portfolio API"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.32.0",
    "sqlalchemy>=2.0.36",
    "alembic>=1.14.0",
    "pydantic>=2.10.0",
    "pydantic-settings>=2.7.0",
    "passlib[bcrypt]>=1.7.4",
    "python-jose[cryptography]>=3.3.0",
    "python-multipart>=0.0.20",
    "slowapi>=0.1.9",
    "email-validator>=2.2.0",
]

[dependency-groups]
dev = [
    "pytest>=8.3.0",
    "pytest-asyncio>=0.24.0",
    "httpx>=0.28.0",
    "ruff>=0.8.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
pythonpath = ["."]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["E", "F", "I", "W", "UP"]
```

- [ ] **Step 3: Set Python version**

Create `api/.python-version`:
```
3.12
```

- [ ] **Step 4: Install dependencies**

Run:
```bash
cd api
uv sync
```

Expected: Creates `.venv/`, installs all deps, produces `uv.lock`.

- [ ] **Step 5: Verify install**

Run: `cd api && uv run python -c "import fastapi; print(fastapi.__version__)"`
Expected: `0.115.x` or similar.

- [ ] **Step 6: Commit**

Run:
```bash
git add api/pyproject.toml api/.python-version api/uv.lock
git commit -m "feat(api): initialize Python project with uv"
```

---

### Task 3: Create API source structure

**Files:**
- Create: `api/src/__init__.py`
- Create: `api/src/main.py`
- Create: `api/src/config.py`
- Create: `api/tests/__init__.py`
- Create: `api/tests/conftest.py`

- [ ] **Step 1: Create directory tree**

Run:
```bash
cd api
mkdir -p src/models src/schemas src/routers src/services tests
touch src/__init__.py src/models/__init__.py src/schemas/__init__.py src/routers/__init__.py src/services/__init__.py tests/__init__.py
```

- [ ] **Step 2: Write config module**

Create `api/src/config.py`:
```python
from functools import lru_cache
from pydantic import EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Limperiam API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "sqlite:///./data/sqlite.db"

    # Auth
    jwt_secret: str = "change-me-in-production-min-32-chars-long"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24h

    # Admin seed
    admin_email: EmailStr = "admin@example.com"
    admin_password: str = "change-me-on-first-boot"

    # CORS (dev only)
    cors_origins: list[str] = ["http://localhost:3000"]

    # Cal.com
    calcom_webhook_secret: str = ""

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    notification_email: EmailStr = "admin@example.com"

    # Upload
    upload_dir: str = "./data/uploads"
    upload_max_size_mb: int = 2


@lru_cache
def get_settings() -> Settings:
    return Settings()
```

- [ ] **Step 3: Write minimal main.py**

Create `api/src/main.py`:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    docs_url="/docs",
)

if settings.debug:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.get(f"{settings.api_v1_prefix}/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 4: Write conftest.py**

Create `api/tests/conftest.py`:
```python
import pytest
from fastapi.testclient import TestClient

from src.main import app


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
```

- [ ] **Step 5: Write healthcheck test**

Create `api/tests/test_health.py`:
```python
from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
```

- [ ] **Step 6: Run test**

Run: `cd api && uv run pytest tests/test_health.py -v`
Expected: `1 passed`

- [ ] **Step 7: Verify API runs locally**

Run: `cd api && uv run uvicorn src.main:app --reload`
In another terminal: `curl http://localhost:8000/api/v1/health`
Expected: `{"status":"ok"}`
Then: `curl http://localhost:8000/docs` (returns HTML)
Stop server with Ctrl+C.

- [ ] **Step 8: Create .env.example**

Create `.env.example`:
```
# Auth
JWT_SECRET=change-me-to-a-long-random-string-min-32-chars
ADMIN_EMAIL=nathan@example.com
ADMIN_PASSWORD=change-me-on-first-boot

# Database
DATABASE_URL=sqlite:////data/sqlite.db

# Cal.com
CALCOM_WEBHOOK_SECRET=

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
NOTIFICATION_EMAIL=nathan@example.com

# Dev
DEBUG=true
```

- [ ] **Step 9: Commit**

Run:
```bash
git add api/src api/tests .env.example
git commit -m "feat(api): scaffold app with healthcheck and config"
```

---

### Task 4: API Dockerfile (single-service docker)

**Files:**
- Create: `api/Dockerfile`
- Create: `api/.dockerignore`

- [ ] **Step 1: Write Dockerfile**

Create `api/Dockerfile`:
```dockerfile
FROM python:3.12-slim AS base

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv

WORKDIR /app

# Install deps first (layer cached)
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

# Copy source
COPY src ./src
COPY alembic.ini ./
COPY alembic ./alembic

# Create data dir (will be overridden by volume in compose)
RUN mkdir -p /data /data/uploads

EXPOSE 8000

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [ ] **Step 2: Write .dockerignore**

Create `api/.dockerignore`:
```
.venv
__pycache__
*.pyc
.pytest_cache
tests
.env
.env.local
*.md
```

- [ ] **Step 3: Build image**

Run:
```bash
cd api
docker build -t limperiam-api:dev .
```

Expected: `Successfully tagged limperiam-api:dev` (alembic dir doesn't exist yet — will create later. Comment out `COPY alembic.ini` and `COPY alembic` if build fails, we'll re-add at Task 6).

If it fails on COPY alembic, edit Dockerfile to temporarily remove those two lines, then rebuild. We'll restore them in Task 6.

- [ ] **Step 4: Run container**

Run:
```bash
docker run --rm -p 8000:8000 -e DEBUG=true limperiam-api:dev
```

In another terminal: `curl http://localhost:8000/api/v1/health`
Expected: `{"status":"ok"}`
Stop with Ctrl+C.

- [ ] **Step 5: Commit**

Run:
```bash
git add api/Dockerfile api/.dockerignore
git commit -m "feat(api): add Dockerfile"
```

---

## Phase 1 — Database foundation

### Task 5: Database connection + base model

**Files:**
- Create: `api/src/database.py`
- Create: `api/src/models/base.py`

- [ ] **Step 1: Write database.py**

Create `api/src/database.py`:
```python
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from src.config import get_settings

settings = get_settings()

# SQLite needs check_same_thread=False for FastAPI
connect_args = {"check_same_thread": False} if settings.database_url.startswith("sqlite") else {}

engine = create_engine(
    settings.database_url,
    connect_args=connect_args,
    echo=settings.debug,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 2: Write base model**

Create `api/src/models/base.py`:
```python
from datetime import datetime

from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
        nullable=False,
    )
```

- [ ] **Step 3: Commit**

Run:
```bash
git add api/src/database.py api/src/models/base.py
git commit -m "feat(api): add SQLAlchemy engine and base model"
```

---

### Task 6: Set up Alembic migrations

**Files:**
- Create: `api/alembic.ini`
- Create: `api/alembic/env.py`
- Create: `api/alembic/script.py.mako`
- Create: `api/alembic/versions/.gitkeep`

- [ ] **Step 1: Initialize alembic**

Run:
```bash
cd api
uv run alembic init alembic
```

This creates `alembic.ini`, `alembic/env.py`, `alembic/script.py.mako`, `alembic/versions/`.

- [ ] **Step 2: Edit alembic.ini**

Modify `api/alembic.ini` — find the line `sqlalchemy.url = driver://user:pass@localhost/dbname` and **delete it** (we'll set it from env in `env.py`).

- [ ] **Step 3: Configure alembic/env.py**

Replace `api/alembic/env.py` entirely with:
```python
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from src.config import get_settings
from src.models.base import Base

# Import all models so Alembic sees them (added in next tasks)
# from src.models.project import Project  # noqa
# from src.models.experience import Experience  # noqa
# from src.models.skill import Skill  # noqa
# from src.models.contact_message import ContactMessage  # noqa
# from src.models.admin_user import AdminUser  # noqa

config = context.config
config.set_main_option("sqlalchemy.url", get_settings().database_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        render_as_batch=True,  # required for SQLite ALTER TABLE
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            render_as_batch=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 4: Verify alembic can read config**

Run: `cd api && uv run alembic current`
Expected: No errors (empty output since no migrations yet).

- [ ] **Step 5: Re-enable Dockerfile alembic lines (if you commented them)**

If Step 4 of Task 4 required commenting `COPY alembic.ini` and `COPY alembic`, restore them now.

- [ ] **Step 6: Commit**

Run:
```bash
git add api/alembic.ini api/alembic/
git commit -m "feat(api): set up Alembic migrations"
```

---

### Task 7: Define all data models

**Files:**
- Create: `api/src/models/project.py`
- Create: `api/src/models/experience.py`
- Create: `api/src/models/skill.py`
- Create: `api/src/models/contact_message.py`
- Create: `api/src/models/admin_user.py`
- Modify: `api/src/models/__init__.py`
- Modify: `api/alembic/env.py`

- [ ] **Step 1: Project model**

Create `api/src/models/project.py`:
```python
from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin


class Project(Base, TimestampMixin):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str | None] = mapped_column(Text, nullable=True)
    tech_stack: Mapped[str] = mapped_column(Text, nullable=False, default="[]")  # JSON
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    repo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    live_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
```

- [ ] **Step 2: Experience model**

Create `api/src/models/experience.py`:
```python
from datetime import date

from sqlalchemy import Date, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin


class Experience(Base, TimestampMixin):
    __tablename__ = "experiences"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    company: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
```

- [ ] **Step 3: Skill model**

Create `api/src/models/skill.py`:
```python
from sqlalchemy import Boolean, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base, TimestampMixin


class Skill(Base, TimestampMixin):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    level: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 1-5
    icon: Mapped[str | None] = mapped_column(String(200), nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
```

- [ ] **Step 4: ContactMessage model**

Create `api/src/models/contact_message.py`:
```python
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class ContactMessage(Base):
    __tablename__ = "contact_messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False)
    subject: Mapped[str | None] = mapped_column(String(200), nullable=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )
```

- [ ] **Step 5: AdminUser model**

Create `api/src/models/admin_user.py`:
```python
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from src.models.base import Base


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.current_timestamp(), nullable=False
    )
```

- [ ] **Step 6: Re-export from package**

Replace `api/src/models/__init__.py`:
```python
from src.models.admin_user import AdminUser
from src.models.base import Base, TimestampMixin
from src.models.contact_message import ContactMessage
from src.models.experience import Experience
from src.models.project import Project
from src.models.skill import Skill

__all__ = [
    "AdminUser",
    "Base",
    "ContactMessage",
    "Experience",
    "Project",
    "Skill",
    "TimestampMixin",
]
```

- [ ] **Step 7: Update alembic/env.py to import models**

In `api/alembic/env.py`, replace the commented import block:
```python
# Import all models so Alembic sees them (added in next tasks)
# from src.models.project import Project  # noqa
# ...
```

with:
```python
from src.models import (  # noqa: F401
    AdminUser,
    ContactMessage,
    Experience,
    Project,
    Skill,
)
```

- [ ] **Step 8: Generate initial migration**

Run:
```bash
cd api
mkdir -p ../data
uv run alembic revision --autogenerate -m "create initial tables"
```

Expected: Creates `alembic/versions/<hash>_create_initial_tables.py`.

- [ ] **Step 9: Inspect the migration**

Read `api/alembic/versions/<hash>_create_initial_tables.py`. Verify:
- 5 `op.create_table(...)` calls (projects, experiences, skills, contact_messages, admin_users)
- Correct columns, indices on `slug`, `email`, `category`

- [ ] **Step 10: Apply migration**

Run:
```bash
cd api
uv run alembic upgrade head
```

Expected: Creates `data/sqlite.db`, applies migration.

- [ ] **Step 11: Verify schema**

Run:
```bash
sqlite3 data/sqlite.db ".schema"
```

Expected: SQL CREATE statements for all 5 tables + `alembic_version`.

- [ ] **Step 12: Commit**

Run:
```bash
git add api/src/models api/alembic
git commit -m "feat(api): add SQLAlchemy models and initial migration"
```

---

## Phase 2 — Pydantic schemas

### Task 8: Pydantic schemas (in/out for all resources)

**Files:**
- Create: `api/src/schemas/project.py`
- Create: `api/src/schemas/experience.py`
- Create: `api/src/schemas/skill.py`
- Create: `api/src/schemas/contact.py`
- Create: `api/src/schemas/auth.py`
- Modify: `api/src/schemas/__init__.py`

- [ ] **Step 1: Project schemas**

Create `api/src/schemas/project.py`:
```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    slug: str = Field(min_length=1, max_length=120, pattern=r"^[a-z0-9-]+$")
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    content: str | None = None
    tech_stack: list[str] = Field(default_factory=list)
    image_url: str | None = None
    repo_url: str | None = None
    live_url: str | None = None
    display_order: int = 0
    is_published: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=120, pattern=r"^[a-z0-9-]+$")
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    content: str | None = None
    tech_stack: list[str] | None = None
    image_url: str | None = None
    repo_url: str | None = None
    live_url: str | None = None
    display_order: int | None = None
    is_published: bool | None = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 2: Experience schemas**

Create `api/src/schemas/experience.py`:
```python
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ExperienceBase(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=200)
    description: str | None = None
    start_date: date
    end_date: date | None = None
    location: str | None = Field(default=None, max_length=200)
    display_order: int = 0


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=200)
    role: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    location: str | None = None
    display_order: int | None = None


class ExperienceOut(ExperienceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 3: Skill schemas**

Create `api/src/schemas/skill.py`:
```python
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SkillCategory = Literal["frontend", "backend", "devops", "tools", "soft"]


class SkillBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: SkillCategory
    level: int | None = Field(default=None, ge=1, le=5)
    icon: str | None = None
    display_order: int = 0
    is_featured: bool = False


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    category: SkillCategory | None = None
    level: int | None = Field(default=None, ge=1, le=5)
    icon: str | None = None
    display_order: int | None = None
    is_featured: bool | None = None


class SkillOut(SkillBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
```

- [ ] **Step 4: Contact schemas**

Create `api/src/schemas/contact.py`:
```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    subject: str | None = Field(default=None, max_length=200)
    message: str = Field(min_length=10, max_length=5000)
    # Anti-bot
    website: str = ""  # honeypot — must be empty
    elapsed_ms: int = Field(ge=0)  # ms between page load and submit; must be >= 2000


class ContactMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    subject: str | None
    message: str
    is_read: bool
    created_at: datetime


class ContactMessageUpdate(BaseModel):
    is_read: bool
```

- [ ] **Step 5: Auth schemas**

Create `api/src/schemas/auth.py`:
```python
from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminMe(BaseModel):
    id: int
    email: EmailStr
```

- [ ] **Step 6: Package init**

Replace `api/src/schemas/__init__.py`:
```python
from src.schemas.auth import AdminMe, LoginRequest
from src.schemas.contact import ContactCreate, ContactMessageOut, ContactMessageUpdate
from src.schemas.experience import ExperienceCreate, ExperienceOut, ExperienceUpdate
from src.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from src.schemas.skill import SkillCreate, SkillOut, SkillUpdate

__all__ = [
    "AdminMe",
    "ContactCreate",
    "ContactMessageOut",
    "ContactMessageUpdate",
    "ExperienceCreate",
    "ExperienceOut",
    "ExperienceUpdate",
    "LoginRequest",
    "ProjectCreate",
    "ProjectOut",
    "ProjectUpdate",
    "SkillCreate",
    "SkillOut",
    "SkillUpdate",
]
```

- [ ] **Step 7: Verify imports**

Run: `cd api && uv run python -c "from src.schemas import ProjectOut; print(ProjectOut.model_fields.keys())"`
Expected: Lists all project fields.

- [ ] **Step 8: Commit**

Run:
```bash
git add api/src/schemas
git commit -m "feat(api): add Pydantic schemas for all resources"
```

---

## Phase 3 — Test fixtures with in-memory DB

### Task 9: Test infrastructure (in-memory SQLite)

**Files:**
- Modify: `api/tests/conftest.py`

- [ ] **Step 1: Replace conftest with DB fixtures**

Replace `api/tests/conftest.py`:
```python
from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from src.database import get_db
from src.main import app
from src.models.base import Base

TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture
def engine():
    eng = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=eng)
    yield eng
    Base.metadata.drop_all(bind=eng)


@pytest.fixture
def db_session(engine) -> Generator[Session, None, None]:
    TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
```

- [ ] **Step 2: Run existing test to verify fixtures still work**

Run: `cd api && uv run pytest tests/test_health.py -v`
Expected: `1 passed`

- [ ] **Step 3: Commit**

Run:
```bash
git add api/tests/conftest.py
git commit -m "test(api): add in-memory DB fixtures"
```

---

## Phase 4 — Public endpoints

### Task 10: Helper service for projects

**Files:**
- Create: `api/src/services/project_service.py`

- [ ] **Step 1: Write test for service**

Create `api/tests/test_project_service.py`:
```python
import json

from sqlalchemy.orm import Session

from src.models.project import Project
from src.services.project_service import list_published_projects, get_project_by_slug


def test_list_published_returns_only_published(db_session: Session) -> None:
    db_session.add(Project(slug="a", title="A", description="d", tech_stack="[]", is_published=True, display_order=2))
    db_session.add(Project(slug="b", title="B", description="d", tech_stack="[]", is_published=False))
    db_session.add(Project(slug="c", title="C", description="d", tech_stack="[]", is_published=True, display_order=1))
    db_session.commit()

    results = list_published_projects(db_session)
    slugs = [p.slug for p in results]
    assert slugs == ["c", "a"]  # ordered by display_order asc


def test_get_by_slug_published_returns_project(db_session: Session) -> None:
    db_session.add(Project(slug="hello", title="H", description="d", tech_stack="[]", is_published=True))
    db_session.commit()
    p = get_project_by_slug(db_session, "hello", published_only=True)
    assert p is not None
    assert p.slug == "hello"


def test_get_by_slug_unpublished_returns_none_when_published_only(db_session: Session) -> None:
    db_session.add(Project(slug="draft", title="D", description="d", tech_stack="[]", is_published=False))
    db_session.commit()
    assert get_project_by_slug(db_session, "draft", published_only=True) is None
    assert get_project_by_slug(db_session, "draft", published_only=False) is not None
```

- [ ] **Step 2: Run test, expect failure**

Run: `cd api && uv run pytest tests/test_project_service.py -v`
Expected: ImportError (module doesn't exist yet).

- [ ] **Step 3: Implement service**

Create `api/src/services/project_service.py`:
```python
from sqlalchemy import asc
from sqlalchemy.orm import Session

from src.models.project import Project


def list_published_projects(db: Session) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.is_published.is_(True))
        .order_by(asc(Project.display_order), asc(Project.id))
        .all()
    )


def list_all_projects(db: Session) -> list[Project]:
    return db.query(Project).order_by(asc(Project.display_order), asc(Project.id)).all()


def get_project_by_slug(
    db: Session, slug: str, published_only: bool = True
) -> Project | None:
    query = db.query(Project).filter(Project.slug == slug)
    if published_only:
        query = query.filter(Project.is_published.is_(True))
    return query.first()


def get_project_by_id(db: Session, project_id: int) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()


def create_project(db: Session, data: dict) -> Project:
    project = Project(**data)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project: Project, data: dict) -> Project:
    for key, value in data.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()
```

- [ ] **Step 4: Run tests**

Run: `cd api && uv run pytest tests/test_project_service.py -v`
Expected: `3 passed`

- [ ] **Step 5: Commit**

Run:
```bash
git add api/src/services/project_service.py api/tests/test_project_service.py
git commit -m "feat(api): add project service"
```

---

### Task 11: GET /projects + GET /projects/{slug} router with tests

**Files:**
- Create: `api/src/routers/projects.py`
- Create: `api/tests/test_projects_api.py`
- Modify: `api/src/main.py`

- [ ] **Step 1: Write failing tests**

Create `api/tests/test_projects_api.py`:
```python
import json

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.project import Project


def _create_project(db: Session, **kwargs) -> Project:
    defaults = {
        "slug": "test",
        "title": "Test",
        "description": "Test description",
        "tech_stack": json.dumps(["Python"]),
        "is_published": True,
    }
    defaults.update(kwargs)
    project = Project(**defaults)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def test_list_projects_returns_published_only(
    client: TestClient, db_session: Session
) -> None:
    _create_project(db_session, slug="pub", is_published=True)
    _create_project(db_session, slug="draft", is_published=False)

    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["slug"] == "pub"


def test_list_projects_parses_tech_stack_as_list(
    client: TestClient, db_session: Session
) -> None:
    _create_project(
        db_session,
        slug="parsed",
        is_published=True,
        tech_stack=json.dumps(["React", "Python"]),
    )

    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    assert response.json()[0]["tech_stack"] == ["React", "Python"]


def test_get_project_by_slug_returns_project(
    client: TestClient, db_session: Session
) -> None:
    _create_project(db_session, slug="my-project", title="My Project", is_published=True)

    response = client.get("/api/v1/projects/my-project")
    assert response.status_code == 200
    assert response.json()["title"] == "My Project"


def test_get_project_unpublished_returns_404(
    client: TestClient, db_session: Session
) -> None:
    _create_project(db_session, slug="draft", is_published=False)

    response = client.get("/api/v1/projects/draft")
    assert response.status_code == 404


def test_get_project_not_found(client: TestClient) -> None:
    response = client.get("/api/v1/projects/does-not-exist")
    assert response.status_code == 404
```

- [ ] **Step 2: Run, expect failures**

Run: `cd api && uv run pytest tests/test_projects_api.py -v`
Expected: All fail (404s or import errors).

- [ ] **Step 3: Write router**

Create `api/src/routers/projects.py`:
```python
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.project import ProjectOut
from src.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


def _to_out(project) -> dict:
    return {
        "id": project.id,
        "slug": project.slug,
        "title": project.title,
        "description": project.description,
        "content": project.content,
        "tech_stack": json.loads(project.tech_stack or "[]"),
        "image_url": project.image_url,
        "repo_url": project.repo_url,
        "live_url": project.live_url,
        "display_order": project.display_order,
        "is_published": project.is_published,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)) -> list[dict]:
    projects = project_service.list_published_projects(db)
    return [_to_out(p) for p in projects]


@router.get("/{slug}", response_model=ProjectOut)
def get_project(slug: str, db: Session = Depends(get_db)) -> dict:
    project = project_service.get_project_by_slug(db, slug, published_only=True)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _to_out(project)
```

- [ ] **Step 4: Mount router in main.py**

Modify `api/src/main.py` — replace entire file:
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.routers import projects

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    openapi_url=f"{settings.api_v1_prefix}/openapi.json",
    docs_url="/docs",
)

if settings.debug:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(projects.router, prefix=settings.api_v1_prefix)


@app.get(f"{settings.api_v1_prefix}/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok"}
```

- [ ] **Step 5: Update routers/__init__.py**

Modify `api/src/routers/__init__.py`:
```python
from src.routers import projects

__all__ = ["projects"]
```

- [ ] **Step 6: Run tests**

Run: `cd api && uv run pytest tests/test_projects_api.py -v`
Expected: `5 passed`

- [ ] **Step 7: Commit**

Run:
```bash
git add api/src/routers api/src/main.py api/tests/test_projects_api.py
git commit -m "feat(api): add GET /projects endpoints"
```

---

### Task 12: GET /experiences

**Files:**
- Create: `api/src/services/experience_service.py`
- Create: `api/src/routers/experiences.py`
- Create: `api/tests/test_experiences_api.py`
- Modify: `api/src/main.py`
- Modify: `api/src/routers/__init__.py`
- Modify: `api/src/services/__init__.py`

- [ ] **Step 1: Write tests**

Create `api/tests/test_experiences_api.py`:
```python
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.experience import Experience


def test_list_experiences_sorted_by_start_date_desc(
    client: TestClient, db_session: Session
) -> None:
    db_session.add(Experience(company="A", role="Dev", start_date=date(2022, 1, 1), display_order=0))
    db_session.add(Experience(company="B", role="Dev", start_date=date(2024, 1, 1), display_order=0))
    db_session.add(Experience(company="C", role="Dev", start_date=date(2023, 1, 1), display_order=0))
    db_session.commit()

    response = client.get("/api/v1/experiences")
    assert response.status_code == 200
    data = response.json()
    assert [exp["company"] for exp in data] == ["B", "C", "A"]


def test_list_experiences_empty(client: TestClient) -> None:
    response = client.get("/api/v1/experiences")
    assert response.status_code == 200
    assert response.json() == []
```

- [ ] **Step 2: Run, expect failure**

Run: `cd api && uv run pytest tests/test_experiences_api.py -v`
Expected: 404 errors (router doesn't exist).

- [ ] **Step 3: Write service**

Create `api/src/services/experience_service.py`:
```python
from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from src.models.experience import Experience


def list_experiences(db: Session) -> list[Experience]:
    return (
        db.query(Experience)
        .order_by(asc(Experience.display_order), desc(Experience.start_date))
        .all()
    )


def get_experience_by_id(db: Session, exp_id: int) -> Experience | None:
    return db.query(Experience).filter(Experience.id == exp_id).first()


def create_experience(db: Session, data: dict) -> Experience:
    exp = Experience(**data)
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


def update_experience(db: Session, exp: Experience, data: dict) -> Experience:
    for key, value in data.items():
        setattr(exp, key, value)
    db.commit()
    db.refresh(exp)
    return exp


def delete_experience(db: Session, exp: Experience) -> None:
    db.delete(exp)
    db.commit()
```

- [ ] **Step 4: Write router**

Create `api/src/routers/experiences.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.experience import ExperienceOut
from src.services import experience_service

router = APIRouter(prefix="/experiences", tags=["experiences"])


@router.get("", response_model=list[ExperienceOut])
def list_experiences(db: Session = Depends(get_db)) -> list:
    return experience_service.list_experiences(db)
```

- [ ] **Step 5: Mount router**

Modify `api/src/main.py` — add import and `include_router`:
```python
from src.routers import experiences, projects
# ...
app.include_router(projects.router, prefix=settings.api_v1_prefix)
app.include_router(experiences.router, prefix=settings.api_v1_prefix)
```

Modify `api/src/routers/__init__.py`:
```python
from src.routers import experiences, projects

__all__ = ["experiences", "projects"]
```

Modify `api/src/services/__init__.py`:
```python
from src.services import experience_service, project_service

__all__ = ["experience_service", "project_service"]
```

- [ ] **Step 6: Run tests**

Run: `cd api && uv run pytest tests/test_experiences_api.py -v`
Expected: `2 passed`

- [ ] **Step 7: Commit**

Run:
```bash
git add api/src/services/experience_service.py api/src/routers/experiences.py api/src/services/__init__.py api/src/routers/__init__.py api/src/main.py api/tests/test_experiences_api.py
git commit -m "feat(api): add GET /experiences endpoint"
```

---

### Task 13: GET /skills

**Files:**
- Create: `api/src/services/skill_service.py`
- Create: `api/src/routers/skills.py`
- Create: `api/tests/test_skills_api.py`
- Modify: `api/src/main.py`
- Modify: `api/src/routers/__init__.py`
- Modify: `api/src/services/__init__.py`

- [ ] **Step 1: Write tests**

Create `api/tests/test_skills_api.py`:
```python
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.skill import Skill


def test_list_skills_returns_all_sorted(
    client: TestClient, db_session: Session
) -> None:
    db_session.add(Skill(name="React", category="frontend", display_order=2))
    db_session.add(Skill(name="Python", category="backend", display_order=1))
    db_session.add(Skill(name="Docker", category="devops", display_order=3))
    db_session.commit()

    response = client.get("/api/v1/skills")
    assert response.status_code == 200
    data = response.json()
    assert [s["name"] for s in data] == ["Python", "React", "Docker"]


def test_skills_empty(client: TestClient) -> None:
    response = client.get("/api/v1/skills")
    assert response.status_code == 200
    assert response.json() == []
```

- [ ] **Step 2: Write service**

Create `api/src/services/skill_service.py`:
```python
from sqlalchemy import asc
from sqlalchemy.orm import Session

from src.models.skill import Skill


def list_skills(db: Session) -> list[Skill]:
    return (
        db.query(Skill)
        .order_by(asc(Skill.display_order), asc(Skill.category), asc(Skill.name))
        .all()
    )


def get_skill_by_id(db: Session, skill_id: int) -> Skill | None:
    return db.query(Skill).filter(Skill.id == skill_id).first()


def create_skill(db: Session, data: dict) -> Skill:
    skill = Skill(**data)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


def update_skill(db: Session, skill: Skill, data: dict) -> Skill:
    for key, value in data.items():
        setattr(skill, key, value)
    db.commit()
    db.refresh(skill)
    return skill


def delete_skill(db: Session, skill: Skill) -> None:
    db.delete(skill)
    db.commit()
```

- [ ] **Step 3: Write router**

Create `api/src/routers/skills.py`:
```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.skill import SkillOut
from src.services import skill_service

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("", response_model=list[SkillOut])
def list_skills(db: Session = Depends(get_db)) -> list:
    return skill_service.list_skills(db)
```

- [ ] **Step 4: Mount router**

Modify `api/src/main.py`:
```python
from src.routers import experiences, projects, skills
# ...
app.include_router(skills.router, prefix=settings.api_v1_prefix)
```

Modify `api/src/routers/__init__.py`:
```python
from src.routers import experiences, projects, skills

__all__ = ["experiences", "projects", "skills"]
```

Modify `api/src/services/__init__.py`:
```python
from src.services import experience_service, project_service, skill_service

__all__ = ["experience_service", "project_service", "skill_service"]
```

- [ ] **Step 5: Run tests**

Run: `cd api && uv run pytest tests/test_skills_api.py -v`
Expected: `2 passed`

- [ ] **Step 6: Run ALL tests to confirm no regression**

Run: `cd api && uv run pytest -v`
Expected: All tests pass.

- [ ] **Step 7: Commit**

Run:
```bash
git add api/src/services/skill_service.py api/src/routers/skills.py api/src/services/__init__.py api/src/routers/__init__.py api/src/main.py api/tests/test_skills_api.py
git commit -m "feat(api): add GET /skills endpoint"
```

---

### Task 14: POST /contact (with rate-limit + honeypot)

**Files:**
- Create: `api/src/services/contact_service.py`
- Create: `api/src/routers/contact.py`
- Create: `api/tests/test_contact_api.py`
- Modify: `api/src/main.py`
- Modify: `api/src/routers/__init__.py`
- Modify: `api/src/services/__init__.py`

- [ ] **Step 1: Write tests**

Create `api/tests/test_contact_api.py`:
```python
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.contact_message import ContactMessage


def _valid_payload(**overrides) -> dict:
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "subject": "Hello",
        "message": "This is a test message that is long enough.",
        "website": "",  # honeypot
        "elapsed_ms": 5000,
    }
    payload.update(overrides)
    return payload


def test_post_contact_saves_message(client: TestClient, db_session: Session) -> None:
    response = client.post("/api/v1/contact", json=_valid_payload())
    assert response.status_code == 201

    msgs = db_session.query(ContactMessage).all()
    assert len(msgs) == 1
    assert msgs[0].name == "Test User"
    assert msgs[0].email == "test@example.com"
    assert msgs[0].is_read is False


def test_post_contact_honeypot_filled_returns_201_but_does_not_save(
    client: TestClient, db_session: Session
) -> None:
    response = client.post(
        "/api/v1/contact", json=_valid_payload(website="http://spam.example.com")
    )
    # We return 201 to not signal bots that they were detected
    assert response.status_code == 201
    msgs = db_session.query(ContactMessage).all()
    assert len(msgs) == 0


def test_post_contact_too_fast_returns_201_but_does_not_save(
    client: TestClient, db_session: Session
) -> None:
    response = client.post("/api/v1/contact", json=_valid_payload(elapsed_ms=500))
    assert response.status_code == 201
    msgs = db_session.query(ContactMessage).all()
    assert len(msgs) == 0


def test_post_contact_invalid_email_returns_422(client: TestClient) -> None:
    response = client.post("/api/v1/contact", json=_valid_payload(email="not-an-email"))
    assert response.status_code == 422


def test_post_contact_message_too_short_returns_422(client: TestClient) -> None:
    response = client.post("/api/v1/contact", json=_valid_payload(message="short"))
    assert response.status_code == 422
```

- [ ] **Step 2: Write service**

Create `api/src/services/contact_service.py`:
```python
from sqlalchemy.orm import Session

from src.models.contact_message import ContactMessage


MIN_ELAPSED_MS = 2000


def is_bot_submission(website_honeypot: str, elapsed_ms: int) -> bool:
    """Return True if submission looks like a bot."""
    if website_honeypot.strip():
        return True
    if elapsed_ms < MIN_ELAPSED_MS:
        return True
    return False


def save_message(
    db: Session,
    name: str,
    email: str,
    subject: str | None,
    message: str,
    ip_address: str | None,
) -> ContactMessage:
    msg = ContactMessage(
        name=name,
        email=email,
        subject=subject,
        message=message,
        ip_address=ip_address,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def list_messages(db: Session) -> list[ContactMessage]:
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()


def get_message(db: Session, msg_id: int) -> ContactMessage | None:
    return db.query(ContactMessage).filter(ContactMessage.id == msg_id).first()


def update_message(db: Session, msg: ContactMessage, data: dict) -> ContactMessage:
    for key, value in data.items():
        setattr(msg, key, value)
    db.commit()
    db.refresh(msg)
    return msg


def delete_message(db: Session, msg: ContactMessage) -> None:
    db.delete(msg)
    db.commit()
```

- [ ] **Step 3: Write router**

Create `api/src/routers/contact.py`:
```python
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.contact import ContactCreate
from src.services import contact_service

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", status_code=status.HTTP_201_CREATED)
def post_contact(
    payload: ContactCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if contact_service.is_bot_submission(payload.website, payload.elapsed_ms):
        # Silently drop — don't tell bots they were detected
        return {"status": "ok"}

    ip = request.client.host if request.client else None
    contact_service.save_message(
        db,
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
        ip_address=ip,
    )
    # TODO: send notification email (added later when SMTP is configured)
    return {"status": "ok"}
```

- [ ] **Step 4: Mount router**

Modify `api/src/main.py`:
```python
from src.routers import contact, experiences, projects, skills
# ...
app.include_router(contact.router, prefix=settings.api_v1_prefix)
```

Update `__init__.py` files accordingly (add `contact`, `contact_service`).

- [ ] **Step 5: Run tests**

Run: `cd api && uv run pytest tests/test_contact_api.py -v`
Expected: `5 passed`

- [ ] **Step 6: Commit**

Run:
```bash
git add api/src/services/contact_service.py api/src/routers/contact.py api/src/services/__init__.py api/src/routers/__init__.py api/src/main.py api/tests/test_contact_api.py
git commit -m "feat(api): add POST /contact with anti-bot"
```

---

### Task 15: Add slowapi rate-limiting to /contact

**Files:**
- Create: `api/src/rate_limit.py`
- Modify: `api/src/main.py`
- Modify: `api/src/routers/contact.py`
- Modify: `api/tests/test_contact_api.py`

- [ ] **Step 1: Write rate limit module**

Create `api/src/rate_limit.py`:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
```

- [ ] **Step 2: Wire into app**

Modify `api/src/main.py` — add after `app = FastAPI(...)`:
```python
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from src.rate_limit import limiter
# ...
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=429,
        content={"detail": f"Rate limit exceeded: {exc.detail}"},
    )
```

- [ ] **Step 3: Apply limit to contact endpoint**

Modify `api/src/routers/contact.py`:
```python
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.rate_limit import limiter
from src.schemas.contact import ContactCreate
from src.services import contact_service

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def post_contact(
    request: Request,
    payload: ContactCreate,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if contact_service.is_bot_submission(payload.website, payload.elapsed_ms):
        return {"status": "ok"}

    ip = request.client.host if request.client else None
    contact_service.save_message(
        db,
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
        ip_address=ip,
    )
    return {"status": "ok"}
```

(Note: `request: Request` must be the first non-self parameter for slowapi to find it.)

- [ ] **Step 4: Add rate-limit test**

Add to `api/tests/test_contact_api.py`:
```python
def test_post_contact_rate_limited_after_5_requests(
    client: TestClient, db_session: Session
) -> None:
    # Exhaust the 5/minute limit
    for i in range(5):
        response = client.post("/api/v1/contact", json=_valid_payload(email=f"u{i}@example.com"))
        assert response.status_code == 201

    response = client.post("/api/v1/contact", json=_valid_payload(email="6th@example.com"))
    assert response.status_code == 429
```

- [ ] **Step 5: Run tests**

Run: `cd api && uv run pytest tests/test_contact_api.py -v`
Expected: `6 passed`

- [ ] **Step 6: Commit**

Run:
```bash
git add api/src/rate_limit.py api/src/main.py api/src/routers/contact.py api/tests/test_contact_api.py
git commit -m "feat(api): rate-limit POST /contact to 5/min/IP"
```

---

## Phase 5 — Authentication

### Task 16: Password hashing helpers

**Files:**
- Create: `api/src/auth.py`
- Create: `api/tests/test_auth_helpers.py`

- [ ] **Step 1: Write tests**

Create `api/tests/test_auth_helpers.py`:
```python
from datetime import timedelta

from src.auth import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_hash_password_different_each_time() -> None:
    h1 = hash_password("mypass")
    h2 = hash_password("mypass")
    assert h1 != h2  # bcrypt uses salt


def test_verify_password_correct() -> None:
    h = hash_password("mypass")
    assert verify_password("mypass", h) is True


def test_verify_password_wrong() -> None:
    h = hash_password("mypass")
    assert verify_password("wrong", h) is False


def test_jwt_round_trip() -> None:
    token = create_access_token({"sub": "1", "email": "a@b.com"})
    payload = decode_access_token(token)
    assert payload["sub"] == "1"
    assert payload["email"] == "a@b.com"


def test_jwt_invalid_returns_none() -> None:
    assert decode_access_token("not.a.token") is None
```

- [ ] **Step 2: Run, expect failure**

Run: `cd api && uv run pytest tests/test_auth_helpers.py -v`
Expected: ImportError.

- [ ] **Step 3: Implement auth helpers**

Create `api/src/auth.py`:
```python
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import JWTError, jwt
from passlib.context import CryptContext

from src.config import get_settings

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict[str, Any], expires: timedelta | None = None) -> str:
    to_encode = data.copy()
    exp = datetime.now(timezone.utc) + (
        expires if expires else timedelta(minutes=settings.jwt_expire_minutes)
    )
    to_encode.update({"exp": exp})
    return jwt.encode(to_encode, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError:
        return None
```

- [ ] **Step 4: Run tests**

Run: `cd api && uv run pytest tests/test_auth_helpers.py -v`
Expected: `5 passed`

- [ ] **Step 5: Commit**

Run:
```bash
git add api/src/auth.py api/tests/test_auth_helpers.py
git commit -m "feat(api): add password hashing and JWT helpers"
```

---

### Task 17: Auth dependency (current admin from cookie)

**Files:**
- Create: `api/src/deps.py`

- [ ] **Step 1: Write dependency**

Create `api/src/deps.py`:
```python
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.auth import decode_access_token
from src.database import get_db
from src.models.admin_user import AdminUser

COOKIE_NAME = "access_token"


def get_current_admin(
    access_token: str | None = Cookie(default=None, alias=COOKIE_NAME),
    db: Session = Depends(get_db),
) -> AdminUser:
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    payload = decode_access_token(access_token)
    if payload is None or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )
    user = db.query(AdminUser).filter(AdminUser.id == int(payload["sub"])).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user
```

- [ ] **Step 2: Commit**

Run:
```bash
git add api/src/deps.py
git commit -m "feat(api): add get_current_admin dependency"
```

---

### Task 18: Auth router (login/logout/me)

**Files:**
- Create: `api/src/routers/auth.py`
- Create: `api/tests/test_auth_api.py`
- Modify: `api/src/main.py`
- Modify: `api/src/routers/__init__.py`

- [ ] **Step 1: Write tests**

Create `api/tests/test_auth_api.py`:
```python
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.auth import hash_password
from src.deps import COOKIE_NAME
from src.models.admin_user import AdminUser


def _create_admin(db: Session, email: str = "admin@test.com", password: str = "secret123") -> AdminUser:
    user = AdminUser(email=email, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def test_login_with_valid_credentials_sets_cookie(
    client: TestClient, db_session: Session
) -> None:
    _create_admin(db_session)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "secret123"},
    )
    assert response.status_code == 200
    assert COOKIE_NAME in response.cookies


def test_login_wrong_password_returns_401(
    client: TestClient, db_session: Session
) -> None:
    _create_admin(db_session)

    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_login_unknown_user_returns_401(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "ghost@test.com", "password": "any"},
    )
    assert response.status_code == 401


def test_me_without_cookie_returns_401(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_with_valid_cookie_returns_user(
    client: TestClient, db_session: Session
) -> None:
    _create_admin(db_session)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "secret123"},
    )
    cookie = login.cookies[COOKIE_NAME]

    response = client.get("/api/v1/auth/me", cookies={COOKIE_NAME: cookie})
    assert response.status_code == 200
    assert response.json()["email"] == "admin@test.com"


def test_logout_clears_cookie(client: TestClient, db_session: Session) -> None:
    _create_admin(db_session)
    login = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@test.com", "password": "secret123"},
    )
    cookie = login.cookies[COOKIE_NAME]

    response = client.post("/api/v1/auth/logout", cookies={COOKIE_NAME: cookie})
    assert response.status_code == 200
    # After logout, /me should fail
    me_response = client.get("/api/v1/auth/me")
    assert me_response.status_code == 401
```

- [ ] **Step 2: Run, expect failure**

Run: `cd api && uv run pytest tests/test_auth_api.py -v`
Expected: 404 errors.

- [ ] **Step 3: Write router**

Create `api/src/routers/auth.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from src.auth import create_access_token, verify_password
from src.config import get_settings
from src.database import get_db
from src.deps import COOKIE_NAME, get_current_admin
from src.models.admin_user import AdminUser
from src.schemas.auth import AdminMe, LoginRequest

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    user = db.query(AdminUser).filter(AdminUser.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=not settings.debug,  # dev: false (HTTP localhost), prod: true
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )
    return {"status": "ok"}


@router.post("/logout")
def logout(response: Response, _: AdminUser = Depends(get_current_admin)) -> dict[str, str]:
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "ok"}


@router.get("/me", response_model=AdminMe)
def me(current: AdminUser = Depends(get_current_admin)) -> dict:
    return {"id": current.id, "email": current.email}
```

- [ ] **Step 4: Mount router**

Modify `api/src/main.py` — add `auth` to imports and `include_router`:
```python
from src.routers import auth, contact, experiences, projects, skills
# ...
app.include_router(auth.router, prefix=settings.api_v1_prefix)
```

Update `api/src/routers/__init__.py` to include `auth`.

- [ ] **Step 5: Run tests**

Run: `cd api && uv run pytest tests/test_auth_api.py -v`
Expected: `6 passed`

- [ ] **Step 6: Add rate limit to login (brute force protection)**

Replace `api/src/routers/auth.py` entirely:
```python
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from src.auth import create_access_token, verify_password
from src.config import get_settings
from src.database import get_db
from src.deps import COOKIE_NAME, get_current_admin
from src.models.admin_user import AdminUser
from src.rate_limit import limiter
from src.schemas.auth import AdminMe, LoginRequest

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
@limiter.limit("5/15minutes")
def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    user = db.query(AdminUser).filter(AdminUser.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )
    return {"status": "ok"}


@router.post("/logout")
def logout(response: Response, _: AdminUser = Depends(get_current_admin)) -> dict[str, str]:
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "ok"}


@router.get("/me", response_model=AdminMe)
def me(current: AdminUser = Depends(get_current_admin)) -> dict:
    return {"id": current.id, "email": current.email}
```

Note: `request: Request` is the first parameter (required by slowapi to detect the request).

- [ ] **Step 7: Re-run tests**

Run: `cd api && uv run pytest tests/test_auth_api.py -v`
Expected: `6 passed`

- [ ] **Step 8: Commit**

Run:
```bash
git add api/src/routers/auth.py api/src/routers/__init__.py api/src/main.py api/tests/test_auth_api.py
git commit -m "feat(api): add auth router (login/logout/me) with rate limit"
```

---

### Task 19: Seed script (initial admin user)

**Files:**
- Create: `api/src/seed.py`

- [ ] **Step 1: Write seed script**

Create `api/src/seed.py`:
```python
"""Seed initial data. Idempotent — safe to re-run."""

from src.auth import hash_password
from src.config import get_settings
from src.database import SessionLocal
from src.models.admin_user import AdminUser


def seed_admin() -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.email == settings.admin_email).first()
        if existing:
            print(f"Admin {settings.admin_email} already exists, skipping.")
            return

        user = AdminUser(
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
        )
        db.add(user)
        db.commit()
        print(f"Created admin: {settings.admin_email}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
```

- [ ] **Step 2: Run seed (against real SQLite)**

Run:
```bash
cd api
uv run python -m src.seed
```

Expected: `Created admin: admin@example.com` (or "already exists" if rerun).

- [ ] **Step 3: Verify in DB**

Run:
```bash
sqlite3 data/sqlite.db "SELECT id, email FROM admin_users;"
```

Expected: One row.

- [ ] **Step 4: Commit**

Run:
```bash
git add api/src/seed.py
git commit -m "feat(api): add seed script for initial admin"
```

---

## Phase 6 — Admin CRUD endpoints

### Task 20: Admin projects CRUD

**Files:**
- Create: `api/src/routers/admin_projects.py`
- Create: `api/tests/test_admin_projects_api.py`
- Modify: `api/src/main.py`
- Modify: `api/src/routers/__init__.py`

- [ ] **Step 1: Write tests**

Create `api/tests/test_admin_projects_api.py`:
```python
import json

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.auth import hash_password
from src.deps import COOKIE_NAME
from src.models.admin_user import AdminUser
from src.models.project import Project


def _login(client: TestClient, db: Session) -> str:
    user = AdminUser(email="a@b.com", password_hash=hash_password("pass1234"))
    db.add(user)
    db.commit()
    response = client.post("/api/v1/auth/login", json={"email": "a@b.com", "password": "pass1234"})
    return response.cookies[COOKIE_NAME]


def test_list_admin_projects_without_auth_returns_401(client: TestClient) -> None:
    response = client.get("/api/v1/admin/projects")
    assert response.status_code == 401


def test_list_admin_projects_with_auth_returns_all_including_drafts(
    client: TestClient, db_session: Session
) -> None:
    token = _login(client, db_session)
    db_session.add(Project(slug="pub", title="P", description="d", tech_stack="[]", is_published=True))
    db_session.add(Project(slug="draft", title="D", description="d", tech_stack="[]", is_published=False))
    db_session.commit()

    response = client.get("/api/v1/admin/projects", cookies={COOKIE_NAME: token})
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_create_project(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    payload = {
        "slug": "new-proj",
        "title": "New",
        "description": "A new project",
        "tech_stack": ["Python", "FastAPI"],
        "is_published": False,
    }
    response = client.post("/api/v1/admin/projects", json=payload, cookies={COOKIE_NAME: token})
    assert response.status_code == 201
    data = response.json()
    assert data["slug"] == "new-proj"
    assert data["tech_stack"] == ["Python", "FastAPI"]


def test_create_project_duplicate_slug_returns_409(
    client: TestClient, db_session: Session
) -> None:
    token = _login(client, db_session)
    db_session.add(Project(slug="dup", title="A", description="d", tech_stack="[]"))
    db_session.commit()

    payload = {"slug": "dup", "title": "B", "description": "d", "tech_stack": []}
    response = client.post("/api/v1/admin/projects", json=payload, cookies={COOKIE_NAME: token})
    assert response.status_code == 409


def test_update_project(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    p = Project(slug="orig", title="Orig", description="d", tech_stack="[]")
    db_session.add(p)
    db_session.commit()

    response = client.put(
        f"/api/v1/admin/projects/{p.id}",
        json={"title": "Updated"},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Updated"


def test_update_project_not_found_returns_404(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    response = client.put("/api/v1/admin/projects/999", json={"title": "X"}, cookies={COOKIE_NAME: token})
    assert response.status_code == 404


def test_delete_project(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    p = Project(slug="to-del", title="X", description="d", tech_stack="[]")
    db_session.add(p)
    db_session.commit()
    p_id = p.id

    response = client.delete(f"/api/v1/admin/projects/{p_id}", cookies={COOKIE_NAME: token})
    assert response.status_code == 204
    assert db_session.query(Project).filter(Project.id == p_id).first() is None
```

- [ ] **Step 2: Write router**

Create `api/src/routers/admin_projects.py`:
```python
import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.database import get_db
from src.deps import get_current_admin
from src.models.admin_user import AdminUser
from src.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from src.services import project_service

router = APIRouter(
    prefix="/admin/projects",
    tags=["admin:projects"],
    dependencies=[Depends(get_current_admin)],
)


def _to_out(project) -> dict:
    return {
        "id": project.id,
        "slug": project.slug,
        "title": project.title,
        "description": project.description,
        "content": project.content,
        "tech_stack": json.loads(project.tech_stack or "[]"),
        "image_url": project.image_url,
        "repo_url": project.repo_url,
        "live_url": project.live_url,
        "display_order": project.display_order,
        "is_published": project.is_published,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.get("", response_model=list[ProjectOut])
def list_all(db: Session = Depends(get_db)) -> list[dict]:
    return [_to_out(p) for p in project_service.list_all_projects(db)]


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create(payload: ProjectCreate, db: Session = Depends(get_db)) -> dict:
    data = payload.model_dump()
    data["tech_stack"] = json.dumps(data["tech_stack"])
    try:
        project = project_service.create_project(db, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
    return _to_out(project)


@router.put("/{project_id}", response_model=ProjectOut)
def update(
    project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)
) -> dict:
    project = project_service.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    data = payload.model_dump(exclude_unset=True)
    if "tech_stack" in data:
        data["tech_stack"] = json.dumps(data["tech_stack"])
    try:
        updated = project_service.update_project(db, project, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
    return _to_out(updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(project_id: int, db: Session = Depends(get_db)) -> None:
    project = project_service.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project_service.delete_project(db, project)
```

- [ ] **Step 3: Mount router**

Modify `api/src/main.py`:
```python
from src.routers import admin_projects, auth, contact, experiences, projects, skills
# ...
app.include_router(admin_projects.router, prefix=settings.api_v1_prefix)
```

Update `__init__.py`.

- [ ] **Step 4: Run tests**

Run: `cd api && uv run pytest tests/test_admin_projects_api.py -v`
Expected: `7 passed`

- [ ] **Step 5: Commit**

Run:
```bash
git add api/src/routers/admin_projects.py api/src/routers/__init__.py api/src/main.py api/tests/test_admin_projects_api.py
git commit -m "feat(api): add admin CRUD for projects"
```

---

### Task 21: Admin experiences CRUD

**Files:**
- Create: `api/src/routers/admin_experiences.py`
- Create: `api/tests/test_admin_experiences_api.py`
- Modify: `api/src/main.py`
- Modify: `api/src/routers/__init__.py`

- [ ] **Step 1: Write tests**

Create `api/tests/test_admin_experiences_api.py`:
```python
from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.auth import hash_password
from src.deps import COOKIE_NAME
from src.models.admin_user import AdminUser
from src.models.experience import Experience


def _login(client: TestClient, db: Session) -> str:
    user = AdminUser(email="a@b.com", password_hash=hash_password("pass1234"))
    db.add(user)
    db.commit()
    return client.post(
        "/api/v1/auth/login", json={"email": "a@b.com", "password": "pass1234"}
    ).cookies[COOKIE_NAME]


def test_list_without_auth_returns_401(client: TestClient) -> None:
    assert client.get("/api/v1/admin/experiences").status_code == 401


def test_create_experience(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    response = client.post(
        "/api/v1/admin/experiences",
        json={
            "company": "Acme",
            "role": "Dev",
            "description": "Worked stuff",
            "start_date": "2023-01-01",
            "end_date": None,
            "location": "Paris",
            "display_order": 0,
        },
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 201
    assert response.json()["company"] == "Acme"


def test_update_experience(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    exp = Experience(company="X", role="Y", start_date=date(2023, 1, 1))
    db_session.add(exp)
    db_session.commit()

    response = client.put(
        f"/api/v1/admin/experiences/{exp.id}",
        json={"role": "Senior Dev"},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 200
    assert response.json()["role"] == "Senior Dev"


def test_delete_experience(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    exp = Experience(company="X", role="Y", start_date=date(2023, 1, 1))
    db_session.add(exp)
    db_session.commit()
    exp_id = exp.id

    response = client.delete(f"/api/v1/admin/experiences/{exp_id}", cookies={COOKIE_NAME: token})
    assert response.status_code == 204
    assert db_session.query(Experience).filter(Experience.id == exp_id).first() is None
```

- [ ] **Step 2: Write router**

Create `api/src/routers/admin_experiences.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.deps import get_current_admin
from src.schemas.experience import ExperienceCreate, ExperienceOut, ExperienceUpdate
from src.services import experience_service

router = APIRouter(
    prefix="/admin/experiences",
    tags=["admin:experiences"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[ExperienceOut])
def list_all(db: Session = Depends(get_db)) -> list:
    return experience_service.list_experiences(db)


@router.post("", response_model=ExperienceOut, status_code=status.HTTP_201_CREATED)
def create(payload: ExperienceCreate, db: Session = Depends(get_db)):
    return experience_service.create_experience(db, payload.model_dump())


@router.put("/{exp_id}", response_model=ExperienceOut)
def update(exp_id: int, payload: ExperienceUpdate, db: Session = Depends(get_db)):
    exp = experience_service.get_experience_by_id(db, exp_id)
    if exp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return experience_service.update_experience(db, exp, payload.model_dump(exclude_unset=True))


@router.delete("/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(exp_id: int, db: Session = Depends(get_db)) -> None:
    exp = experience_service.get_experience_by_id(db, exp_id)
    if exp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    experience_service.delete_experience(db, exp)
```

- [ ] **Step 3: Mount + update __init__**

Modify `api/src/main.py`:
```python
from src.routers import admin_experiences, admin_projects, auth, contact, experiences, projects, skills
# ...
app.include_router(admin_experiences.router, prefix=settings.api_v1_prefix)
```

Update `__init__.py`.

- [ ] **Step 4: Run tests**

Run: `cd api && uv run pytest tests/test_admin_experiences_api.py -v`
Expected: `4 passed`

- [ ] **Step 5: Commit**

Run:
```bash
git add api/src/routers/admin_experiences.py api/src/routers/__init__.py api/src/main.py api/tests/test_admin_experiences_api.py
git commit -m "feat(api): add admin CRUD for experiences"
```

---

### Task 22: Admin skills CRUD

**Files:**
- Create: `api/src/routers/admin_skills.py`
- Create: `api/tests/test_admin_skills_api.py`
- Modify: `api/src/main.py`
- Modify: `api/src/routers/__init__.py`

- [ ] **Step 1: Write tests**

Create `api/tests/test_admin_skills_api.py`:
```python
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.auth import hash_password
from src.deps import COOKIE_NAME
from src.models.admin_user import AdminUser
from src.models.skill import Skill


def _login(client: TestClient, db: Session) -> str:
    user = AdminUser(email="a@b.com", password_hash=hash_password("pass1234"))
    db.add(user)
    db.commit()
    return client.post(
        "/api/v1/auth/login", json={"email": "a@b.com", "password": "pass1234"}
    ).cookies[COOKIE_NAME]


def test_list_without_auth_returns_401(client: TestClient) -> None:
    assert client.get("/api/v1/admin/skills").status_code == 401


def test_create_skill(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    response = client.post(
        "/api/v1/admin/skills",
        json={"name": "Python", "category": "backend", "level": 5, "is_featured": True},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Python"


def test_create_skill_invalid_category_returns_422(
    client: TestClient, db_session: Session
) -> None:
    token = _login(client, db_session)
    response = client.post(
        "/api/v1/admin/skills",
        json={"name": "X", "category": "invalid"},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 422


def test_update_skill(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    s = Skill(name="Old", category="frontend")
    db_session.add(s)
    db_session.commit()

    response = client.put(
        f"/api/v1/admin/skills/{s.id}",
        json={"name": "New"},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New"


def test_delete_skill(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    s = Skill(name="X", category="tools")
    db_session.add(s)
    db_session.commit()
    s_id = s.id

    response = client.delete(f"/api/v1/admin/skills/{s_id}", cookies={COOKIE_NAME: token})
    assert response.status_code == 204
    assert db_session.query(Skill).filter(Skill.id == s_id).first() is None
```

- [ ] **Step 2: Write router**

Create `api/src/routers/admin_skills.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.deps import get_current_admin
from src.schemas.skill import SkillCreate, SkillOut, SkillUpdate
from src.services import skill_service

router = APIRouter(
    prefix="/admin/skills",
    tags=["admin:skills"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[SkillOut])
def list_all(db: Session = Depends(get_db)) -> list:
    return skill_service.list_skills(db)


@router.post("", response_model=SkillOut, status_code=status.HTTP_201_CREATED)
def create(payload: SkillCreate, db: Session = Depends(get_db)):
    return skill_service.create_skill(db, payload.model_dump())


@router.put("/{skill_id}", response_model=SkillOut)
def update(skill_id: int, payload: SkillUpdate, db: Session = Depends(get_db)):
    skill = skill_service.get_skill_by_id(db, skill_id)
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return skill_service.update_skill(db, skill, payload.model_dump(exclude_unset=True))


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(skill_id: int, db: Session = Depends(get_db)) -> None:
    skill = skill_service.get_skill_by_id(db, skill_id)
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    skill_service.delete_skill(db, skill)
```

- [ ] **Step 3: Mount + update __init__**

Modify `api/src/main.py` (add `admin_skills` to imports + `include_router`).

- [ ] **Step 4: Run tests**

Run: `cd api && uv run pytest tests/test_admin_skills_api.py -v`
Expected: `5 passed`

- [ ] **Step 5: Commit**

Run:
```bash
git add api/src/routers/admin_skills.py api/src/routers/__init__.py api/src/main.py api/tests/test_admin_skills_api.py
git commit -m "feat(api): add admin CRUD for skills"
```

---

### Task 23: Admin messages (list/read/delete)

**Files:**
- Create: `api/src/routers/admin_messages.py`
- Create: `api/tests/test_admin_messages_api.py`
- Modify: `api/src/main.py`
- Modify: `api/src/routers/__init__.py`

- [ ] **Step 1: Write tests**

Create `api/tests/test_admin_messages_api.py`:
```python
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.auth import hash_password
from src.deps import COOKIE_NAME
from src.models.admin_user import AdminUser
from src.models.contact_message import ContactMessage


def _login(client: TestClient, db: Session) -> str:
    user = AdminUser(email="a@b.com", password_hash=hash_password("pass1234"))
    db.add(user)
    db.commit()
    return client.post(
        "/api/v1/auth/login", json={"email": "a@b.com", "password": "pass1234"}
    ).cookies[COOKIE_NAME]


def test_list_messages_returns_all(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    db_session.add(ContactMessage(name="N1", email="a@b.com", message="hello world this is long"))
    db_session.add(ContactMessage(name="N2", email="c@d.com", message="hello world this is long"))
    db_session.commit()

    response = client.get("/api/v1/admin/messages", cookies={COOKIE_NAME: token})
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_mark_message_as_read(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    msg = ContactMessage(name="N", email="a@b.com", message="hello world this is long")
    db_session.add(msg)
    db_session.commit()

    response = client.patch(
        f"/api/v1/admin/messages/{msg.id}",
        json={"is_read": True},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 200
    assert response.json()["is_read"] is True


def test_delete_message(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    msg = ContactMessage(name="N", email="a@b.com", message="hello world this is long")
    db_session.add(msg)
    db_session.commit()
    msg_id = msg.id

    response = client.delete(f"/api/v1/admin/messages/{msg_id}", cookies={COOKIE_NAME: token})
    assert response.status_code == 204
    assert db_session.query(ContactMessage).filter(ContactMessage.id == msg_id).first() is None
```

- [ ] **Step 2: Write router**

Create `api/src/routers/admin_messages.py`:
```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.deps import get_current_admin
from src.schemas.contact import ContactMessageOut, ContactMessageUpdate
from src.services import contact_service

router = APIRouter(
    prefix="/admin/messages",
    tags=["admin:messages"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[ContactMessageOut])
def list_all(db: Session = Depends(get_db)) -> list:
    return contact_service.list_messages(db)


@router.patch("/{msg_id}", response_model=ContactMessageOut)
def update(msg_id: int, payload: ContactMessageUpdate, db: Session = Depends(get_db)):
    msg = contact_service.get_message(db, msg_id)
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return contact_service.update_message(db, msg, payload.model_dump(exclude_unset=True))


@router.delete("/{msg_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(msg_id: int, db: Session = Depends(get_db)) -> None:
    msg = contact_service.get_message(db, msg_id)
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    contact_service.delete_message(db, msg)
```

- [ ] **Step 3: Mount + update __init__**

Modify `api/src/main.py` (add `admin_messages`).

- [ ] **Step 4: Run tests**

Run: `cd api && uv run pytest tests/test_admin_messages_api.py -v`
Expected: `3 passed`

- [ ] **Step 5: Commit**

Run:
```bash
git add api/src/routers/admin_messages.py api/src/routers/__init__.py api/src/main.py api/tests/test_admin_messages_api.py
git commit -m "feat(api): add admin messages endpoints"
```

---

## Phase 7 — Image upload

### Task 24: Image upload for projects + static serving

**Files:**
- Create: `api/src/services/upload_service.py`
- Modify: `api/src/routers/admin_projects.py`
- Modify: `api/src/main.py`
- Create: `api/tests/test_upload_api.py`

- [ ] **Step 1: Write upload service tests**

Create `api/tests/test_upload_service.py`:
```python
from io import BytesIO

import pytest

from src.services.upload_service import is_valid_image, save_upload


PNG_MAGIC = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
JPEG_MAGIC = b"\xff\xd8\xff" + b"\x00" * 50
WEBP_MAGIC = b"RIFF\x00\x00\x00\x00WEBP" + b"\x00" * 50
FAKE = b"This is not an image" + b"\x00" * 50


def test_is_valid_image_accepts_png() -> None:
    assert is_valid_image(PNG_MAGIC, "image.png") is True


def test_is_valid_image_accepts_jpeg() -> None:
    assert is_valid_image(JPEG_MAGIC, "image.jpg") is True


def test_is_valid_image_accepts_webp() -> None:
    assert is_valid_image(WEBP_MAGIC, "image.webp") is True


def test_is_valid_image_rejects_fake() -> None:
    assert is_valid_image(FAKE, "image.png") is False


def test_is_valid_image_rejects_bad_extension() -> None:
    assert is_valid_image(PNG_MAGIC, "image.exe") is False


def test_save_upload_creates_file_with_uuid_name(tmp_path) -> None:
    relative = save_upload(PNG_MAGIC, "original.png", str(tmp_path))
    assert relative.startswith("/uploads/")
    assert relative.endswith(".png")
    # uuid hex should be 32 chars
    filename = relative.replace("/uploads/", "")
    assert len(filename) == 32 + len(".png")
```

- [ ] **Step 2: Write upload service**

Create `api/src/services/upload_service.py`:
```python
import os
import uuid

MAGIC_NUMBERS = {
    b"\x89PNG\r\n\x1a\n": (".png",),
    b"\xff\xd8\xff": (".jpg", ".jpeg"),
    b"RIFF": (".webp",),  # full check below
}


def _detect_format(content: bytes) -> str | None:
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if content.startswith(b"RIFF") and content[8:12] == b"WEBP":
        return ".webp"
    return None


def is_valid_image(content: bytes, filename: str) -> bool:
    detected = _detect_format(content)
    if detected is None:
        return False
    ext = os.path.splitext(filename)[1].lower()
    if detected == ".jpg" and ext in (".jpg", ".jpeg"):
        return True
    return ext == detected


def save_upload(content: bytes, original_filename: str, upload_dir: str) -> str:
    """Save file with UUID name and return public path (`/uploads/<uuid>.<ext>`)."""
    os.makedirs(upload_dir, exist_ok=True)
    ext = os.path.splitext(original_filename)[1].lower()
    # Normalize jpg/jpeg
    if ext == ".jpeg":
        ext = ".jpg"
    name = f"{uuid.uuid4().hex}{ext}"
    path = os.path.join(upload_dir, name)
    with open(path, "wb") as f:
        f.write(content)
    return f"/uploads/{name}"
```

- [ ] **Step 3: Run service tests**

Run: `cd api && uv run pytest tests/test_upload_service.py -v`
Expected: `6 passed`

- [ ] **Step 4: Add upload endpoint to admin_projects router**

Modify `api/src/routers/admin_projects.py` — add at the bottom (after delete endpoint):
```python
from fastapi import File, UploadFile

from src.config import get_settings
from src.services.upload_service import is_valid_image, save_upload

MAX_SIZE_BYTES = get_settings().upload_max_size_mb * 1024 * 1024


@router.post("/{project_id}/image", response_model=ProjectOut)
async def upload_image(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict:
    project = project_service.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {get_settings().upload_max_size_mb} MB)",
        )
    if not is_valid_image(content, file.filename or ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format",
        )

    public_path = save_upload(content, file.filename or "image", get_settings().upload_dir)
    updated = project_service.update_project(db, project, {"image_url": public_path})
    return _to_out(updated)
```

- [ ] **Step 5: Serve /uploads statically**

Modify `api/src/main.py` — add static mount:
```python
import os
from fastapi.staticfiles import StaticFiles
# ...
# After include_routers, before health endpoint:
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")
```

- [ ] **Step 6: Add upload_dir fixture to conftest**

Append to `api/tests/conftest.py`:
```python
@pytest.fixture(autouse=True)
def isolated_upload_dir(tmp_path, monkeypatch):
    """Each test uses its own upload directory."""
    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir(exist_ok=True)
    monkeypatch.setenv("UPLOAD_DIR", str(upload_dir))
    # Bust the @lru_cache so the new env value is picked up
    from src.config import get_settings
    get_settings.cache_clear()
    yield upload_dir
    get_settings.cache_clear()
```

- [ ] **Step 7: Write upload endpoint test**

Create `api/tests/test_upload_api.py`:
```python
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.auth import hash_password
from src.deps import COOKIE_NAME
from src.models.admin_user import AdminUser
from src.models.project import Project

PNG_BYTES = b"\x89PNG\r\n\x1a\n" + b"\x00" * 200


def _login_and_project(client: TestClient, db: Session) -> tuple[str, int]:
    user = AdminUser(email="a@b.com", password_hash=hash_password("pass1234"))
    p = Project(slug="x", title="X", description="d", tech_stack="[]")
    db.add(user)
    db.add(p)
    db.commit()
    token = client.post(
        "/api/v1/auth/login", json={"email": "a@b.com", "password": "pass1234"}
    ).cookies[COOKIE_NAME]
    return token, p.id


def test_upload_valid_image(
    client: TestClient, db_session: Session, isolated_upload_dir
) -> None:
    token, pid = _login_and_project(client, db_session)
    response = client.post(
        f"/api/v1/admin/projects/{pid}/image",
        files={"file": ("test.png", PNG_BYTES, "image/png")},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 200
    assert response.json()["image_url"].startswith("/uploads/")
    # Verify file actually written to isolated dir
    files = list(isolated_upload_dir.iterdir())
    assert len(files) == 1
    assert files[0].suffix == ".png"


def test_upload_invalid_format(client: TestClient, db_session: Session) -> None:
    token, pid = _login_and_project(client, db_session)
    response = client.post(
        f"/api/v1/admin/projects/{pid}/image",
        files={"file": ("evil.exe", b"MZ\x00\x00", "application/octet-stream")},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 400


def test_upload_too_large(client: TestClient, db_session: Session) -> None:
    token, pid = _login_and_project(client, db_session)
    huge = PNG_BYTES + b"\x00" * (3 * 1024 * 1024)
    response = client.post(
        f"/api/v1/admin/projects/{pid}/image",
        files={"file": ("big.png", huge, "image/png")},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 413


def test_upload_no_auth_returns_401(client: TestClient, db_session: Session) -> None:
    p = Project(slug="x", title="X", description="d", tech_stack="[]")
    db_session.add(p)
    db_session.commit()
    response = client.post(
        f"/api/v1/admin/projects/{p.id}/image",
        files={"file": ("test.png", PNG_BYTES, "image/png")},
    )
    assert response.status_code == 401
```

- [ ] **Step 8: Run tests**

Run: `cd api && uv run pytest tests/test_upload_api.py -v`
Expected: `4 passed`

- [ ] **Step 9: Run full suite (no regressions)**

Run: `cd api && uv run pytest -v`
Expected: All tests pass.

- [ ] **Step 10: Commit**

Run:
```bash
git add api/src/services/upload_service.py api/src/routers/admin_projects.py api/src/main.py api/tests/conftest.py api/tests/test_upload_service.py api/tests/test_upload_api.py
git commit -m "feat(api): add image upload for projects"
```

---

## Phase 8 — Smoke tests & docker-compose for API alone

### Task 25: Full test suite verification

- [ ] **Step 1: Run full suite**

Run:
```bash
cd api
uv run pytest -v
```

Expected: All tests pass. Note the total count — should be ~40+ tests.

- [ ] **Step 2: Check coverage of critical paths**

Run:
```bash
cd api
uv run pytest --tb=short
```

Should pass without flakes. If any test is flaky, fix it.

- [ ] **Step 3: Lint check**

Run:
```bash
cd api
uv run ruff check src tests
uv run ruff format --check src tests
```

If errors, fix with: `uv run ruff check --fix src tests && uv run ruff format src tests`

- [ ] **Step 4: Commit any lint fixes**

Run:
```bash
git add -A api/
git status
# only commit if there are changes
git diff --cached --quiet || git commit -m "style(api): apply ruff format"
```

---

### Task 26: docker-compose for API alone (intermediate deliverable)

**Files:**
- Create: `docker-compose.yml`

- [ ] **Step 1: Write minimal compose**

Create `docker-compose.yml` at repo root:
```yaml
services:
  api:
    build: ./api
    restart: unless-stopped
    environment:
      - DATABASE_URL=sqlite:////data/sqlite.db
      - JWT_SECRET=${JWT_SECRET:-dev-secret-change-me-min-32-chars}
      - ADMIN_EMAIL=${ADMIN_EMAIL:-admin@example.com}
      - ADMIN_PASSWORD=${ADMIN_PASSWORD:-changeme}
      - DEBUG=${DEBUG:-false}
      - UPLOAD_DIR=/data/uploads
    volumes:
      - ./data:/data
    ports:
      - "127.0.0.1:8000:8000"          # exposed only in this intermediate step
                                        # Plan 2 will remove this when web service is added
```

- [ ] **Step 2: Build and run**

Run:
```bash
docker compose build
docker compose up -d
docker compose logs api | tail -20
```

Expected: API logs show "Uvicorn running on http://0.0.0.0:8000".

- [ ] **Step 3: Run migrations inside container**

Run:
```bash
docker compose exec api uv run alembic upgrade head
```

Expected: `INFO  [alembic.runtime.migration] Running upgrade ... -> ..., create initial tables`

- [ ] **Step 4: Seed admin inside container**

Run:
```bash
docker compose exec api uv run python -m src.seed
```

Expected: `Created admin: admin@example.com`

- [ ] **Step 5: Smoke test endpoints**

Run:
```bash
curl http://localhost:8000/api/v1/health
# {"status":"ok"}

curl http://localhost:8000/api/v1/projects
# []

curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"changeme"}' \
  -c /tmp/cookies.txt
# {"status":"ok"}

curl http://localhost:8000/api/v1/auth/me -b /tmp/cookies.txt
# {"id":1,"email":"admin@example.com"}
```

Expected: All commands return success.

- [ ] **Step 6: Open /docs in browser**

Open `http://localhost:8000/docs` in browser.
Expected: Swagger UI with all endpoints visible.

- [ ] **Step 7: Tear down**

Run:
```bash
docker compose down
```

- [ ] **Step 8: Commit**

Run:
```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose for API"
```

---

### Task 27: Wrap-up — verify Plan 1 deliverables

- [ ] **Step 1: Verify all plan deliverables**

Checklist:
- [ ] Git repo initialized with proper `.gitignore` and `README.md`
- [ ] API package builds and runs in Docker
- [ ] 5 tables migrated via Alembic (`projects`, `experiences`, `skills`, `contact_messages`, `admin_users`)
- [ ] Public endpoints work: GET `/projects`, `/projects/{slug}`, `/experiences`, `/skills`, POST `/contact`
- [ ] Auth works: login → cookie set, `/auth/me` returns user, logout clears cookie
- [ ] Admin CRUD works: projects, experiences, skills, messages
- [ ] Image upload works with validation (magic number, size, extension)
- [ ] Rate limiting on `/contact` (5/min) and `/auth/login` (5/15min)
- [ ] Seed script creates initial admin idempotently
- [ ] Full test suite passes (~40+ tests)
- [ ] OpenAPI docs at `/docs`

- [ ] **Step 2: Tag the milestone**

Run:
```bash
git tag -a v0.1.0-api -m "Plan 1 complete: full backend API"
```

- [ ] **Step 3: Update README**

Modify `README.md` — add a "Status" section noting Plan 1 is done and what comes next.

```markdown
## Status

- ✅ **Plan 1: Backend API** — complete (`v0.1.0-api`)
- ⏳ **Plan 2: Frontend (Next.js)** — pending
- ⏳ **Plan 3: Deployment & migration** — pending

## Running the API

```bash
docker compose up -d
docker compose exec api uv run alembic upgrade head
docker compose exec api uv run python -m src.seed
# Open http://localhost:8000/docs
```
```

- [ ] **Step 4: Commit**

Run:
```bash
git add README.md
git commit -m "docs: update README with Plan 1 status"
```

---

## Definition of Done — Plan 1

The backend can:
1. Serve public portfolio content (projects, experiences, skills) via REST.
2. Accept contact form submissions with anti-bot protections.
3. Authenticate admins via JWT in httpOnly cookie.
4. Allow CRUD on projects, experiences, skills, messages (auth required).
5. Accept image uploads for projects with strict validation.
6. Run entirely in Docker with persistent SQLite volume.
7. Document itself via OpenAPI at `/docs`.

**Next plan:** Plan 2 will build the Next.js frontend (public pages + admin UI) consuming this API.
