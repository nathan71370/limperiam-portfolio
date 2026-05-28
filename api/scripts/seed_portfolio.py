"""Seed real portfolio content from the original artifact.

Reads the FR locale extracted in docs/superpowers/portfolio_content.js and
posts projects + experiences + skills via the admin API.

Idempotent: skips items whose slug/name already exists.

Run from inside the api container:
    docker compose exec api uv run python scripts/seed_portfolio.py
"""

from __future__ import annotations

import os
import sys
from datetime import date

import httpx

API_BASE = os.environ.get("API_BASE", "http://localhost:8000/api/v1")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "changeme")


PROJECTS = [
    {
        "slug": "credit-agricole-ts",
        "title": "Fraude bancaire, automatisée — Crédit Agricole T&S",
        "description": "Plateforme de gestion des litiges fraude. Analyse préliminaire automatique, remboursement bout-en-bout, extension du workflow aux virements.",
        "tech_stack": ["Java", "Spring", "Banque", "TDD"],
        "display_order": 1,
        "is_published": True,
    },
    {
        "slug": "walky-doggy",
        "title": "Une app pour promener, publiée — Walky Doggy",
        "description": "App iOS native, publiée sur l'App Store FR et EN. Backend Firebase, géolocalisation temps réel, marketplace promeneurs/propriétaires.",
        "tech_stack": ["Swift", "Firebase", "App Store"],
        "live_url": "https://apps.apple.com/fr/app/walky-doggy/id6759481327",
        "display_order": 2,
        "is_published": True,
    },
    {
        "slug": "tennaxia",
        "title": "Suivi déchets, refactoré — Tennaxia",
        "description": "Application de monitoring de déchets, plans d'action et reporting. Refonte d'un module critique en TDD, agilité d'équipe à 15.",
        "tech_stack": ["Java", "Vue.js", "TDD"],
        "display_order": 3,
        "is_published": True,
    },
    {
        "slug": "cnaf",
        "title": "1M de lignes, 270 tables — CNAF",
        "description": "Application de gestion des subventions petite enfance. Études d'impact, refactoring de services, automatisation par création d'une appli annexe.",
        "tech_stack": ["Java", "Spring", "SCRUM"],
        "display_order": 4,
        "is_published": True,
    },
    {
        "slug": "marathon-perso",
        "title": "Plan d'entraînement, comme une app — marathon (perso)",
        "description": "PWA personnelle pour le plan marathon — Run In Lyon 2026. SvelteKit, Tailwind, design éditorial. Système de couleurs et de tokens utilisé ici-même.",
        "tech_stack": ["SvelteKit", "TypeScript", "PWA", "Design"],
        "display_order": 5,
        "is_published": True,
    },
]

EXPERIENCES = [
    {
        "company": "Crédit Agricole T&S",
        "role": "Java Developer · Freelance",
        "description": "Plateforme fraude bancaire — 30+ règles métier, 100% remboursements automatisés.",
        "start_date": date(2023, 1, 1).isoformat(),
        "end_date": None,
        "location": "Lyon / Remote",
        "display_order": 1,
    },
    {
        "company": "Walky Doggy",
        "role": "iOS · Firebase · solo",
        "description": "App iOS native publiée sur l'App Store. Backend Firebase, marketplace temps réel.",
        "start_date": date(2026, 1, 1).isoformat(),
        "end_date": None,
        "location": "Anglefort",
        "display_order": 2,
    },
    {
        "company": "Tennaxia",
        "role": "Fullstack Java / Vue.js",
        "description": "Suivi déchets / reporting environnemental. Refonte module critique en TDD.",
        "start_date": date(2022, 1, 1).isoformat(),
        "end_date": date(2023, 1, 1).isoformat(),
        "location": "Laval",
        "display_order": 3,
    },
    {
        "company": "CNAF",
        "role": "Java Developer",
        "description": "Gestion des subventions petite enfance. 1M+ lignes, 270 tables, automatisation.",
        "start_date": date(2021, 1, 1).isoformat(),
        "end_date": date(2022, 1, 1).isoformat(),
        "location": "Paris",
        "display_order": 4,
    },
]

SKILLS = [
    *[
        {"name": n, "category": "backend", "display_order": i, "is_featured": i < 3}
        for i, n in enumerate([
            "Java 17+", "Spring Boot", "Spring Batch", "Hibernate", "Python", "MySQL"
        ])
    ],
    *[
        {"name": n, "category": "frontend", "display_order": i, "is_featured": i < 3}
        for i, n in enumerate([
            "SvelteKit", "Vue 3", "React", "TypeScript", "Tailwind", "Vite"
        ])
    ],
    *[
        {"name": n, "category": "tools", "display_order": i, "is_featured": False}
        for i, n in enumerate([
            "Swift", "SwiftUI", "Firebase", "App Store Connect"
        ])
    ],
    *[
        {"name": n, "category": "devops", "display_order": i, "is_featured": False}
        for i, n in enumerate([
            "Docker", "Kubernetes", "CI/CD", "Runtipi", "Linux"
        ])
    ],
    *[
        {"name": n, "category": "soft", "display_order": i, "is_featured": False}
        for i, n in enumerate([
            "TDD", "SCRUM", "Code review", "Git"
        ])
    ],
]


def login(client: httpx.Client) -> None:
    resp = client.post(
        f"{API_BASE}/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
    )
    resp.raise_for_status()


def upsert_projects(client: httpx.Client) -> None:
    existing = {p["slug"] for p in client.get(f"{API_BASE}/admin/projects").json()}
    for p in PROJECTS:
        if p["slug"] in existing:
            print(f"  ↷ project {p['slug']} exists, skipping")
            continue
        client.post(f"{API_BASE}/admin/projects", json=p).raise_for_status()
        print(f"  + project {p['slug']}")


def upsert_experiences(client: httpx.Client) -> None:
    existing_pairs = {
        (e["company"], e["role"]) for e in client.get(f"{API_BASE}/admin/experiences").json()
    }
    for e in EXPERIENCES:
        if (e["company"], e["role"]) in existing_pairs:
            print(f"  ↷ experience {e['company']}/{e['role']} exists, skipping")
            continue
        client.post(f"{API_BASE}/admin/experiences", json=e).raise_for_status()
        print(f"  + experience {e['company']} ({e['role']})")


def upsert_skills(client: httpx.Client) -> None:
    existing = {s["name"] for s in client.get(f"{API_BASE}/admin/skills").json()}
    for s in SKILLS:
        if s["name"] in existing:
            print(f"  ↷ skill {s['name']} exists, skipping")
            continue
        client.post(f"{API_BASE}/admin/skills", json=s).raise_for_status()
        print(f"  + skill {s['name']}")


def main() -> int:
    with httpx.Client(timeout=10.0) as client:
        try:
            login(client)
        except httpx.HTTPStatusError as e:
            print(f"Login failed: {e.response.status_code} {e.response.text}", file=sys.stderr)
            return 1

        print("Projects:")
        upsert_projects(client)
        print("Experiences:")
        upsert_experiences(client)
        print("Skills:")
        upsert_skills(client)
        print("Done.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
