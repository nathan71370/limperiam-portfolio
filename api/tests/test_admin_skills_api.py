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


def test_create_skill_invalid_category_returns_422(client: TestClient, db_session: Session) -> None:
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
