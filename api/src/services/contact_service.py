from sqlalchemy.orm import Session

from src.models.contact_message import ContactMessage


MIN_ELAPSED_MS = 2000


def is_bot_submission(website_honeypot: str, elapsed_ms: int) -> bool:
    """Return True if submission looks like a bot."""
    if website_honeypot.strip():
        return True
    if elapsed_ms < MIN_ELAPSED_MS:
        return True
    return False


def save_message(
    db: Session,
    name: str,
    email: str,
    subject: str | None,
    message: str,
    ip_address: str | None,
) -> ContactMessage:
    msg = ContactMessage(
        name=name,
        email=email,
        subject=subject,
        message=message,
        ip_address=ip_address,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg


def list_messages(db: Session) -> list[ContactMessage]:
    return db.query(ContactMessage).order_by(ContactMessage.created_at.desc()).all()


def get_message(db: Session, msg_id: int) -> ContactMessage | None:
    return db.query(ContactMessage).filter(ContactMessage.id == msg_id).first()


def update_message(db: Session, msg: ContactMessage, data: dict) -> ContactMessage:
    for key, value in data.items():
        setattr(msg, key, value)
    db.commit()
    db.refresh(msg)
    return msg


def delete_message(db: Session, msg: ContactMessage) -> None:
    db.delete(msg)
    db.commit()
