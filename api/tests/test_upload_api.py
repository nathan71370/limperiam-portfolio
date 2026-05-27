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


def test_upload_valid_image(client: TestClient, db_session: Session, isolated_upload_dir) -> None:
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
