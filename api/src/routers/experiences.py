from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.experience import ExperienceOut
from src.services import experience_service

router = APIRouter(prefix="/experiences", tags=["experiences"])


@router.get("", response_model=list[ExperienceOut])
def list_experiences(db: Session = Depends(get_db)) -> list:
    return experience_service.list_experiences(db)
