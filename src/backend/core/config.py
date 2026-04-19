from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # App
    project_name: str = "Pingly"
    debug: bool = False
    log_level: str = "INFO"

    # Database
    database_url: str  # required: postgresql+asyncpg://user:pass@host:5432/db

    # JWT
    secret_key: str  # required: openssl rand -hex 32
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # Redis / Celery
    redis_url: str = "redis://localhost:6379/0"

    # CORS
    allowed_origins: str = "http://localhost:5173"

    # Telegram
    telegram_bot_token: str = ""
    telegram_chat_id: str = ""

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",") if o.strip()]


settings = Settings()
