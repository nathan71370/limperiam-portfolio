from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.deps import get_current_admin
from src.schemas.skill import SkillCreate, SkillOut, SkillUpdate
from src.services import skill_service

router = APIRouter(
    prefix="/admin/skills",
    tags=["admin:skills"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[SkillOut])
def list_all(db: Session = Depends(get_db)) -> list:
    return skill_service.list_skills(db)


@router.post("", response_model=SkillOut, status_code=status.HTTP_201_CREATED)
def create(payload: SkillCreate, db: Session = Depends(get_db)):
    return skill_service.create_skill(db, payload.model_dump())


@router.put("/{skill_id}", response_model=SkillOut)
def update(skill_id: int, payload: SkillUpdate, db: Session = Depends(get_db)):
    skill = skill_service.get_skill_by_id(db, skill_id)
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    return skill_service.update_skill(db, skill, payload.model_dump(exclude_unset=True))


@router.delete("/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(skill_id: int, db: Session = Depends(get_db)) -> None:
    skill = skill_service.get_skill_by_id(db, skill_id)
    if skill is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    skill_service.delete_skill(db, skill)
