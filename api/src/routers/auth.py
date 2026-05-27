from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from src.auth import create_access_token, verify_password
from src.config import get_settings
from src.database import get_db
from src.deps import COOKIE_NAME, get_current_admin
from src.models.admin_user import AdminUser
from src.rate_limit import limiter
from src.schemas.auth import AdminMe, LoginRequest

settings = get_settings()
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
@limiter.limit("5/15minutes")
def login(
    request: Request,
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    user = db.query(AdminUser).filter(AdminUser.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    token = create_access_token({"sub": str(user.id), "email": user.email})
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=not settings.debug,
        samesite="lax",
        max_age=settings.jwt_expire_minutes * 60,
        path="/",
    )
    return {"status": "ok"}


@router.post("/logout")
def logout(response: Response, _: AdminUser = Depends(get_current_admin)) -> dict[str, str]:
    response.delete_cookie(key=COOKIE_NAME, path="/")
    return {"status": "ok"}


@router.get("/me", response_model=AdminMe)
def me(current: AdminUser = Depends(get_current_admin)) -> dict:
    return {"id": current.id, "email": current.email}
