from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from src.auth import hash_password
from src.deps import COOKIE_NAME
from src.models.admin_user import AdminUser
from src.models.contact_message import ContactMessage


def _login(client: TestClient, db: Session) -> str:
    user = AdminUser(email="a@b.com", password_hash=hash_password("pass1234"))
    db.add(user)
    db.commit()
    return client.post(
        "/api/v1/auth/login", json={"email": "a@b.com", "password": "pass1234"}
    ).cookies[COOKIE_NAME]


def test_list_messages_returns_all(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    db_session.add(ContactMessage(name="N1", email="a@b.com", message="hello world this is long"))
    db_session.add(ContactMessage(name="N2", email="c@d.com", message="hello world this is long"))
    db_session.commit()

    response = client.get("/api/v1/admin/messages", cookies={COOKIE_NAME: token})
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_mark_message_as_read(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    msg = ContactMessage(name="N", email="a@b.com", message="hello world this is long")
    db_session.add(msg)
    db_session.commit()

    response = client.patch(
        f"/api/v1/admin/messages/{msg.id}",
        json={"is_read": True},
        cookies={COOKIE_NAME: token},
    )
    assert response.status_code == 200
    assert response.json()["is_read"] is True


def test_delete_message(client: TestClient, db_session: Session) -> None:
    token = _login(client, db_session)
    msg = ContactMessage(name="N", email="a@b.com", message="hello world this is long")
    db_session.add(msg)
    db_session.commit()
    msg_id = msg.id

    response = client.delete(f"/api/v1/admin/messages/{msg_id}", cookies={COOKIE_NAME: token})
    assert response.status_code == 204
    assert db_session.query(ContactMessage).filter(ContactMessage.id == msg_id).first() is None
