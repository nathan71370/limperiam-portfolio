from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.models.contact_message import ContactMessage


def _valid_payload(**overrides) -> dict:
    payload = {
        "name": "Test User",
        "email": "test@example.com",
        "subject": "Hello",
        "message": "This is a test message that is long enough.",
        "website": "",  # honeypot
        "elapsed_ms": 5000,
    }
    payload.update(overrides)
    return payload


def test_post_contact_saves_message(client: TestClient, db_session: Session) -> None:
    response = client.post("/api/v1/contact", json=_valid_payload())
    assert response.status_code == 201

    msgs = db_session.query(ContactMessage).all()
    assert len(msgs) == 1
    assert msgs[0].name == "Test User"
    assert msgs[0].email == "test@example.com"
    assert msgs[0].is_read is False


def test_post_contact_honeypot_filled_returns_201_but_does_not_save(
    client: TestClient, db_session: Session
) -> None:
    response = client.post(
        "/api/v1/contact", json=_valid_payload(website="http://spam.example.com")
    )
    # We return 201 to not signal bots that they were detected
    assert response.status_code == 201
    msgs = db_session.query(ContactMessage).all()
    assert len(msgs) == 0


def test_post_contact_too_fast_returns_201_but_does_not_save(
    client: TestClient, db_session: Session
) -> None:
    response = client.post("/api/v1/contact", json=_valid_payload(elapsed_ms=500))
    assert response.status_code == 201
    msgs = db_session.query(ContactMessage).all()
    assert len(msgs) == 0


def test_post_contact_invalid_email_returns_422(client: TestClient) -> None:
    response = client.post("/api/v1/contact", json=_valid_payload(email="not-an-email"))
    assert response.status_code == 422


def test_post_contact_message_too_short_returns_422(client: TestClient) -> None:
    response = client.post("/api/v1/contact", json=_valid_payload(message="short"))
    assert response.status_code == 422
