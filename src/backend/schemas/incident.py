from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


class IncidentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="UUID инцидента")
    monitor_id: str = Field(..., description="UUID монитора")
    started_at: datetime = Field(..., description="Начало инцидента")
    resolved_at: datetime | None = Field(
        default=None, description="Конец инцидента (null = активный)"
    )

    @property
    def is_active(self) -> bool:
        return self.resolved_at is None

    @field_validator("id", "monitor_id", mode="before")
    @classmethod
    def uuid_to_str(cls, v: object) -> str:
        return str(v)
