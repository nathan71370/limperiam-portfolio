from sqlalchemy import asc
from sqlalchemy.orm import Session

from src.models.project import Project


def list_published_projects(db: Session) -> list[Project]:
    return (
        db.query(Project)
        .filter(Project.is_published.is_(True))
        .order_by(asc(Project.display_order), asc(Project.id))
        .all()
    )


def list_all_projects(db: Session) -> list[Project]:
    return db.query(Project).order_by(asc(Project.display_order), asc(Project.id)).all()


def get_project_by_slug(
    db: Session, slug: str, published_only: bool = True
) -> Project | None:
    query = db.query(Project).filter(Project.slug == slug)
    if published_only:
        query = query.filter(Project.is_published.is_(True))
    return query.first()


def get_project_by_id(db: Session, project_id: int) -> Project | None:
    return db.query(Project).filter(Project.id == project_id).first()


def create_project(db: Session, data: dict) -> Project:
    project = Project(**data)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project: Project, data: dict) -> Project:
    for key, value in data.items():
        setattr(project, key, value)
    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project: Project) -> None:
    db.delete(project)
    db.commit()
