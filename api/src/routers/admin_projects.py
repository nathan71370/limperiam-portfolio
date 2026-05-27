import json

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from src.config import get_settings
from src.database import get_db
from src.deps import get_current_admin
from src.schemas.project import ProjectCreate, ProjectOut, ProjectUpdate
from src.services import project_service
from src.services.upload_service import is_valid_image, save_upload

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


@router.post("/{project_id}/image", response_model=ProjectOut)
async def upload_image(
    project_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> dict:
    settings = get_settings()
    max_size_bytes = settings.upload_max_size_mb * 1024 * 1024

    project = project_service.get_project_by_id(db, project_id)
    if project is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    content = await file.read()
    if len(content) > max_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {settings.upload_max_size_mb} MB)",
        )
    if not is_valid_image(content, file.filename or ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image format",
        )

    public_path = save_upload(content, file.filename or "image", settings.upload_dir)
    updated = project_service.update_project(db, project, {"image_url": public_path})
    return _to_out(updated)
