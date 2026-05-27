from sqlalchemy import asc
from sqlalchemy.orm import Session

from src.models.skill import Skill


def list_skills(db: Session) -> list[Skill]:
    return (
        db.query(Skill)
        .order_by(asc(Skill.display_order), asc(Skill.category), asc(Skill.name))
        .all()
    )


def get_skill_by_id(db: Session, skill_id: int) -> Skill | None:
    return db.query(Skill).filter(Skill.id == skill_id).first()


def create_skill(db: Session, data: dict) -> Skill:
    skill = Skill(**data)
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


def update_skill(db: Session, skill: Skill, data: dict) -> Skill:
    for key, value in data.items():
        setattr(skill, key, value)
    db.commit()
    db.refresh(skill)
    return skill


def delete_skill(db: Session, skill: Skill) -> None:
    db.delete(skill)
    db.commit()
