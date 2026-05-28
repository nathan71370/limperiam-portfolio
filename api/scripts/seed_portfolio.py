"""Seed real portfolio content from the original artifact.

Reads the FR locale extracted in docs/superpowers/portfolio_content.js and
posts projects + experiences + skills via the admin API.

Idempotent: updates existing rows (PUT), inserts new ones (POST).

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
        "title_en": "Card fraud, automated — Crédit Agricole T&S",
        "description": "Plateforme de gestion des litiges fraude. Analyse préliminaire automatique, remboursement bout-en-bout, extension du workflow aux virements.",
        "description_en": "Fraud dispute management platform. Automated preliminary analysis, end-to-end reimbursement, dispute workflow extended to wire transfers.",
        "tech_stack": ["Java", "Spring", "Banque", "TDD"],
        "display_order": 1,
        "is_published": True,
    },
    {
        "slug": "walky-doggy",
        "title": "Une app pour promener, publiée — Walky Doggy",
        "title_en": "An app for dog walks, shipped — Walky Doggy",
        "description": "App iOS native, publiée sur l'App Store FR et EN. Backend Firebase, géolocalisation temps réel, marketplace promeneurs/propriétaires.",
        "description_en": "Native iOS app, live on the App Store in both FR and EN. Firebase backend, real-time geolocation, walker / owner marketplace.",
        "tech_stack": ["Swift", "Firebase", "App Store"],
        "live_url": "https://apps.apple.com/fr/app/walky-doggy/id6759481327",
        "display_order": 2,
        "is_published": True,
    },
    {
        "slug": "tennaxia",
        "title": "Suivi déchets, refactoré — Tennaxia",
        "title_en": "Waste tracking, refactored — Tennaxia",
        "description": "Application de monitoring de déchets, plans d'action et reporting. Refonte d'un module critique en TDD, agilité d'équipe à 15.",
        "description_en": "Waste monitoring app with action plans and reporting. Critical module rewritten via TDD, 15-dev agile team.",
        "tech_stack": ["Java", "Vue.js", "TDD"],
        "display_order": 3,
        "is_published": True,
    },
    {
        "slug": "cnaf",
        "title": "1M de lignes, 270 tables — CNAF",
        "title_en": "1M lines, 270 tables — CNAF",
        "description": "Application de gestion des subventions petite enfance. Études d'impact, refactoring de services, automatisation par création d'une appli annexe.",
        "description_en": "Subsidy management for early-childhood services. Impact studies, service refactoring, automation through a brand-new side application.",
        "tech_stack": ["Java", "Spring", "SCRUM"],
        "display_order": 4,
        "is_published": True,
    },
    {
        "slug": "marathon-perso",
        "title": "Plan d'entraînement, comme une app — marathon (perso)",
        "title_en": "A training plan, as an app — marathon (personal)",
        "description": "PWA personnelle pour le plan marathon — Run In Lyon 2026. SvelteKit, Tailwind, design éditorial. Système de couleurs et de tokens utilisé ici-même.",
        "description_en": "Personal PWA for my marathon plan — Run In Lyon 2026. SvelteKit, Tailwind, editorial design. The token system you're reading right now.",
        "tech_stack": ["SvelteKit", "TypeScript", "PWA", "Design"],
        "display_order": 5,
        "is_published": True,
    },
]

EXPERIENCES = [
    {
        "company": "Crédit Agricole T&S",
        "role": "Java Developer · Freelance",
        "role_en": "Java Developer · Freelance",
        "description": "Plateforme fraude bancaire — 30+ règles métier, 100% remboursements automatisés.",
        "description_en": "Banking fraud platform — 30+ business rules, 100% automated refunds.",
        "start_date": date(2023, 1, 1).isoformat(),
        "end_date": None,
        "location": "Lyon / Remote",
        "location_en": "Lyon / Remote",
        "display_order": 1,
    },
    {
        "company": "Walky Doggy",
        "role": "iOS · Firebase · solo",
        "role_en": "iOS · Firebase · solo",
        "description": "App iOS native publiée sur l'App Store. Backend Firebase, marketplace temps réel.",
        "description_en": "Native iOS app published on the App Store. Firebase backend, real-time marketplace.",
        "start_date": date(2026, 1, 1).isoformat(),
        "end_date": None,
        "location": "Anglefort",
        "location_en": "Anglefort",
        "display_order": 2,
    },
    {
        "company": "Tennaxia",
        "role": "Fullstack Java / Vue.js",
        "role_en": "Fullstack Java / Vue.js",
        "description": "Suivi déchets / reporting environnemental. Refonte module critique en TDD.",
        "description_en": "Waste tracking / environmental reporting. Critical module rewritten via TDD.",
        "start_date": date(2022, 1, 1).isoformat(),
        "end_date": date(2023, 1, 1).isoformat(),
        "location": "Laval",
        "location_en": "Laval",
        "display_order": 3,
    },
    {
        "company": "CNAF",
        "role": "Java Developer",
        "role_en": "Java Developer",
        "description": "Gestion des subventions petite enfance. 1M+ lignes, 270 tables, automatisation.",
        "description_en": "Early-childhood subsidy management. 1M+ lines, 270 tables, automation.",
        "start_date": date(2021, 1, 1).isoformat(),
        "end_date": date(2022, 1, 1).isoformat(),
        "location": "Paris",
        "location_en": "Paris",
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
    # When the API runs with secure=True (non-debug), httpx won't send the
    # Secure cookie over plain HTTP inside Docker. Extract the token from the
    # Set-Cookie header and inject it directly so subsequent requests work.
    set_cookie = resp.headers.get("set-cookie", "")
    if set_cookie and "access_token=" in set_cookie:
        token = set_cookie.split("access_token=")[1].split(";")[0]
        client.cookies.set("access_token", token)


def upsert_projects(client: httpx.Client) -> None:
    existing = {p["slug"]: p for p in client.get(f"{API_BASE}/admin/projects").json()}
    for p in PROJECTS:
        if p["slug"] in existing:
            existing_id = existing[p["slug"]]["id"]
            client.put(f"{API_BASE}/admin/projects/{existing_id}", json=p).raise_for_status()
            print(f"  ⟳ project {p['slug']} updated")
        else:
            client.post(f"{API_BASE}/admin/projects", json=p).raise_for_status()
            print(f"  + project {p['slug']}")


def upsert_experiences(client: httpx.Client) -> None:
    existing = {
        (e["company"], e["role"]): e
        for e in client.get(f"{API_BASE}/admin/experiences").json()
    }
    for e in EXPERIENCES:
        key = (e["company"], e["role"])
        if key in existing:
            existing_id = existing[key]["id"]
            client.put(f"{API_BASE}/admin/experiences/{existing_id}", json=e).raise_for_status()
            print(f"  ⟳ experience {e['company']} ({e['role']}) updated")
        else:
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
