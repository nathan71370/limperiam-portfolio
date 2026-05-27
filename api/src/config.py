from functools import lru_cache
from pydantic import EmailStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # App
    app_name: str = "Limperiam API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    # Database
    database_url: str = "sqlite:///./data/sqlite.db"

    # Auth
    jwt_secret: str = "change-me-in-production-min-32-chars-long"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24  # 24h

    # Admin seed
    admin_email: EmailStr = "admin@example.com"
    admin_password: str = "change-me-on-first-boot"

    # CORS (dev only)
    cors_origins: list[str] = ["http://localhost:3000"]

    # Cal.com
    calcom_webhook_secret: str = ""

    # SMTP
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    notification_email: EmailStr = "admin@example.com"

    # Upload
    upload_dir: str = "./data/uploads"
    upload_max_size_mb: int = 2


@lru_cache
def get_settings() -> Settings:
    return Settings()
