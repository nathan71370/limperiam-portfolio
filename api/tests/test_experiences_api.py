from datetime import date

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.experience import Experience


def test_list_experiences_sorted_by_start_date_desc(
    client: TestClient, db_session: Session
) -> None:
    db_session.add(Experience(company="A", role="Dev", start_date=date(2022, 1, 1), display_order=0))
    db_session.add(Experience(company="B", role="Dev", start_date=date(2024, 1, 1), display_order=0))
    db_session.add(Experience(company="C", role="Dev", start_date=date(2023, 1, 1), display_order=0))
    db_session.commit()

    response = client.get("/api/v1/experiences")
    assert response.status_code == 200
    data = response.json()
    assert [exp["company"] for exp in data] == ["B", "C", "A"]


def test_list_experiences_empty(client: TestClient) -> None:
    response = client.get("/api/v1/experiences")
    assert response.status_code == 200
    assert response.json() == []
