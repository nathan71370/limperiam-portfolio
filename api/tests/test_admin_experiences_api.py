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
