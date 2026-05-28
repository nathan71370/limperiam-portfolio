from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class ExperienceBase(BaseModel):
    company: str = Field(min_length=1, max_length=200)
    role: str = Field(min_length=1, max_length=200)
    description: str | None = None
    role_en: str | None = Field(default=None, max_length=200)
    description_en: str | None = None
    location_en: str | None = Field(default=None, max_length=200)
    start_date: date
    end_date: date | None = None
    location: str | None = Field(default=None, max_length=200)
    display_order: int = 0


class ExperienceCreate(ExperienceBase):
    pass


class ExperienceUpdate(BaseModel):
    company: str | None = Field(default=None, min_length=1, max_length=200)
    role: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    role_en: str | None = Field(default=None, max_length=200)
    description_en: str | None = None
    location_en: str | None = Field(default=None, max_length=200)
    start_date: date | None = None
    end_date: date | None = None
    location: str | None = None
    display_order: int | None = None


class ExperienceOut(ExperienceBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
