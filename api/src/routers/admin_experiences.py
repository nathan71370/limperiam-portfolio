from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.deps import get_current_admin
from src.schemas.experience import ExperienceCreate, ExperienceOut, ExperienceUpdate
from src.services import experience_service

router = APIRouter(
    prefix="/admin/experiences",
    tags=["admin:experiences"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[ExperienceOut])
def list_all(db: Session = Depends(get_db)) -> list:
    return experience_service.list_experiences(db)


@router.post("", response_model=ExperienceOut, status_code=status.HTTP_201_CREATED)
def create(payload: ExperienceCreate, db: Session = Depends(get_db)):
    return experience_service.create_experience(db, payload.model_dump())


@router.put("/{exp_id}", response_model=ExperienceOut)
def update(exp_id: int, payload: ExperienceUpdate, db: Session = Depends(get_db)):
    exp = experience_service.get_experience_by_id(db, exp_id)
    if exp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    return experience_service.update_experience(db, exp, payload.model_dump(exclude_unset=True))


@router.delete("/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(exp_id: int, db: Session = Depends(get_db)) -> None:
    exp = experience_service.get_experience_by_id(db, exp_id)
    if exp is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Experience not found")
    experience_service.delete_experience(db, exp)
