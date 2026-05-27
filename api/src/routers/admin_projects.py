import json

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.database import get_db
from src.deps import get_current_admin
from src.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from src.services import project_service

router = APIRouter(
    prefix="/admin/projects",
    tags=["admin:projects"],
    dependencies=[Depends(get_current_admin)],
)


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
def list_all(db: Session = Depends(get_db)) -> list[dict]:
    return [_to_out(p) for p in project_service.list_all_projects(db)]


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create(payload: ProjectCreate, db: Session = Depends(get_db)) -> dict:
    data = payload.model_dump()
    data["tech_stack"] = json.dumps(data["tech_stack"])
    try:
        project = project_service.create_project(db, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
    return _to_out(project)


@router.put("/{project_id}", response_model=ProjectOut)
def update(
    project_id: int, payload: ProjectUpdate, db: Session = Depends(get_db)
) -> dict:
    project = project_service.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    data = payload.model_dump(exclude_unset=True)
    if "tech_stack" in data:
        data["tech_stack"] = json.dumps(data["tech_stack"])
    try:
        updated = project_service.update_project(db, project, data)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Slug already exists")
    return _to_out(updated)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(project_id: int, db: Session = Depends(get_db)) -> None:
    project = project_service.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    project_service.delete_project(db, project)
