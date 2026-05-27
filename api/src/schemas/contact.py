from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    subject: str | None = Field(default=None, max_length=200)
    message: str = Field(min_length=10, max_length=5000)
    # Anti-bot
    website: str = ""  # honeypot — must be empty
    elapsed_ms: int = Field(ge=0)  # ms between page load and submit; must be >= 2000


class ContactMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    email: str
    subject: str | None
    message: str
    is_read: bool
    created_at: datetime


class ContactMessageUpdate(BaseModel):
    is_read: bool
