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
    db_session.add(
        Project(slug="pub", title="P", description="d", tech_stack="[]", is_published=True)
    )
    db_session.add(
        Project(slug="draft", title="D", description="d", tech_stack="[]", is_published=False)
    )
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


def test_create_project_duplicate_slug_returns_409(client: TestClient, db_session: Session) -> None:
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
    response = client.put(
        "/api/v1/admin/projects/999", json={"title": "X"}, cookies={COOKIE_NAME: token}
    )
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
