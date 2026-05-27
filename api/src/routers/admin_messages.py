from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.deps import get_current_admin
from src.schemas.contact import ContactMessageOut, ContactMessageUpdate
from src.services import contact_service

router = APIRouter(
    prefix="/admin/messages",
    tags=["admin:messages"],
    dependencies=[Depends(get_current_admin)],
)


@router.get("", response_model=list[ContactMessageOut])
def list_all(db: Session = Depends(get_db)) -> list:
    return contact_service.list_messages(db)


@router.patch("/{msg_id}", response_model=ContactMessageOut)
def update(msg_id: int, payload: ContactMessageUpdate, db: Session = Depends(get_db)):
    msg = contact_service.get_message(db, msg_id)
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    return contact_service.update_message(db, msg, payload.model_dump(exclude_unset=True))


@router.delete("/{msg_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(msg_id: int, db: Session = Depends(get_db)) -> None:
    msg = contact_service.get_message(db, msg_id)
    if msg is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    contact_service.delete_message(db, msg)
