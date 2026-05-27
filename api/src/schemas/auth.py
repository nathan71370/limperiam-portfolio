from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AdminMe(BaseModel):
    id: int
    email: EmailStr
