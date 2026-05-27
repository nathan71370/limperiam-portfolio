from sqlalchemy.orm import Session

from src.models.project import Project
from src.services.project_service import get_project_by_slug, list_published_projects


def test_list_published_returns_only_published(db_session: Session) -> None:
    db_session.add(
        Project(
            slug="a",
            title="A",
            description="d",
            tech_stack="[]",
            is_published=True,
            display_order=2,
        )
    )
    db_session.add(
        Project(slug="b", title="B", description="d", tech_stack="[]", is_published=False)
    )
    db_session.add(
        Project(
            slug="c",
            title="C",
            description="d",
            tech_stack="[]",
            is_published=True,
            display_order=1,
        )
    )
    db_session.commit()

    results = list_published_projects(db_session)
    slugs = [p.slug for p in results]
    assert slugs == ["c", "a"]  # ordered by display_order asc


def test_get_by_slug_published_returns_project(db_session: Session) -> None:
    db_session.add(
        Project(slug="hello", title="H", description="d", tech_stack="[]", is_published=True)
    )
    db_session.commit()
    p = get_project_by_slug(db_session, "hello", published_only=True)
    assert p is not None
    assert p.slug == "hello"


def test_get_by_slug_unpublished_returns_none_when_published_only(db_session: Session) -> None:
    db_session.add(
        Project(slug="draft", title="D", description="d", tech_stack="[]", is_published=False)
    )
    db_session.commit()
    assert get_project_by_slug(db_session, "draft", published_only=True) is None
    assert get_project_by_slug(db_session, "draft", published_only=False) is not None
