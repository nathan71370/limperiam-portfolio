from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    slug: str = Field(min_length=1, max_length=120, pattern=r"^[a-z0-9-]+$")
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1)
    content: str | None = None
    title_en: str | None = Field(default=None, max_length=200)
    description_en: str | None = None
    content_en: str | None = None
    tech_stack: list[str] = Field(default_factory=list)
    image_url: str | None = None
    repo_url: str | None = None
    live_url: str | None = None
    display_order: int = 0
    is_published: bool = False


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    slug: str | None = Field(default=None, min_length=1, max_length=120, pattern=r"^[a-z0-9-]+$")
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    content: str | None = None
    title_en: str | None = Field(default=None, max_length=200)
    description_en: str | None = None
    content_en: str | None = None
    tech_stack: list[str] | None = None
    image_url: str | None = None
    repo_url: str | None = None
    live_url: str | None = None
    display_order: int | None = None
    is_published: bool | None = None


class ProjectOut(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
