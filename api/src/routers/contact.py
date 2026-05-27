from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.schemas.contact import ContactCreate
from src.services import contact_service

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", status_code=status.HTTP_201_CREATED)
def post_contact(
    payload: ContactCreate,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    if contact_service.is_bot_submission(payload.website, payload.elapsed_ms):
        # Silently drop — don't tell bots they were detected
        return {"status": "ok"}

    ip = request.client.host if request.client else None
    contact_service.save_message(
        db,
        name=payload.name,
        email=payload.email,
        subject=payload.subject,
        message=payload.message,
        ip_address=ip,
    )
    return {"status": "ok"}
