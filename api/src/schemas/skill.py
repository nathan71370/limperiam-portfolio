from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

SkillCategory = Literal["frontend", "backend", "devops", "tools", "soft"]


class SkillBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    category: SkillCategory
    level: int | None = Field(default=None, ge=1, le=5)
    icon: str | None = None
    display_order: int = 0
    is_featured: bool = False


class SkillCreate(SkillBase):
    pass


class SkillUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    category: SkillCategory | None = None
    level: int | None = Field(default=None, ge=1, le=5)
    icon: str | None = None
    display_order: int | None = None
    is_featured: bool | None = None


class SkillOut(SkillBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
