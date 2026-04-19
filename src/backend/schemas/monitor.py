from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, HttpUrl, field_validator


class MonitorCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Название монитора")
    url: str = Field(..., description="URL для мониторинга (должен начинаться с http/https)")
    interval_minutes: int = Field(
        default=5, ge=1, le=1440, description="Интервал проверки в минутах (1–1440)"
    )
    is_active: bool = Field(default=True, description="Активен ли монитор")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL должен начинаться с http:// или https://")
        return v


class MonitorUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255, description="Название монитора")
    url: str | None = Field(default=None, description="URL для мониторинга")
    interval_minutes: int | None = Field(
        default=None, ge=1, le=1440, description="Интервал проверки в минутах"
    )
    is_active: bool | None = Field(default=None, description="Активен ли монитор")

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith(("http://", "https://")):
            raise ValueError("URL должен начинаться с http:// или https://")
        return v


class MonitorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="UUID монитора")
    user_id: str = Field(..., description="UUID владельца")
    name: str = Field(..., description="Название монитора")
    url: str = Field(..., description="Проверяемый URL")
    interval_minutes: int = Field(..., description="Интервал проверки в минутах")
    is_active: bool = Field(..., description="Активен ли монитор")
    created_at: datetime = Field(..., description="Дата создания")

    @field_validator("id", "user_id", mode="before")
    @classmethod
    def uuid_to_str(cls, v: object) -> str:
        return str(v)
