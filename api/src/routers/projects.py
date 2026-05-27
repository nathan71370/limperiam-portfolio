import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.project import ProjectOut
from src.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


def _to_out(project) -> dict:
    return {
        "id": project.id,
        "slug": project.slug,
        "title": project.title,
        "description": project.description,
        "content": project.content,
        "tech_stack": json.loads(project.tech_stack or "[]"),
        "image_url": project.image_url,
        "repo_url": project.repo_url,
        "live_url": project.live_url,
        "display_order": project.display_order,
        "is_published": project.is_published,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session = Depends(get_db)) -> list[dict]:
    projects = project_service.list_published_projects(db)
    return [_to_out(p) for p in projects]


@router.get("/{slug}", response_model=ProjectOut)
def get_project(slug: str, db: Session = Depends(get_db)) -> dict:
    project = project_service.get_project_by_slug(db, slug, published_only=True)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return _to_out(project)
