from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.skill import Skill


def test_list_skills_returns_all_sorted(client: TestClient, db_session: Session) -> None:
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
