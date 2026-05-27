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


def test_list_projects_returns_published_only(client: TestClient, db_session: Session) -> None:
    _create_project(db_session, slug="pub", is_published=True)
    _create_project(db_session, slug="draft", is_published=False)

    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["slug"] == "pub"


def test_list_projects_parses_tech_stack_as_list(client: TestClient, db_session: Session) -> None:
    _create_project(
        db_session,
        slug="parsed",
        is_published=True,
        tech_stack=json.dumps(["React", "Python"]),
    )

    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    assert response.json()[0]["tech_stack"] == ["React", "Python"]


def test_get_project_by_slug_returns_project(client: TestClient, db_session: Session) -> None:
    _create_project(db_session, slug="my-project", title="My Project", is_published=True)

    response = client.get("/api/v1/projects/my-project")
    assert response.status_code == 200
    assert response.json()["title"] == "My Project"


def test_get_project_unpublished_returns_404(client: TestClient, db_session: Session) -> None:
    _create_project(db_session, slug="draft", is_published=False)

    response = client.get("/api/v1/projects/draft")
    assert response.status_code == 404


def test_get_project_not_found(client: TestClient) -> None:
    response = client.get("/api/v1/projects/does-not-exist")
    assert response.status_code == 404
