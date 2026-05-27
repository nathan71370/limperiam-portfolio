from sqlalchemy import asc, desc
from sqlalchemy.orm import Session

from src.models.experience import Experience


def list_experiences(db: Session) -> list[Experience]:
    return (
        db.query(Experience)
        .order_by(asc(Experience.display_order), desc(Experience.start_date))
        .all()
    )


def get_experience_by_id(db: Session, exp_id: int) -> Experience | None:
    return db.query(Experience).filter(Experience.id == exp_id).first()


def create_experience(db: Session, data: dict) -> Experience:
    exp = Experience(**data)
    db.add(exp)
    db.commit()
    db.refresh(exp)
    return exp


def update_experience(db: Session, exp: Experience, data: dict) -> Experience:
    for key, value in data.items():
        setattr(exp, key, value)
    db.commit()
    db.refresh(exp)
    return exp


def delete_experience(db: Session, exp: Experience) -> None:
    db.delete(exp)
    db.commit()
