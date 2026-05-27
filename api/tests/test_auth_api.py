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
