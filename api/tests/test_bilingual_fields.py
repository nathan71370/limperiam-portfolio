import json

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.auth import hash_password
from src.deps import COOKIE_NAME
from src.models.admin_user import AdminUser


def _login(client: TestClient, db: Session) -> str:
    user = AdminUser(email="a@b.com", password_hash=hash_password("pass1234"))
    db.add(user)
    db.commit()
    return client.post(
        "/api/v1/auth/login", json={"email": "a@b.com", "password": "pass1234"}
    ).cookies[COOKIE_NAME]


def test_create_project_with_bilingual_fields(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    payload = {
        "slug": "bilingual",
        "title": "Titre FR",
        "title_en": "EN Title",
        "description": "Description FR",
        "description_en": "EN Description",
        "content": "Contenu FR",
        "content_en": "EN Content",
        "tech_stack": ["Python"],
        "is_published": True,
    }
    response = client.post(
        "/api/v1/admin/projects", json=payload, cookies={COOKIE_NAME: token}
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["title"] == "Titre FR"
    assert data["title_en"] == "EN Title"
    assert data["description_en"] == "EN Description"
    assert data["content_en"] == "EN Content"


def test_create_experience_with_bilingual_fields(
    client: TestClient, db_session: Session
) -> None:
    token = _login(client, db_session)
    payload = {
        "company": "Acme",
        "role": "Dev FR",
        "role_en": "Dev EN",
        "description": "Desc FR",
        "description_en": "Desc EN",
        "start_date": "2023-01-01",
        "end_date": None,
        "location": "Paris",
        "location_en": "Paris",
        "display_order": 0,
    }
    response = client.post(
        "/api/v1/admin/experiences", json=payload, cookies={COOKIE_NAME: token}
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["role"] == "Dev FR"
    assert data["role_en"] == "Dev EN"
    assert data["description_en"] == "Desc EN"


def test_public_projects_returns_bilingual_fields(
    client: TestClient, db_session: Session
) -> None:
    from src.models.project import Project

    db_session.add(
        Project(
            slug="x",
            title="Titre",
            title_en="Title EN",
            description="Desc",
            description_en="Desc EN",
            tech_stack=json.dumps([]),
            is_published=True,
        )
    )
    db_session.commit()

    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    items = response.json()
    assert len(items) == 1
    assert items[0]["title"] == "Titre"
    assert items[0]["title_en"] == "Title EN"
    assert items[0]["description_en"] == "Desc EN"
