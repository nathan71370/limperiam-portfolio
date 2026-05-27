"""Seed initial data. Idempotent — safe to re-run."""

from src.auth import hash_password
from src.config import get_settings
from src.database import SessionLocal
from src.models.admin_user import AdminUser


def seed_admin() -> None:
    settings = get_settings()
    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.email == settings.admin_email).first()
        if existing:
            print(f"Admin {settings.admin_email} already exists, skipping.")
            return

        user = AdminUser(
            email=settings.admin_email,
            password_hash=hash_password(settings.admin_password),
        )
        db.add(user)
        db.commit()
        print(f"Created admin: {settings.admin_email}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
