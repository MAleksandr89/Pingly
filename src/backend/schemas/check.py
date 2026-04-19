from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CheckResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="UUID проверки")
    monitor_id: str = Field(..., description="UUID монитора")
    status: Literal["up", "down"] = Field(..., description="Результат проверки")
    response_time_ms: int | None = Field(
        default=None, description="Время ответа в мс (null при ошибке/таймауте)"
    )
    checked_at: datetime = Field(..., description="Время проверки")

    @field_validator("id", "monitor_id", mode="before")
    @classmethod
    def uuid_to_str(cls, v: object) -> str:
        return str(v)
